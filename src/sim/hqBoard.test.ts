import { describe, expect, it } from 'vitest';
import { WORLD_EPOCH_MS, worldStateAt } from '../world/worldState.ts';
import { hqBoardAt, hqShipRow } from './hqBoard.ts';

const HOUR = 3600 * 1000;
const DAY = 86_400_000;

describe('HQ board mapping', () => {
  it('maps every ship from worldStateAt with status, crew, activity, next event and latency', () => {
    const world = worldStateAt(WORLD_EPOCH_MS + 10 * HOUR, null);
    const board = hqBoardAt(world, null);
    expect(board.ships).toHaveLength(4);
    expect(board.ships.map((s) => s.id).sort()).toEqual(
      ['ship-ares', 'ship-gateway', 'ship-harmony', 'ship-mare'].sort()
    );
    for (const row of board.ships) {
      expect(['Normal', 'Attention', 'Critical']).toContain(row.status);
      expect(row.crewCount).toBeGreaterThan(0);
      expect(row.activityKey.startsWith('act.')).toBe(true);
      expect(row.nextEventKey.startsWith('act.')).toBe(true);
      expect(row.nextEventAt).toBeGreaterThan(world.t);
      expect(row.latency.key.startsWith('shipCard.latency')).toBe(true);
    }
    expect(board.weather.live).toBe(true);
    expect(board.weather.gScale).toBe('G?');
  });

  it('flags Alice on her scripted illness day and copies live NOAA scales', () => {
    const t = WORLD_EPOCH_MS + 3 * DAY + 10 * HOUR;
    const wx = {
      fetchedAt: '',
      windowStart: '',
      windowEnd: '',
      overallStatus: 'ok' as const,
      nasaKeyMode: 'demo_key' as const,
      cache: { hit: false, ttlSeconds: 0 },
      sources: [],
      observations: { kp: { value: 5, unit: 'Kp' as const, observedAt: '', sourceId: 'kp' }, goesXray: null, solarWind: null, protons: null },
      scales: { gScale: 'G1', rScale: 'R0', sScale: 'S2', radiationRisk: 'High' as const, basisZh: '' },
      events: {
        solarFlares: [{ flrID: 'X1', beginTime: '2026-11-13', peakTime: null, classType: 'X1.0', sourceLocation: null }],
        geomagneticStorms: [],
        coronalMassEjections: [],
        swpcAlerts: [{ productId: 'a1', issueDatetime: '2026-11-13', headline: 'Watch' }],
      },
      notices: [],
    };
    const world = worldStateAt(t, wx);
    const board = hqBoardAt(world, wx);
    const aliceShip = board.ships.find((s) => s.id === 'ship-harmony')!;
    expect(aliceShip.flagged.some((c) => c.id === 'astro-alice' && c.event === 'event.illness')).toBe(true);
    expect(hqShipRow(world.ships.find((s) => s.def.id === 'ship-harmony')!).flagged.length).toBeGreaterThan(0);
    expect(board.weather.gScale).toBe('G1');
    expect(board.weather.sScale).toBe('S2');
    expect(board.weather.kp).toBe(5);
    expect(board.events.some((e) => e.source === 'live' && e.kind === 'flare')).toBe(true);
    expect(board.events.some((e) => e.source === 'live' && e.kind === 'alert')).toBe(true);
    expect(board.events.some((e) => e.source === 'sim' && e.titleKey === 'event.illness')).toBe(true);
  });

  it('gives unique ids when NOAA repeats a product id', () => {
    const world = worldStateAt(WORLD_EPOCH_MS + 10 * HOUR, null);
    const wx = {
      fetchedAt: '',
      windowStart: '',
      windowEnd: '',
      overallStatus: 'ok' as const,
      nasaKeyMode: 'demo_key' as const,
      cache: { hit: false, ttlSeconds: 0 },
      sources: [],
      observations: { kp: null, goesXray: null, solarWind: null, protons: null },
      scales: { gScale: 'G0', rScale: 'R0', sScale: 'S0', radiationRisk: 'Low' as const, basisZh: '' },
      events: {
        solarFlares: [],
        geomagneticStorms: [],
        coronalMassEjections: [],
        swpcAlerts: [
          { productId: 'K04W', issueDatetime: '2026-11-10T01:00:00Z', headline: 'Watch A' },
          { productId: 'K04W', issueDatetime: '2026-11-10T01:00:00Z', headline: 'Watch B' },
        ],
      },
      notices: [],
    };
    const ids = hqBoardAt(world, wx).events.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
