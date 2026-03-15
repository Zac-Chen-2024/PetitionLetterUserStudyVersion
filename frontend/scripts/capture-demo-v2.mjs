/**
 * capture-demo-v2.mjs
 * Opens the standalone concept-figure HTML and captures at 4x resolution.
 * No dev server needed — loads via file:// with Tailwind CDN.
 * Output: DemoPIc/2.0/
 */

import puppeteer from 'puppeteer-core';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, '..', '..', '..', '..', 'Pic', 'DemoPIc', 'Verify Demo', '2.0');
const HTML_FILE = resolve(OUTPUT_DIR, 'verify-mode-concept-figure.html');
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

const EDGE_PATHS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];
const EDGE_PATH = EDGE_PATHS.find(p => existsSync(p)) || EDGE_PATHS[0];

async function capture() {
  let browser;
  try {
    console.log('[1/3] Launching headless Edge...');
    browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 4 });

    const fileUrl = pathToFileURL(HTML_FILE).href;
    console.log(`[2/3] Loading ${fileUrl}`);
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for Tailwind CDN to process + fonts to load
    await new Promise(r => setTimeout(r, 3000));

    console.log('[3/3] Capturing...');
    const pngPath = resolve(OUTPUT_DIR, 'verify-mode-concept.png');
    await page.screenshot({ path: pngPath, fullPage: false, type: 'png' });
    console.log(`    PNG: ${pngPath}`);

    // Wrap in SVG
    const pngBuffer = readFileSync(pngPath);
    const b64 = pngBuffer.toString('base64');
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="1920" height="1080" viewBox="0 0 1920 1080">
  <title>Verifying Evidence Assembly: A Provenance-Aware Interface for Petition Letter Authoring</title>
  <desc>Conceptual overview of the Verify Mode interface showing the evidence assembly and verification workflow.</desc>
  <image width="1920" height="1080" href="data:image/png;base64,${b64}" />
</svg>`;
    const svgPath = resolve(OUTPUT_DIR, 'verify-mode-concept.svg');
    writeFileSync(svgPath, svgContent, 'utf8');
    console.log(`    SVG: ${svgPath}`);

    console.log('\nDone! Outputs in DemoPIc/2.0/');
  } catch (err) {
    console.error('Capture failed:', err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

capture();
