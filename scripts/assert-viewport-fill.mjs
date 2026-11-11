#!/usr/bin/env node
/**
 * Density check: 390×844 /today first screen shows verdict + vitals + next action.
 * Desktop /today and /hq use multi-column content (not flex-grow stretch).
 *
 *   BASE_URL=http://127.0.0.1:3010 node scripts/assert-viewport-fill.mjs
 */
import { accessSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3010';
const OUT = process.env.VIEWPORT_FILL_OUT || '/opt/cursor/artifacts';
const VIEWPORTS = [
  { w: 390, h: 844 },
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
        const layout = await page.evaluate((pathName) => {
          const pageEl = document.querySelector('[data-page]');
          const cs = pageEl ? getComputedStyle(pageEl) : null;
          const hiddenOverflow = Boolean(cs && (cs.overflow === 'hidden' || cs.overflowY === 'hidden'));
          const h = window.innerHeight;
          const dock = 80;
          const vis = (sel) => {
            const el = document.querySelector(sel);
            if (!el) return { sel, ok: false, reason: 'missing' };
            const r = el.getBoundingClientRect();
            return {
              sel,
              ok: r.bottom > 0 && r.top < h - dock,
              top: Math.round(r.top),
              bottom: Math.round(r.bottom),
            };
          };
          if (pathName === '/today') {
            return {
              hiddenOverflow,
              first: ['[data-today-hero]', '[data-today-vitals]', '[data-today-next]', '[data-today-action]'].map(vis),
              orbitH: 0,
            };
          }
          const orbit = document.querySelector('[data-hq-orbit]');
          return {
            hiddenOverflow,
            first: ['[data-hq-fleet]', '[data-hq-orbit]', '[data-hq-station]'].map(vis),
            orbitH: orbit ? Math.round(orbit.getBoundingClientRect().height) : 0,
          };
        }, spec.path);
        const row = `${spec.path} ${vp.w}x${vp.h} layout=${JSON.stringify(layout)} file=${file}`;
        console.log(row);
        const missing = layout.first.filter((v) => v.reason === 'missing');
        if (missing.length) failures.push(`${row} missing density blocks`);
        if (layout.hiddenOverflow) failures.push(`${row} overflow-hidden stretch`);
        if (spec.path === '/today' && layout.first.some((v) => !v.ok)) {
          failures.push(`${row} first-screen missing`);
        }
        if (spec.path === '/hq' && layout.orbitH > vp.h * 0.55) failures.push(`${row} orbit stretched`);
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
  console.log('ok: /today first screen + dense /hq layout');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
