import { describe, expect, it } from 'vitest';
import { CREW } from './catalog.ts';
import { WORLD_EPOCH_MS } from './worldState.ts';
import {
  BONE_LOSS_PCT_PER_30D,
  bodyHealthAt,
  combinedTrend,
  forecastSeries,
  trendSeries,
} from './bodyHealth.ts';

const alice = CREW.find((c) => c.id === 'astro-alice')!;
const HOUR = 3600 * 1000;
const DAY = 86_400_000;

describe('body-map health model', () => {
  it('is deterministic and maps HRP domains onto regions', () => {
    const t = WORLD_EPOCH_MS + 10 * HOUR;
    expect(bodyHealthAt(alice, t, null)).toEqual(bodyHealthAt(alice, t, null));
    const h = bodyHealthAt(alice, t, null);
    expect(h.sim).toBe(true);
    expect(h.domains.map((d) => d.id)).toEqual([
      'brain',
      'eyes',
      'heart',
      'lungs',
      'bones',
      'muscles',
      'skin',
      'kidneys',
      'radiation',
      'sleep',
      'mind',
    ]);
    expect(h.regionRank.heart).toBeGreaterThanOrEqual(0);
    expect(h.snap.wearable.hr).toBeGreaterThan(40);
  });

  it('builds deterministic 24h trends and a labeled forecast band', () => {
    const t = WORLD_EPOCH_MS + 14 * HOUR;
    const a = trendSeries(alice, t, '24h', null);
    const b = trendSeries(alice, t, '24h', null);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(10);
    expect(a.every((p) => !p.predicted)).toBe(true);
    const fc = forecastSeries(alice, t, 1, null);
    expect(fc).toEqual(forecastSeries(alice, t, 1, null));
    expect(fc.length).toBeGreaterThan(5);
    expect(fc.every((p) => p.predicted)).toBe(true);
    expect(fc[0].hrLo).toBeLessThan(fc[0].hrHi!);
    const combo = combinedTrend(alice, t, '24h', null);
    expect(combo.some((p) => p.predicted)).toBe(true);
    expect(combo.some((p) => !p.predicted)).toBe(true);
  });

  it('grows bone-loss analog with mission day using the published rate', () => {
    const d0 = bodyHealthAt(alice, WORLD_EPOCH_MS, null).boneLossPct;
    const d30 = bodyHealthAt(alice, WORLD_EPOCH_MS + 30 * DAY, null).boneLossPct;
    expect(d30).toBeGreaterThan(d0);
    expect(d30).toBeGreaterThan(BONE_LOSS_PCT_PER_30D * 0.4);
    expect(d30).toBeLessThan(BONE_LOSS_PCT_PER_30D * 1.6);
  });
});
