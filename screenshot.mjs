import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

// Auto-detect Chrome at common Windows paths
const chromePaths = [
  'C:/Users/User/.cache/puppeteer/chrome/win64-131.0.6778.204/chrome-win64/chrome.exe',
  'C:/Users/User/.cache/puppeteer/chrome/win64-130.0.6723.116/chrome-win64/chrome.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];

const executablePath = chromePaths.find(p => fs.existsSync(p));

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Auto-increment screenshot number
const existingFiles = fs.readdirSync(screenshotsDir);
const nums = existingFiles
  .map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1]))
  .filter(n => !isNaN(n));
const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;

const filename = label
  ? `screenshot-${nextNum}-${label}.png`
  : `screenshot-${nextNum}.png`;
const outputPath = path.join(screenshotsDir, filename);

const launchOptions = {
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
};
if (executablePath) {
  launchOptions.executablePath = executablePath;
  console.log(`Using Chrome: ${executablePath}`);
}

const browser = await puppeteer.launch(launchOptions);
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

// Force all reveal elements visible for full-page screenshot
await page.evaluate(() => {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  window.scrollTo(0, 0);
});

// Wait for animations to settle
await new Promise(r => setTimeout(r, 1000));

await page.screenshot({ path: outputPath, fullPage: true });
await browser.close();

console.log(`Screenshot saved → ${outputPath}`);
