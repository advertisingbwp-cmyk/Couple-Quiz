import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const BRAIN_SCREENSHOT_DIR = path.join(
  os.homedir(),
  ".gemini",
  "antigravity",
  "brain",
  "956a049b-93da-4862-8e45-b7f119df1ba8",
  "screenshots"
);
if (!fs.existsSync(BRAIN_SCREENSHOT_DIR)) {
  fs.mkdirSync(BRAIN_SCREENSHOT_DIR, { recursive: true });
}

function getBrowserExecutable() {
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
  }
  return "google-chrome";
}

const PORT = 9223;
const SERVER_PORT = 3006;
const BASE_URL = `http://localhost:${SERVER_PORT}`;
const userDataDir = path.join(os.tmpdir(), "edge-proto-qa-" + Date.now());

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    await sleep(400);
    const res = await this.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    const buffer = Buffer.from(res.data, "base64");
    const localPath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(localPath, buffer);
    const brainPath = path.join(BRAIN_SCREENSHOT_DIR, filename);
    fs.writeFileSync(brainPath, buffer);
    console.log(`[Screenshot Captured] ${filename} (${Math.round(buffer.length / 1024)} KB)`);
    return localPath;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runVisualQA() {
  console.log("=== PHASE 10.1 VISUAL QA AUTOMATION ===");

  // 1. Start Next.js production server on port 3006
  console.log(`Starting Next.js production server on port ${SERVER_PORT}...`);
  const serverProc = spawn("npx", ["next", "start", "-p", String(SERVER_PORT)], {
    shell: true,
    stdio: "pipe",
    env: { ...process.env, PORT: String(SERVER_PORT), NODE_ENV: "production" },
  });

  serverProc.stderr.on("data", (d) => {
    const str = d.toString();
    if (!str.includes("ExperimentalWarning")) console.error("[Server Error]", str);
  });

  // Wait for server ready
  let serverReady = false;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`${BASE_URL}/design-preview/question`);
      if (res.ok) {
        serverReady = true;
        break;
      }
    } catch {
      // wait
    }
    await sleep(300);
  }

  if (!serverReady) {
    serverProc.kill();
    throw new Error("Next.js server failed to respond on port " + SERVER_PORT);
  }
  console.log("Next.js server is ready at " + BASE_URL);

  // 2. Start Headless Browser
  const browserPath = getBrowserExecutable();
  console.log(`Starting headless browser: ${browserPath}...`);
  const browserProc = spawn(browserPath, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--window-size=1280,900",
  ]);

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
    browserProc.kill();
    serverProc.kill();
    throw new Error("Browser debugging port failed to open.");
  }

  // Create new page session
  const newTabRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${BASE_URL}/design-preview/question`, { method: "PUT" });
  const targetTab = await newTabRes.json();
  const client = new CDPClient(targetTab.webSocketDebuggerUrl);
  await client.connect();

  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("DOM.enable");

  try {
    console.log("Navigating to /design-preview/question...");
    await client.send("Page.navigate", { url: `${BASE_URL}/design-preview/question` });
    await sleep(1500); // Wait for hydration and image rendering

    // Test 1: 320px Mobile Screen (2 options)
    console.log("\n[Test 1] 320px Extra-Narrow Mobile (2 Options)...");
    await client.setViewport(320, 680);
    await client.screenshot("prototype_01_320px_2opt.png");

    // Test 2: 375px Standard Mobile (2 options)
    console.log("\n[Test 2] 375px Standard Mobile (2 Options)...");
    await client.setViewport(375, 750);
    await client.screenshot("prototype_02_375px_2opt.png");

    // Test 3: Switch to 4 Options
    console.log("\n[Test 3] 375px Standard Mobile (4 Options)...");
    await client.eval(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '4');
      if (btn) btn.click();
    `);
    await sleep(400);
    await client.screenshot("prototype_03_375px_4opt.png");

    // Test 4: Switch to 6 Options
    console.log("\n[Test 4] 375px Standard Mobile (6 Options)...");
    await client.eval(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '6');
      if (btn) btn.click();
    `);
    await sleep(400);
    await client.screenshot("prototype_04_375px_6opt.png");

    // Test 5: Switch to 9 Options
    console.log("\n[Test 5] 375px Standard Mobile (9 Options)...");
    await client.eval(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '9');
      if (btn) btn.click();
    `);
    await sleep(400);
    await client.screenshot("prototype_05_375px_9opt.png");

    // Test 6: 430px Large Mobile (Selected State)
    console.log("\n[Test 6] 430px Large Mobile with Option Selected...");
    await client.setViewport(430, 820);
    // Switch back to 4 options and select burger
    await client.eval(`
      const btn4 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '4');
      if (btn4) btn4.click();
      const burgerCard = Array.from(document.querySelectorAll('[role="button"]')).find(el => el.textContent.includes('Burger'));
      if (burgerCard) burgerCard.click();
    `);
    await sleep(400);
    await client.screenshot("prototype_06_430px_selected.png");

    // Test 7: Correct Feedback Demo
    console.log("\n[Test 7] 375px Correct Feedback Demo State...");
    await client.setViewport(375, 750);
    await client.eval(`
      const correctBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Correct'));
      if (correctBtn) correctBtn.click();
    `);
    await sleep(400);
    await client.screenshot("prototype_07_375px_correct_feedback.png");

    // Test 8: Incorrect Feedback Demo
    console.log("\n[Test 8] 375px Incorrect Feedback Demo State...");
    await client.eval(`
      const incorrectBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Incorrect'));
      if (incorrectBtn) incorrectBtn.click();
    `);
    await sleep(400);
    await client.screenshot("prototype_08_375px_incorrect_feedback.png");

    // Test 9: 768px Tablet View
    console.log("\n[Test 9] 768px Tablet View (6 Options)...");
    await client.setViewport(768, 920);
    await client.eval(`
      const normalBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Normal');
      if (normalBtn) normalBtn.click();
      const btn6 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '6');
      if (btn6) btn6.click();
    `);
    await sleep(500);
    await client.screenshot("prototype_09_768px_tablet.png");

    // Test 10: 1280px Desktop View
    console.log("\n[Test 10] 1280px Desktop View (Centered Layout with Ambient Light)...");
    await client.setViewport(1280, 920);
    await client.eval(`
      const btn4 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '4');
      if (btn4) btn4.click();
      const thinkingBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Thinking');
      if (thinkingBtn) thinkingBtn.click();
    `);
    await sleep(500);
    await client.screenshot("prototype_10_1280px_desktop.png");

    console.log("\n==========================================");
    console.log("CONSOLE LOGS & ERRORS AUDIT:");
    console.log("==========================================");
    if (client.consoleLogs.length === 0) {
      console.log("Clean console: 0 browser errors or warnings!");
    } else {
      client.consoleLogs.forEach((l) => console.log(`  [${l.type}] ${l.text}`));
    }

    console.log("\nALL VISUAL QA AUTOMATION COMPLETED SUCCESSFULLY!");
  } finally {
    client.close();
    browserProc.kill();
    serverProc.kill();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

runVisualQA().catch((err) => {
  console.error("Visual QA failed:", err);
  process.exit(1);
});
