import { describe, expect, it } from 'vitest';
import { CREW, SHIPS } from './catalog.ts';
import { WORLD_EPOCH_MS, findCrewLive, worldStateAt } from './worldState.ts';
import { wearableAt, wearableRank, wearableSparkline } from './wearable.ts';

const HOUR = 3600 * 1000;
const alice = CREW.find((c) => c.id === 'astro-alice')!;
const harmony = SHIPS.find((s) => s.id === 'ship-harmony')!;

function ctx(activity: 'act.sleep' | 'act.exercise' | 'act.eva' | 'act.science', t: number, event: null | 'event.illness' = null) {
  return { crew: alice, ship: harmony, activity, event, cabinMsvDay: 0.42, wx: null };
}

describe('wearable digital twin', () => {
  it('is deterministic at a given t', () => {
    const t = WORLD_EPOCH_MS + 10 * HOUR;
    expect(wearableAt(t, ctx('act.science', t))).toEqual(wearableAt(t, ctx('act.science', t)));
  });

  it('raises HR for exercise and lowers it for sleep', () => {
    const t = WORLD_EPOCH_MS + 13.5 * HOUR;
    const sleep = wearableAt(t, ctx('act.sleep', t));
    const ex = wearableAt(t, ctx('act.exercise', t));
    expect(ex.hr).toBeGreaterThan(sleep.hr + 20);
    expect(ex.respRate).toBeGreaterThan(sleep.respRate);
    expect(sleep.sleepStage).not.toBe('wake');
    expect(ex.sleepStage).toBe('wake');
    expect(ex.sim).toBe(true);
  });

  it('raises EVA dose rate versus cabin work', () => {
    const t = WORLD_EPOCH_MS + 16 * HOUR;
    const lab = wearableAt(t, ctx('act.science', t));
    const eva = wearableAt(t, ctx('act.eva', t));
    expect(eva.doseRateUSvH).toBeGreaterThan(lab.doseRateUSvH);
    expect(wearableRank(eva, 'act.eva', null)).toBeGreaterThan(0);
    expect(wearableRank(lab, 'act.science', null)).toBe(0);
  });

  it('keeps a 1 Hz sparkline in lockstep with worldStateAt', () => {
    const t = WORLD_EPOCH_MS + 14 * HOUR;
    const spark = wearableSparkline(t, ctx('act.exercise', t), 8);
    expect(spark).toHaveLength(8);
    const live = findCrewLive(worldStateAt(t, null), 'astro-alice')!;
    expect(live.crew.wearable.hr).toBe(wearableAt(t, {
      crew: live.crew.def,
      ship: live.ship.def,
      activity: live.crew.activityKey,
      event: live.crew.event,
      cabinMsvDay: live.ship.radiationMsvDay,
      wx: null,
    }).hr);
  });
});
