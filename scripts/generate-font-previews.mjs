import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "font-preview.html");
const outDir = path.join(__dirname, "..", "public", "font-previews");

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

for (let i = 1; i <= 8; i++) {
  const el = page.locator(`#opt-${i}`);
  await el.screenshot({
    path: path.join(outDir, `aasii-font-option-${i}.png`),
  });
}

await browser.close();
console.log(`Saved 8 previews to ${outDir}`);
