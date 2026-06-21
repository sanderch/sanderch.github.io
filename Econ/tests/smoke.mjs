// Headless UI smoke test: loads the app, captures console/page errors, verifies
// the scene + toolbar render, and exercises plant, edge-scroll and blur.
// Usage: node tests/smoke.mjs [baseUrl]   (a static server must be serving the app)
//
// Self-contained lifecycle: it launches Chrome with an isolated temp profile and
// always closes ONLY that browser (finally + watchdog + signal handlers). It
// never touches any other Chrome — do not pkill chrome to clean up after it.
import puppeteer from 'puppeteer-core';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:8000';
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';

const errors = [];
const fail = (m) => console.error('✗', m);
const ok = (m) => console.log('✓', m);

const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'egpoc-chrome-'));
let browser = null;
let done = false;

async function cleanup() {
  if (done) return; done = true;
  try { await browser?.close(); } catch {}
  try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
}

// never hang and orphan the headless browser
const watchdog = setTimeout(async () => {
  console.error('SMOKE TEST TIMED OUT');
  await cleanup();
  process.exit(3);
}, 60000);
watchdog.unref?.();

// if the run is interrupted, still close our browser (and only ours)
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => { await cleanup(); process.exit(130); });
}

let exitCode = 0;
try {
  browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    userDataDir: profileDir,
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader',
           '--enable-unsafe-swiftshader', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + (e?.message || e)));
  page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url() + ' ' + r.failure()?.errorText));
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(`http ${r.status()}: ${r.url()}`); });

  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2500)); // let modules import + first render

  // --- structure ---
  (await page.$('#app canvas')) ? ok('canvas present') : fail('no <canvas> in #app');
  const toolCount = await page.$$eval('.tool', (els) => els.length);
  toolCount >= 2 ? ok(`toolbar has ${toolCount} tools`) : fail('toolbar tools missing');
  const startCount = await page.$eval('#treeCount', (e) => +e.textContent);
  Number.isFinite(startCount) ? ok(`initial tree count = ${startCount}`) : fail('tree count not a number');

  // --- plant ---
  await page.click('.tool[data-tool="plant"]');
  await page.mouse.click(740, 430);
  await new Promise((r) => setTimeout(r, 300));
  const afterPlant = await page.$eval('#treeCount', (e) => +e.textContent);
  afterPlant > startCount ? ok(`plant works (${startCount} -> ${afterPlant})`)
                          : fail(`plant did not add a tree (${startCount} -> ${afterPlant})`);

  // --- edge scrolling pans the camera ---
  const target = () => page.evaluate(() => window.app.engine.controls.target.toArray());
  const before = await target();
  await page.mouse.move(1278, 400);
  await new Promise((r) => setTimeout(r, 500));
  const after = await target();
  const panned = Math.hypot(after[0] - before[0], after[2] - before[2]);
  panned > 0.5 ? ok(`edge scroll pans (Δ=${panned.toFixed(1)})`) : fail('edge scroll did not pan');

  // --- losing window focus stops edge scrolling (cursor stays at the edge) ---
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const s0 = await target();
  await new Promise((r) => setTimeout(r, 500));
  const s1 = await target();
  const drift = Math.hypot(s1[0] - s0[0], s1[2] - s0[2]);
  drift < 0.5 ? ok('blur stops edge scroll') : fail(`still scrolling after blur (Δ=${drift.toFixed(1)})`);

  // --- the view can never pan off the map: start near the edge, then edge-scroll
  // hard outward and confirm the target is held at the boundary, not beyond ---
  const half = await page.evaluate(() => window.app.engine._mapHalf);
  await page.evaluate((h) => {
    const e = window.app.engine;
    e.controls.target.set(h - 4, 0, 0);
    e.camera.position.set(h - 4 + 28, 34, 28);
    e.invalidate();
  }, half);
  await page.mouse.move(1278, 400);                 // hold at right edge (pushes +x, keeps frames flowing)
  await new Promise((r) => setTimeout(r, 1000));
  const tx = (await target())[0];
  tx <= half + 0.5
    ? ok(`target clamped to map edge (x=${tx.toFixed(1)} ≤ ${half})`)
    : fail(`target escaped the map (x=${tx.toFixed(1)} > ${half})`);

  if (errors.length) {
    console.error(`\n${errors.length} runtime error(s):`);
    for (const e of [...new Set(errors)]) console.error('  • ' + e);
    exitCode = 1;
  } else {
    console.log('\nNo console/page errors. ✅');
  }
} catch (e) {
  console.error('SMOKE TEST CRASHED:', e?.message || e);
  for (const x of [...new Set(errors)]) console.error('  • ' + x);
  exitCode = 2;
} finally {
  clearTimeout(watchdog);
  await cleanup();
}
process.exit(exitCode);
