/**
 * capture-demo.mjs
 * Starts the Vite dev server, opens /demo in headless Edge,
 * takes a high-res screenshot, and saves it to DemoPIc/.
 */

import { spawn, execSync } from 'child_process';
import puppeteer from 'puppeteer-core';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, '..', '..', '..', '..', 'DemoPIc');

// Try both common Edge install locations
const EDGE_PATHS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];
const EDGE_PATH = EDGE_PATHS.find(p => existsSync(p)) || EDGE_PATHS[0];

const PORT = 5199; // Use a non-standard port to avoid conflicts
const DEV_URL = `http://localhost:${PORT}/demo`;

// Kill any process on our port before starting
function killPort(port) {
  try {
    const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const lines = result.trim().split('\n');
    const pids = new Set();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') pids.add(pid);
    }
    for (const pid of pids) {
      try { execSync(`taskkill /F /PID ${pid}`, { encoding: 'utf8' }); } catch { /* ignore */ }
    }
    if (pids.size > 0) {
      // Wait a moment for port to be released
      execSync('timeout /T 2 /NOBREAK > NUL', { shell: true });
    }
  } catch { /* port is free */ }
}

async function startDevServer() {
  console.log('[1/4] Starting Vite dev server...');
  const proc = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    cwd: resolve(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  // Wait for Vite to be ready
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Dev server timeout')), 30000);
    proc.stdout.on('data', (data) => {
      const text = data.toString();
      if (text.includes('Local:') || text.includes('localhost')) {
        clearTimeout(timeout);
        resolve();
      }
    });
    proc.stderr.on('data', (data) => {
      const text = data.toString();
      // Vite sometimes outputs to stderr
      if (text.includes('Local:') || text.includes('localhost')) {
        clearTimeout(timeout);
        resolve();
      }
    });
    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });

  console.log(`    Dev server ready at http://localhost:${PORT}`);
  return proc;
}

async function capture() {
  let devServer;
  let browser;

  try {
    // Clean up any stale process on our port
    killPort(PORT);

    // Start dev server
    devServer = await startDevServer();

    // Launch Edge
    console.log('[2/4] Launching headless Edge...');
    browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Set viewport to a good paper-figure size (wider for three-panel layout)
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

    console.log('[3/4] Loading demo page...');
    await page.goto(DEV_URL, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait extra time for React to render, animations to settle,
    // and position maps to be populated
    await new Promise((r) => setTimeout(r, 3000));

    // Take screenshot
    console.log('[4/4] Capturing screenshot...');
    const pngPath = resolve(OUTPUT_DIR, 'write-mode-screenshot.png');
    await page.screenshot({
      path: pngPath,
      fullPage: false,
      type: 'png',
    });
    console.log(`    Saved: ${pngPath}`);

    // Also capture at 3x for print quality
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 3 });
    await new Promise((r) => setTimeout(r, 1000));
    const png3xPath = resolve(OUTPUT_DIR, 'write-mode-screenshot-3x.png');
    await page.screenshot({
      path: png3xPath,
      fullPage: false,
      type: 'png',
    });
    console.log(`    Saved: ${png3xPath}`);

    console.log('\nDone! Screenshots saved to DemoPIc/');
  } catch (err) {
    console.error('Capture failed:', err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    if (devServer) {
      devServer.kill();
      // On Windows, also kill child processes
      try {
        spawn('taskkill', ['/pid', String(devServer.pid), '/T', '/F'], { shell: true });
      } catch { /* ignore */ }
    }
  }
}

capture();
