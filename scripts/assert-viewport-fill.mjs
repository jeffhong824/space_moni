#!/usr/bin/env node
/**
 * Pixel-check that /today and /hq have no >10% empty cream band at the bottom
 * of the viewport at 1280x800 and 1920x1080.
 *
 *   BASE_URL=http://127.0.0.1:3010 node scripts/assert-viewport-fill.mjs
 */
import { createRequire } from 'node:module';
import { accessSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

const SM_BG = { r: 246, g: 245, b: 241 };
const MAX_BLANK_RATIO = 0.1;

function isCreamPixel(r, g, b, bg = SM_BG, tolerance = 6) {
  return Math.abs(r - bg.r) <= tolerance && Math.abs(g - bg.g) <= tolerance && Math.abs(b - bg.b) <= tolerance;
}

function bottomEmptyBandRatio(data, width, height, opts = {}) {
  const bg = opts.bg ?? SM_BG;
  const tolerance = opts.tolerance ?? 6;
  const emptyRow = opts.emptyRow ?? 0.82;
  let empty = 0;
  for (let y = height - 1; y >= 0; y--) {
    let cream = 0;
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      const o = row + x * 4;
      if (isCreamPixel(data[o], data[o + 1], data[o + 2], bg, tolerance)) cream += 1;
    }
    if (cream / width >= emptyRow) empty += 1;
    else break;
  }
  return height > 0 ? empty / height : 1;
}

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3010';
const OUT = process.env.VIEWPORT_FILL_OUT || '/opt/cursor/artifacts';
const VIEWPORTS = [
  { w: 1280, h: 800 },
  { w: 1920, h: 1080 },
];
const PAGES = [
  {
    path: '/today',
    user: { account: 'alice_smith', name: 'Alice Smith', role: 'Astronaut', astronautId: 'astro-alice', title: 'occ.botanist' },
  },
  {
    path: '/hq',
    user: {
      account: 'nasa_mission_control',
      name: 'NASA Flight Surgeon',
      role: 'NASA',
      title: 'NASA Flight Surgeon & Bio-Medical Ground Control',
    },
  },
];

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const candidates = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/opt/google/chrome/chrome',
  ];
  for (const p of candidates) {
    try {
      accessSync(p);
      return p;
    } catch {
      /* continue */
    }
  }
  return null;
}

async function pixelsFromPng(page, buf, w, h) {
  const b64 = Buffer.from(buf).toString('base64');
  return page.evaluate(
    async (b64, w, h) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      return Array.from(ctx.getImageData(0, 0, w, h).data);
    },
    b64,
    w,
    h
  );
}

async function openAuthed(browser, vp, user) {
  const page = await browser.newPage();
  await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument((user) => {
    sessionStorage.setItem('spacemoni.demoSession', JSON.stringify(user));
  }, user);
  return page;
}

async function main() {
  let puppeteer;
  const puppeteerCandidates = [
    'puppeteer-core',
    pathToFileURL('/tmp/qa-sim/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js').href,
    pathToFileURL(path.join(process.cwd(), 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href,
  ];
  for (const spec of puppeteerCandidates) {
    try {
      puppeteer = await import(spec);
      break;
    } catch {
      /* try next */
    }
  }
  if (!puppeteer) {
    console.error('puppeteer-core is required: npm install puppeteer-core --no-save');
    process.exit(2);
  }
  const executablePath = chromePath();
  if (!executablePath) {
    console.error('No Chrome/Chromium binary found. Set CHROME_PATH.');
    process.exit(2);
  }
  mkdirSync(OUT, { recursive: true });
  const launch = puppeteer.default?.launch ?? puppeteer.launch;
  const browser = await launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  });
  const failures = [];
  try {
    for (const vp of VIEWPORTS) {
      for (const spec of PAGES) {
        const page = await openAuthed(browser, vp, spec.user);
        await page.goto(BASE + spec.path, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForSelector(`[data-page="${spec.path.slice(1)}"]`, { timeout: 20000 });
        await new Promise((r) => setTimeout(r, 500));
        const file = path.join(OUT, `${spec.path.slice(1)}-${vp.w}x${vp.h}.png`);
        const buf = await page.screenshot({ type: 'png', fullPage: false });
        writeFileSync(file, buf);
        const data = Uint8ClampedArray.from(await pixelsFromPng(page, buf, vp.w, vp.h));
        const band = bottomEmptyBandRatio(data, vp.w, vp.h);
        const row = `${spec.path} ${vp.w}x${vp.h} bottomEmptyBand=${band.toFixed(3)} file=${file}`;
        console.log(row);
        if (band > MAX_BLANK_RATIO) failures.push(row);
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  if (failures.length) {
    console.error('Viewport fill failed:\n' + failures.join('\n'));
    process.exit(1);
  }
  console.log(`ok: empty cream band ≤ ${MAX_BLANK_RATIO} on /today and /hq`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
