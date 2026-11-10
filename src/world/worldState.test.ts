import { describe, expect, it } from 'vitest';
import { goesClassToRScale } from '../domain/spaceWeather';
import { WORLD_EPOCH_MS, missionDayAt, worldStateAt } from './worldState';
import { latencyKey, locationVars, shipCrewStatus } from './shipStatus';

describe('deterministic mission world', () => {
  it('day 0 is 2026-11-10 00:00 Taipei', () => {
    expect(missionDayAt(WORLD_EPOCH_MS)).toBe(0);
    expect(missionDayAt(WORLD_EPOCH_MS + 86_400_000)).toBe(1);
    expect(missionDayAt(WORLD_EPOCH_MS - 1)).toBe(0);
  });

  it('worldStateAt is a pure function of t', () => {
    const t = WORLD_EPOCH_MS + 12.5 * 3600 * 1000;
    const a = worldStateAt(t, null);
    const b = worldStateAt(t, null);
    expect(a).toEqual(b);
    expect(a.ships).toHaveLength(4);
    expect(a.ships.every((s) => s.crew.length >= 3)).toBe(true);
  });

  it('advances activity across hours but stays identical for the same instant', () => {
    const morning = worldStateAt(WORLD_EPOCH_MS + 3 * 3600 * 1000, null);
    const afternoon = worldStateAt(WORLD_EPOCH_MS + 14 * 3600 * 1000, null);
    const aliceM = morning.ships[0].crew.find((c) => c.def.id === 'astro-alice')!;
    const aliceA = afternoon.ships[0].crew.find((c) => c.def.id === 'astro-alice')!;
    expect(aliceM.activityKey).toBe('act.sleep');
    expect(aliceA.activityKey).not.toBe('act.sleep');
  });

  it('uses official S-scale to raise modeled cabin radiation and does not invent S', () => {
    const t = WORLD_EPOCH_MS + 3600 * 1000;
    const quiet = worldStateAt(t, null);
    const storm = worldStateAt(t, {
      fetchedAt: '',
      windowStart: '',
      windowEnd: '',
      overallStatus: 'ok',
      nasaKeyMode: 'demo_key',
      cache: { hit: false, ttlSeconds: 0 },
      sources: [],
      observations: { kp: null, goesXray: null, solarWind: null, protons: null },
      scales: { gScale: 'G0', rScale: 'R0', sScale: 'S2', radiationRisk: 'High', basisZh: '' },
      events: { solarFlares: [], geomagneticStorms: [], coronalMassEjections: [], swpcAlerts: [] },
      notices: [],
    });
    const leoQuiet = quiet.ships.find((s) => s.def.id === 'ship-harmony')!;
    const leoStorm = storm.ships.find((s) => s.def.id === 'ship-harmony')!;
    const marsStorm = storm.ships.find((s) => s.def.id === 'ship-ares')!;
    expect(leoQuiet.sScaleUsed).toBeNull();
    expect(leoStorm.sScaleUsed).toBe('S2');
    expect(leoStorm.radiationMsvDay).toBeGreaterThan(leoQuiet.radiationMsvDay);
    expect(marsStorm.radiationMsvDay).toBeGreaterThan(leoStorm.radiationMsvDay);
    expect(leoQuiet.commLatencySec).toBe(0);
    expect(marsStorm.commLatencySec).toBeGreaterThan(60);
  });
});

describe('ship header fields', () => {
  it('exposes name, orbit, activity, next event, latency and fleet status', () => {
    const t = WORLD_EPOCH_MS + 10 * 3600 * 1000;
    const world = worldStateAt(t, null);
    const harmony = world.ships.find((s) => s.def.id === 'ship-harmony')!;
    const ares = world.ships.find((s) => s.def.id === 'ship-ares')!;
    expect(harmony.def.nameKey).toBe('ship.harmony.name');
    expect(locationVars(harmony).key).toBe('loc.leo');
    expect(harmony.crew[0].activityKey.startsWith('act.')).toBe(true);
    expect(harmony.nextEventKey.startsWith('act.')).toBe(true);
    expect(harmony.nextEventAt).toBeGreaterThan(t);
    expect(latencyKey(harmony).key).toBe('shipCard.latencyLeo');
    expect(ares.commLatencySec).toBeGreaterThan(60);
    expect(latencyKey(ares).key).toBe('shipCard.latencyMin');
    expect(['Normal', 'Attention', 'Critical']).toContain(shipCrewStatus(harmony));
    expect(world.missionDay).toBe(missionDayAt(t));
  });
});

describe('R-scale still correct in this pass', () => {
  it('C-class is R0', () => {
    expect(goesClassToRScale('C9.9').code).toBe('R0');
  });
});
