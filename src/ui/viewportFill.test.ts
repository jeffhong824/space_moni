import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { avatarFontSize } from './chrome.tsx';
import { MAX_BLANK_RATIO, SM_BG, blankPixelRatio, bottomEmptyBandRatio } from './viewportFill.ts';

function rgba(n: number, r: number, g: number, b: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    out[i * 4] = r;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = b;
    out[i * 4 + 3] = 255;
  }
  return out;
}

function image(w: number, h: number, fill: (x: number, y: number) => [number, number, number]): Uint8ClampedArray {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = fill(x, y);
      const o = (y * w + x) * 4;
      out[o] = r;
      out[o + 1] = g;
      out[o + 2] = b;
      out[o + 3] = 255;
    }
  }
  return out;
}

describe('viewport cream fill', () => {
  it('measures leftover porcelain background', () => {
    const cream = rgba(100, SM_BG.r, SM_BG.g, SM_BG.b);
    expect(blankPixelRatio(cream)).toBe(1);
    const mixed = rgba(100, SM_BG.r, SM_BG.g, SM_BG.b);
    for (let i = 0; i < 20; i++) {
      mixed[i * 4] = 43;
      mixed[i * 4 + 1] = 59;
      mixed[i * 4 + 2] = 255;
    }
    expect(blankPixelRatio(mixed)).toBeCloseTo(0.8, 5);
    expect(MAX_BLANK_RATIO).toBe(0.1);
  });

  it('measures the empty cream band under the last content row', () => {
    const w = 20;
    const h = 100;
    const filled = image(w, h, () => [43, 59, 255]);
    expect(bottomEmptyBandRatio(filled, w, h)).toBe(0);
    const band = image(w, h, (_x, y) => (y >= 80 ? [SM_BG.r, SM_BG.g, SM_BG.b] : [43, 59, 255]));
    expect(bottomEmptyBandRatio(band, w, h)).toBeCloseTo(0.2, 5);
    const whiteCards = image(w, h, (_x, y) => (y >= 95 ? [SM_BG.r, SM_BG.g, SM_BG.b] : [255, 255, 255]));
    expect(bottomEmptyBandRatio(whiteCards, w, h)).toBeLessThanOrEqual(0.1);
    const allCream = image(w, h, () => [SM_BG.r, SM_BG.g, SM_BG.b]);
    expect(bottomEmptyBandRatio(allCream, w, h)).toBe(1);
  });

  it('keeps /today and /hq dense without flex-grow stretching', () => {
    const today = readFileSync(new URL('../components/AstronautHome.tsx', import.meta.url), 'utf8');
    const hq = readFileSync(new URL('../components/HqConsole.tsx', import.meta.url), 'utf8');
    const systems = readFileSync(new URL('../components/SystemsPanel.tsx', import.meta.url), 'utf8');
    const matrix = readFileSync(new URL('../components/RiskMatrix.tsx', import.meta.url), 'utf8');
    expect(today).toMatch(/data-today-hero/);
    expect(today).toMatch(/AbnormalStrip/);
    expect(systems).toMatch(/data-today-vitals/);
    expect(today).toMatch(/data-today-next/);
    expect(today).toMatch(/data-today-trends/);
    expect(today).toMatch(/SystemsAccordion/);
    expect(systems).toMatch(/data-today-systems/);
    expect(today).toMatch(/today\.allInRange/);
    expect(today).toMatch(/today\.verdictOff/);
    expect(today).toMatch(/today\.partStatus/);
    expect(today).toMatch(/AxisChart/);
    expect(today).toMatch(/lg:grid-cols-12/);
    expect(today).toMatch(/lg:items-start/);
    expect(today).toMatch(/sm-orb-gutter/);
    expect(today).not.toMatch(/lg:overflow-hidden/);
    expect(today).not.toMatch(/justify-evenly/);
    expect(today).not.toMatch(/TrendSpark/);
    expect(hq).not.toMatch(/lg:overflow-hidden/);
    expect(hq).not.toMatch(/items-stretch/);
    expect(hq).not.toMatch(/max-h-\[min\(62vh/);
    expect(hq).toMatch(/data-hq-orbit/);
    expect(hq).toMatch(/data-hq-fleet/);
    expect(hq).toMatch(/data-hq-crew/);
    expect(hq).toMatch(/RiskMatrix/);
    expect(matrix).toMatch(/data-risk-matrix/);
    expect(matrix).toMatch(/data-risk-prompts/);
    expect(hq).toMatch(/ui\.fleetStatus/);
    expect(hq).toMatch(/ui\.stationAlerts/);
    expect(hq).toMatch(/max-h-\[20rem\]/);
  });

  it('uses at least 11px initials on /day avatars', () => {
    expect(avatarFontSize(24)).toBe(11);
    expect(avatarFontSize(28)).toBeGreaterThanOrEqual(11);
    expect(avatarFontSize(32)).toBeGreaterThanOrEqual(11);
    expect(avatarFontSize(40)).toBeGreaterThanOrEqual(11);
    const tasks = readFileSync(new URL('../components/StationTaskPanel.tsx', import.meta.url), 'utf8');
    expect(tasks).toMatch(/AvatarBubble/);
    expect(tasks).toMatch(/size=\{28\}/);
    expect(tasks).not.toMatch(/text-\[9px\] font-bold text-white/);
  });

  it('keeps the SpaceMoni wordmark fully visible on compact headers', () => {
    const chrome = readFileSync(new URL('./chrome.tsx', import.meta.url), 'utf8');
    expect(chrome).toMatch(/data-glossary-mobile/);
    expect(chrome).toMatch(/data-glossary-panel/);
    expect(chrome).toMatch(/max-w-\[calc\(100vw-24px\)\]/);
    expect(chrome).toMatch(/data-avatar-glossary/);
    expect(chrome).toMatch(/bottom-\[7\.25rem\]/);
    const start = chrome.indexOf('export const PageWordmark');
    const end = chrome.indexOf('const DOCK_ICON');
    const block = chrome.slice(start, end);
    expect(block).toMatch(/whitespace-nowrap/);
    expect(block).toMatch(/data-wordmark/);
    expect(block).not.toMatch(/truncate/);
    const script = readFileSync(new URL('../../scripts/assert-viewport-fill.mjs', import.meta.url), 'utf8');
    expect(script).toMatch(/1280/);
    expect(script).toMatch(/1920/);
    expect(script).toMatch(/390/);
    expect(script).toMatch(/data-today-hero/);
    expect(script).toMatch(/data-today-next/);
    const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
    expect(app).toMatch(/top-\[4\.75rem\]/);
    expect(app).not.toMatch(/lg:bottom-6 left-1\/2/);
  });
});
