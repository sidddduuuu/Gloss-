// Headless walkthrough of the README §8 demo script. Verifies the full UI loop and
// captures a screenshot at each beat into .context/demo-shots/.
import { chromium } from "playwright";
import fs from "node:fs";

const OUT = ".context/demo-shots";
fs.mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:3000";

function assert(cond, msg) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
  console.log("  ✓ " + msg);
}

// Select text inside the rendered PDF text layer by matching a substring.
async function selectPhrase(page, phrase) {
  const handle = await page.evaluateHandle((needle) => {
    const spans = Array.from(document.querySelectorAll(".pdf-text-layer span"));
    const el = spans.find((s) => s.textContent && s.textContent.toLowerCase().includes(needle.toLowerCase()));
    if (!el) return null;
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    return el;
  }, phrase);
  return handle;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

try {
  // reset memory to baseline
  await page.request.delete(`${BASE}/api/memory`);

  console.log("Beat 0: load");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector(".pdf-text-layer span", { timeout: 30000 });
  assert(await page.locator(".brand").isVisible(), "app shell + reader rendered");
  await page.screenshot({ path: `${OUT}/0-loaded.png` });

  console.log("Beat 1: paper 1 — select 'reward'");
  const sel1 = await selectPhrase(page, "reward");
  assert(sel1 !== null, "found 'reward' in paper 1 text layer");
  await page.waitForSelector(".explain-chip", { timeout: 5000 });
  await page.screenshot({ path: `${OUT}/1-chip.png` });
  await page.locator(".explain-chip").click();
  await page.waitForSelector(".explanation-text", { timeout: 10000 });
  assert(await page.locator(".gotit").isVisible(), "explanation panel + Got it shown");
  await page.waitForSelector(".graph .node", { timeout: 5000 });
  assert((await page.locator(".graph .node").count()) >= 1, "graph node appeared");
  await page.screenshot({ path: `${OUT}/2-explained.png` });

  console.log("Beat 2: Got it");
  await page.locator(".gotit").click();
  await page.waitForSelector(".gotit:disabled", { timeout: 5000 });
  assert(await page.locator(".gotit:disabled").isVisible(), "Got it confirmed + saved");

  console.log("Beat 3: switch to paper 2, select 'temporal-difference'");
  await page.locator('.paper-switch button:has-text("Temporal Differences")').click();
  await page.waitForTimeout(500);
  await page.waitForSelector(".pdf-text-layer span", { timeout: 30000 });
  const sel2 = await selectPhrase(page, "temporal-difference");
  assert(sel2 !== null, "found 'temporal-difference' in paper 2 text layer");
  await page.waitForSelector(".explain-chip", { timeout: 5000 });
  await page.locator(".explain-chip").click();
  await page.waitForSelector(".built-on", { timeout: 10000 });
  const builtOn = await page.locator(".built-on").textContent();
  assert(/RL in the Brain/.test(builtOn), `"Building on…" names paper 1 (got: ${builtOn.trim()})`);
  assert(await page.locator(".resume-note").isVisible(), "resume note shown");
  // SVG <line> is reported "hidden" by Playwright visibility heuristics, so assert on
  // DOM presence of the cross-paper edge element instead.
  await page.waitForFunction(() => document.querySelectorAll(".edge.cross").length >= 1, {
    timeout: 5000,
  });
  assert(await page.locator(".edge.cross").count() >= 1, "cross-paper edge drawn");
  await page.screenshot({ path: `${OUT}/3-cross-paper.png` });

  console.log("Beat 4: curveball");
  await page.locator('.ghost:has-text("Curveball")').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/4-curveball.png` });

  console.log("Beat 5: Memory Reveal");
  await page.locator('.ghost:has-text("Memory Reveal")').click();
  await page.waitForSelector(".reveal", { timeout: 5000 });
  assert(await page.locator(".reveal-json").first().isVisible(), "Memory Reveal shows raw record");
  await page.screenshot({ path: `${OUT}/5-memory-reveal.png` });

  if (errors.length) {
    console.log("\nConsole errors during run:");
    errors.slice(0, 8).forEach((e) => console.log("  ! " + e));
  }
  console.log(`\n✅ Full §8 demo walkthrough passed. Shots in ${OUT}/`);
} catch (err) {
  console.error("\n❌ " + err.message);
  await page.screenshot({ path: `${OUT}/FAIL.png` });
  if (errors.length) errors.slice(0, 8).forEach((e) => console.log("  ! " + e));
  process.exitCode = 1;
} finally {
  await browser.close();
}
