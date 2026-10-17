import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import robots from "../app/robots";

test("Phase 10.1: Prototype route /design-preview/ is blocked from search engine indexing", () => {
  const robotsConfig = robots();
  assert.ok(robotsConfig.rules, "Robots config must contain rules");
  const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;
  const disallows = Array.isArray(rules.disallow) ? rules.disallow : [rules.disallow];

  assert.ok(
    disallows.some((rule) => rule === "/design-preview/" || rule === "/design-preview"),
    "robots.txt must explicitly disallow /design-preview/"
  );
});

test("Phase 10.1: All prototype real-photo assets exist locally with webp and jpg formats", () => {
  const photosDir = path.resolve(process.cwd(), "public/prototype/photos");
  assert.ok(fs.existsSync(photosDir), "public/prototype/photos must exist");

  const expectedAssets = [
    "pizza",
    "burger",
    "sleeping",
    "studying",
    "coffee",
    "roadtrip",
    "beach",
    "gaming",
    "concert",
  ];

  for (const asset of expectedAssets) {
    const webpPath = path.join(photosDir, `${asset}.webp`);
    const jpgPath = path.join(photosDir, `${asset}.jpg`);

    assert.ok(fs.existsSync(webpPath), `Missing webp asset: ${asset}.webp`);
    assert.ok(fs.existsSync(jpgPath), `Missing jpg fallback asset: ${asset}.jpg`);

    const webpStat = fs.statSync(webpPath);
    const jpgStat = fs.statSync(jpgPath);

    assert.ok(webpStat.size > 1000, `webp asset ${asset}.webp must be non-empty`);
    assert.ok(jpgStat.size > 1000, `jpg asset ${asset}.jpg must be non-empty`);
  }
});

test("Phase 10.1: Prototype licensing and attribution documentation exists and is complete", () => {
  const docPath = path.resolve(process.cwd(), "docs/prototype-assets-licensing.md");
  assert.ok(fs.existsSync(docPath), "docs/prototype-assets-licensing.md must exist");

  const content = fs.readFileSync(docPath, "utf-8");
  assert.match(content, /pizza\.webp/);
  assert.match(content, /burger\.webp/);
  assert.match(content, /sleeping\.webp/);
  assert.match(content, /studying\.webp/);
  assert.match(content, /coffee\.webp/);
  assert.match(content, /roadtrip\.webp/);
  assert.match(content, /beach\.webp/);
  assert.match(content, /gaming\.webp/);
  assert.match(content, /concert\.webp/);
  assert.match(content, /AI-generated original photographic asset/);
});
