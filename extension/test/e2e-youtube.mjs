// End-to-end: load the built extension into Chromium, open a real YouTube video, scroll to the
// comments, and report what the extension filtered. Needs network + Playwright's Chromium.
//   node test/e2e-youtube.mjs [videoUrl] [--headed]
import { chromium } from "playwright-core";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const url = process.argv.find((a) => a.startsWith("http")) ?? "https://www.youtube.com/watch?v=jNQXAC9IVRw";
const dist = resolve("dist");
const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "tcf-")), {
  headless: !process.argv.includes("--headed"),
  channel: "chromium",
  args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`, "--mute-audio"],
  viewport: { width: 1280, height: 900 },
  locale: "en-US",
});
const page = ctx.pages()[0] ?? (await ctx.newPage());
page.on("console", (m) => m.text().includes("toxic-filter") && console.log("[page]", m.text()));
await page.goto(url, { waitUntil: "domcontentloaded" });
// The EU consent wall, if shown: pick "Reject all" (the privacy-preserving choice).
const reject = page.getByRole("button", { name: /reject all/i });
if (await reject.isVisible({ timeout: 4000 }).catch(() => false)) await reject.click();

for (let i = 0; i < 14; i++) {
  await page.mouse.wheel(0, 1400);
  await page.waitForTimeout(1200);
}
await page.waitForTimeout(8000); // model load (first run) + scoring

const stats = await page.evaluate(() => {
  const texts = [...document.querySelectorAll("ytd-comments #content-text")];
  const filtered = texts.filter((el) => el.classList.contains("tcf-blur") || el.closest(".tcf-hide"));
  return {
    comments: texts.length,
    scored: texts.filter((el) => el.dataset.tcfText).length,
    filtered: filtered.length,
    examples: filtered.slice(0, 8).map((el) => el.dataset.tcfText.slice(0, 120)),
  };
});
await page.screenshot({ path: "test/e2e-youtube.png" });
console.log(JSON.stringify(stats, null, 2));
await ctx.close();
if (stats.comments === 0) {
  console.error("no comments found (consent wall, DOM change, or comments disabled)");
  process.exit(1);
}
