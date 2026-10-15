import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// 1. Configurable project-relative screenshot directory
const defaultScreenshotDir = path.resolve(process.cwd(), "screenshots");
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || defaultScreenshotDir;
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Optional secondary directory for brain artifacts if available
const BRAIN_SCREENSHOT_DIR = process.env.BRAIN_SCREENSHOT_DIR || (
  process.env.USERPROFILE || process.env.HOME
    ? path.join(
        process.env.USERPROFILE || process.env.HOME || "",
        ".gemini",
        "antigravity",
        "brain",
        "956a049b-93da-4862-8e45-b7f119df1ba8",
        "screenshots"
      )
    : null
);

// 2. Configurable browser executable path
function getBrowserExecutable() {
  if (process.env.BROWSER_PATH) return process.env.BROWSER_PATH;
  if (process.env.EDGE_PATH) return process.env.EDGE_PATH;
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

  const platform = os.platform();
  if (platform === "win32") {
    const candidates = [
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      path.join(os.homedir(), "AppData", "Local", "Microsoft", "Edge", "Application", "msedge.exe"),
      path.join(os.homedir(), "AppData", "Local", "Google", "Chrome", "Application", "chrome.exe"),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return "msedge.exe";
  } else if (platform === "darwin") {
    const candidates = [
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return "google-chrome";
  } else {
    const candidates = [
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/usr/bin/microsoft-edge",
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return "google-chrome";
  }
}

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3005";
const PORT = 9222;
const userDataDir = path.join(os.tmpdir(), "edge-qa-profile-" + Date.now());

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startBrowser() {
  const browserPath = getBrowserExecutable();
  console.log(`Using browser executable: ${browserPath}`);

  const proc = spawn(browserPath, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--window-size=1280,900",
  ]);

  proc.on("error", (err) => {
    console.error("Failed to start browser:", err);
  });

  // Wait for remote debugging to be ready
  let versionData = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch {
      // wait
    }
    await sleep(200);
  }

  if (!versionData) {
    proc.kill();
    throw new Error(`Browser did not start on port ${PORT} with path ${browserPath}`);
  }

  console.log("Browser started. Connecting to CDP WebSocket...");
  return { proc, versionData };
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 0;
    this.pending = new Map();
    this.consoleLogs = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new globalThis.WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { res, rej } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) rej(new Error(msg.error.message));
          else res(msg.result);
        } else if (msg.method === "Runtime.consoleAPICalled") {
          const text = msg.params.args.map((a) => a.value || a.description || "").join(" ");
          this.consoleLogs.push({ type: msg.params.type, text });
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId;
      this.pending.set(id, { res: resolve, rej: reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result ? res.result.value : undefined;
  }

  async setViewport(width, height) {
    await this.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: width < 768,
    });
  }

  async screenshot(filename) {
    await sleep(500); // Allow render/animation to settle
    const res = await this.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    const buffer = Buffer.from(res.data, "base64");
    const outPath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(outPath, buffer);

    if (BRAIN_SCREENSHOT_DIR && fs.existsSync(BRAIN_SCREENSHOT_DIR)) {
      try {
        fs.writeFileSync(path.join(BRAIN_SCREENSHOT_DIR, filename), buffer);
      } catch {
        // Non-blocking secondary sync
      }
    }

    console.log(`Saved screenshot: ${filename} (${buffer.length} bytes) to ${outPath}`);
    return outPath;
  }

  async navigate(url) {
    await this.send("Page.navigate", { url });
    await sleep(1200); // Wait for initial render
  }

  async type(selector, text) {
    await this.eval(`
      const el = document.querySelector('${selector}');
      if (el) {
        el.focus();
        el.value = '';
      }
    `);
    for (const ch of text) {
      await this.send("Input.dispatchKeyEvent", {
        type: "keyDown",
        text: ch,
      });
      await this.send("Input.dispatchKeyEvent", {
        type: "keyUp",
      });
      await sleep(40);
    }
  }
}

async function runQA() {
  const { proc } = await startBrowser();
  let createdQuizId = null;
  let creatorToken = null;

  try {
    const listRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === "page") || targets[0];

    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();
    await client.send("Page.enable");
    await client.send("Runtime.enable");

    console.log("\n==========================================");
    console.log("STEP 1: QUIZ CREATOR TESTING & SCREENSHOTS");
    console.log("==========================================");

    // Initial navigation
    await client.navigate(`${BASE_URL}/quiz/create`);
    await client.setViewport(375, 812);

    // Populate sessionStorage and reload to load full quiz deck as creator "Ayesha"
    await client.eval(`
      sessionStorage.setItem('creator_name', 'Ayesha');
      sessionStorage.setItem('creator_gender', 'female');
      location.reload();
    `);
    await sleep(1500);

    // Question 1 in default deck: q1 (Talents) has 9 OPTIONS!
    console.log("\nTesting 9-Option Question (q1)...");
    const q1Title = await client.eval(`document.querySelector('article h1')?.innerText`);
    const q1OptionsCount = await client.eval(`document.querySelectorAll('[role="radio"]')?.length`);
    console.log(`Current Question: "${q1Title}" with ${q1OptionsCount} options`);

    // Verify all 9 options have valid image elements with src and readable text
    const q1OptData = await client.eval(`
      Array.from(document.querySelectorAll('[role="radio"]')).map(btn => ({
        text: btn.innerText.replace(/\\n/g, ' ').trim(),
        hasImg: Boolean(btn.querySelector('img')),
        imgSrc: btn.querySelector('img')?.src || '',
        naturalWidth: btn.querySelector('img')?.naturalWidth || 0,
      }))
    `);
    console.log("9-Option Cards Verification:");
    q1OptData.forEach((opt, idx) => {
      console.log(`  [Opt ${idx}] Text: "${opt.text}", Image: ${opt.imgSrc.split('/').pop()}, Width: ${opt.naturalWidth}px`);
    });

    // Capture 9-option at various viewport sizes:
    // 375px (iPhone standard)
    await client.setViewport(375, 812);
    await client.screenshot("creator_01_9opt_375px.png");

    // 320px (Compact mobile)
    await client.setViewport(320, 640);
    await client.screenshot("creator_01_9opt_320px.png");

    // 768px (Tablet)
    await client.setViewport(768, 1024);
    await client.screenshot("creator_01_9opt_768px.png");

    // 1280px (Desktop)
    await client.setViewport(1280, 800);
    await client.screenshot("creator_01_9opt_1280px.png");

    // Select Option 0 and proceed to Q2
    await client.setViewport(375, 812);
    await client.eval(`document.querySelectorAll('[role="radio"]')[0].click()`);
    await sleep(400);
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Next') || b.querySelector('svg.lucide-arrow-right'))?.click()`);
    await sleep(800);

    // Question 2: q2 has 4 OPTIONS
    console.log("\nTesting 4-Option Question (q2)...");
    const q2Title = await client.eval(`document.querySelector('article h1')?.innerText`);
    const q2OptionsCount = await client.eval(`document.querySelectorAll('[role="radio"]')?.length`);
    console.log(`Current Question: "${q2Title}" with ${q2OptionsCount} options`);
    await client.screenshot("creator_02_4opt_375px.png");

    // Select Option 1 and proceed
    await client.eval(`document.querySelectorAll('[role="radio"]')[1].click()`);
    await sleep(400);
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Next') || b.querySelector('svg.lucide-arrow-right'))?.click()`);
    await sleep(800);

    // Now skip until we find a 6-option question (e.g. q8 Dream Destinations)
    console.log("\nSearching for 6-Option Question using Skip...");
    let found6 = false;
    for (let i = 0; i < 25; i++) {
      const count = await client.eval(`document.querySelectorAll('[role="radio"]')?.length`);
      if (count === 6) {
        found6 = true;
        const title = await client.eval(`document.querySelector('article h1')?.innerText`);
        console.log(`Found 6-Option Question: "${title}" (count = 6)`);
        await client.screenshot("creator_03_6opt_375px.png");
        // Select an option
        await client.eval(`document.querySelectorAll('[role="radio"]')[2].click()`);
        await sleep(400);
        await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Next') || b.querySelector('svg.lucide-arrow-right'))?.click()`);
        await sleep(800);
        break;
      }
      await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Skip'))?.click()`);
      await sleep(400);
    }
    if (!found6) console.warn("Could not find 6-option question via skip");

    // Now skip until we find a 2-option question
    console.log("\nSearching for 2-Option Question using Skip...");
    let found2 = false;
    for (let i = 0; i < 40; i++) {
      const count = await client.eval(`document.querySelectorAll('[role="radio"]')?.length`);
      if (count === 2) {
        found2 = true;
        const title = await client.eval(`document.querySelector('article h1')?.innerText`);
        console.log(`Found 2-Option Question: "${title}" (count = 2)`);
        await client.screenshot("creator_04_2opt_375px.png");
        await client.eval(`document.querySelectorAll('[role="radio"]')[0].click()`);
        await sleep(400);
        await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Next') || b.querySelector('svg.lucide-arrow-right'))?.click()`);
        await sleep(800);
        break;
      }
      await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Skip'))?.click()`);
      await sleep(400);
    }
    if (!found2) console.warn("Could not find 2-option question via skip");

    // Test Back button functionality
    console.log("\nTesting Back button functionality...");
    const counterBeforeBack = await client.eval(`document.querySelector('header span.bg-\\\\[\\\\#ffce71\\\\]')?.innerText`);
    console.log(`Counter before back: "${counterBeforeBack}"`);
    await client.eval(`document.querySelector('button[aria-label="Previous question"]')?.click()`);
    await sleep(600);
    const counterAfterBack = await client.eval(`document.querySelector('header span.bg-\\\\[\\\\#ffce71\\\\]')?.innerText`);
    console.log(`Counter after back: "${counterAfterBack}"`);
    const isSelectionRestored = await client.eval(`Boolean(document.querySelector('[role="radio"][aria-checked="true"]'))`);
    console.log("Is selection restored after stepping back:", isSelectionRestored);

    // Proceed forward again
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Next') || b.querySelector('svg.lucide-arrow-right'))?.click()`);
    await sleep(800);

    // Complete questions until 10 questions are answered
    console.log("\nAnswering remaining questions to reach exactly 10 questions...");
    for (let step = 0; step < 15; step++) {
      const isPinModalOpen = await client.eval(`document.getElementById('secret-pin-input') !== null`);
      if (isPinModalOpen) {
        console.log("Reached completed state & PIN modal!");
        break;
      }
      await client.eval(`document.querySelectorAll('[role="radio"]')[0]?.click()`);
      await sleep(300);
      await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Next') || b.innerText.includes('Finish') || b.querySelector('svg.lucide-arrow-right'))?.click()`);
      await sleep(600);
    }

    // Capture PIN modal
    await client.screenshot("creator_05_pin_modal_375px.png");

    // Test "Edit questions before publishing" button
    console.log("\nTesting 'Edit questions before publishing'...");
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Edit questions'))?.click()`);
    await sleep(600);
    const editingCounter = await client.eval(`document.querySelector('header span.bg-\\\\[\\\\#ffce71\\\\]')?.innerText`);
    console.log(`Counter when editing last question: "${editingCounter}" (Expected: 9 of 10 selected, editing Q10)`);
    // Re-click Next to reopen PIN modal
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Next') || b.innerText.includes('Finish') || b.querySelector('svg.lucide-arrow-right'))?.click()`);
    await sleep(800);

    // Enter PIN and Publish Quiz
    console.log("\nEntering secret PIN and publishing challenge...");
    await client.type("#secret-pin-input", "8899");
    await sleep(400);

    // Click publish button: "Get My Share Link!"
    await client.eval(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('share link'));
      btn?.click();
    `);
    await sleep(4500); // Wait for publishing and redirection

    let currentUrl = await client.eval(`window.location.href`);
    console.log("Redirected to:", currentUrl);

    // Extract quizId
    const quizIdMatch = currentUrl.match(/\/quiz\/share\/([a-zA-Z0-9_-]+)/);
    if (!quizIdMatch) {
      throw new Error("Failed to get quizId from share page URL: " + currentUrl);
    }
    const quizId = quizIdMatch[1];
    createdQuizId = quizId;
    console.log("Successfully created Quiz ID:", quizId);

    // Extract creatorToken from localStorage for authorized cleanup
    try {
      creatorToken = await client.eval(`localStorage.getItem('creator_token_${quizId}')`);
      if (creatorToken) {
        console.log("Creator token present in localStorage: YES (masked)");
      }
    } catch {
      // Ignore
    }

    console.log("\n==========================================");
    console.log("PHASE 7: SOCIAL SHARE PAGE RESPONSIVE AUDIT");
    console.log("==========================================");

    // 1. 375px Mobile Viewport
    await client.setViewport(375, 812);
    await sleep(400);
    await client.screenshot("creator_06_share_page_375px.png");
    await client.screenshot("share_02_share_page_375px.png");

    // Test Copy Link Button and feedback
    console.log("Testing Copy Link button feedback...");
    await client.eval(`
      const copyBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Copy'));
      copyBtn?.click();
    `);
    await sleep(300);
    const isCopiedShown = await client.eval(`
      Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Copied'))
    `);
    console.log("Copy Link feedback ('Copied!') displayed:", isCopiedShown);

    // 2. 320px Narrow Mobile Viewport
    await client.setViewport(320, 568);
    await sleep(400);
    const hasHorizontalScroll320 = await client.eval(`document.documentElement.scrollWidth > window.innerWidth`);
    console.log("320px narrow mobile horizontal overflow:", hasHorizontalScroll320 ? "FAIL (overflow)" : "PASS (no overflow)");
    await client.screenshot("share_01_share_page_320px.png");

    // 3. 768px Tablet Viewport
    await client.setViewport(768, 1024);
    await sleep(400);
    await client.screenshot("share_03_share_page_768px.png");

    // 4. 1280px Desktop Viewport
    await client.setViewport(1280, 800);
    await sleep(400);
    await client.screenshot("share_04_share_page_1280px.png");

    // Reset to 375px for player flow
    await client.setViewport(375, 812);

    console.log("\n==========================================");
    console.log("STEP 2: PLAYER FLOW TESTING & SCREENSHOTS");
    console.log("==========================================");

    // Navigate to Player Page
    await client.navigate(`${BASE_URL}/quiz/play/${quizId}`);
    await client.setViewport(375, 812);
    await sleep(1000);

    // Capture Welcome Screen
    await client.screenshot("player_01_welcome_375px.png");

    // Enter Player Name
    console.log("Entering Player Name 'Zainab'...");
    await client.type("#player-name-input", "Zainab");
    await sleep(400);
    await client.eval(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('accept challenge'));
      btn?.click();
    `);
    await sleep(1500);

    console.log("Player Challenge started!");
    let capturedPlayerTypes = { 2: false, 4: false, 6: false, 9: false };

    for (let qIdx = 0; qIdx < 10; qIdx++) {
      const qTitle = await client.eval(`document.querySelector('article h2')?.innerText`);
      const optCount = await client.eval(`document.querySelectorAll('[role="radio"]')?.length`);
      console.log(`Player Question ${qIdx + 1}: "${qTitle}" (${optCount} options)`);

      if (optCount === 9 && !capturedPlayerTypes[9]) {
        await client.screenshot("player_02_9opt_375px.png");
        await client.setViewport(320, 640);
        await client.screenshot("player_02_9opt_320px.png");
        await client.setViewport(375, 812);
        capturedPlayerTypes[9] = true;
      } else if (optCount === 4 && !capturedPlayerTypes[4]) {
        await client.screenshot("player_03_4opt_375px.png");
        capturedPlayerTypes[4] = true;
      } else if (optCount === 6 && !capturedPlayerTypes[6]) {
        await client.screenshot("player_04_6opt_375px.png");
        capturedPlayerTypes[6] = true;
      } else if (optCount === 2 && !capturedPlayerTypes[2]) {
        await client.screenshot("player_05_2opt_375px.png");
        capturedPlayerTypes[2] = true;
      }

      const imgsValid = await client.eval(`
        Array.from(document.querySelectorAll('article img')).every(img => img.naturalWidth > 0)
      `);
      console.log(`  All images valid in Q${qIdx + 1}:`, imgsValid);

      await client.eval(`document.querySelectorAll('[role="radio"]')[0]?.click()`);
      await sleep(1000);
    }

    console.log("Waiting for score calculation and redirection to Result page...");
    await sleep(4500);

    const resultUrl = await client.eval(`window.location.href`);
    console.log("Result page URL:", resultUrl);
    await sleep(4000);
    await client.screenshot("player_06_result_375px.png");

    const resultScore = await client.eval(`document.querySelector('main span.text-5xl, main span.text-6xl')?.innerText`);
    console.log("Final Calculated Score:", resultScore);

    // Navigate to Scoreboard
    console.log("\nNavigating to Scoreboard page...");
    await client.navigate(`${BASE_URL}/quiz/scoreboard/${quizId}`);
    for (let i = 0; i < 20; i++) {
      const isLoading = await client.eval(`document.body.innerText.includes('Loading player scores')`);
      if (!isLoading) break;
      await sleep(300);
    }
    await sleep(500);
    await client.screenshot("player_07_scoreboard_375px.png");

    // Verify creator mode is unlocked on this device
    const isCreatorBadgePresent = await client.eval(`document.body.innerText.includes('Creator Mode')`);
    console.log("Scoreboard Creator Mode unlocked on creator device:", isCreatorBadgePresent);

    // Test viewing answers
    console.log("Testing detailed answers viewing...");
    await client.eval(`document.querySelector('button[title*="View Answers"]')?.click()`);
    let isModalOpen = false;
    for (let i = 0; i < 15; i++) {
      isModalOpen = await client.eval(`Boolean(document.querySelector('div.fixed h3'))`);
      if (isModalOpen) break;
      await sleep(300);
    }
    console.log("Answers breakdown modal opened successfully:", isModalOpen);
    if (isModalOpen) {
      await client.eval(`document.querySelector('div.fixed button svg.lucide-x')?.parentElement?.click()`);
      await sleep(500);
    }

    console.log("\n==========================================");
    console.log("STEP 3: CONSOLE LOGS & WARNINGS AUDIT");
    console.log("==========================================");
    if (client.consoleLogs.length === 0) {
      console.log("Console Clean: 0 browser warnings or errors!");
    } else {
      console.log(`Browser logged ${client.consoleLogs.length} events:`);
      client.consoleLogs.forEach((l) => console.log(`  [${l.type}] ${l.text}`));
    }

    console.log("\nALL VISUAL QA AUTOMATION COMPLETED SUCCESSFULLY!");
  } finally {
    // Automatic Test Data Cleanup
    if (createdQuizId) {
      console.log("\n==========================================");
      console.log("CLEANUP: DELETING TEST QUIZ & ATTEMPTS");
      console.log("==========================================");
      try {
        const deletePayload = creatorToken ? { creatorToken } : { pin: "8899" };
        const res = await fetch(`${BASE_URL}/api/quiz/${createdQuizId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deletePayload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          console.log(`[QA Cleanup] PASS: Test quiz ${createdQuizId} and all associated attempts successfully deleted.`);
          // Verify deletion
          const verifyRes = await fetch(`${BASE_URL}/api/quiz/${createdQuizId}`);
          if (verifyRes.status === 404) {
            console.log(`[QA Cleanup] VERIFIED: Quiz ${createdQuizId} is confirmed deleted (HTTP 404).`);
          }
        } else {
          console.warn(`[QA Cleanup] WARNING: Failed to delete test quiz ${createdQuizId} (Status ${res.status}):`, data.error || "Unknown error");
        }
      } catch (cleanupErr) {
        console.error(`[QA Cleanup] ERROR: Exception while deleting test quiz ${createdQuizId}:`, cleanupErr.message);
      }
    }

    proc.kill();
  }
}

runQA().catch((err) => {
  console.error("QA automation failed:", err);
  process.exit(1);
});
