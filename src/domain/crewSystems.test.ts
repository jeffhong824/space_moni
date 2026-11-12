import { describe, expect, it } from 'vitest';
import { CREW, SHIPS } from '../world/catalog.ts';
import { worldStateAt, WORLD_EPOCH_MS } from '../world/worldState.ts';
import {
  attachSeries,
  buildRiskMatrix,
  crewPanelAt,
  panelAction,
  SYSTEM_IDS,
} from './crewSystems.ts';

const T = WORLD_EPOCH_MS + 2 * 86400000 + 15 * 3600000;

describe('crew systems panel', () => {
  it('builds nine HRP-grouped systems with value/range/delta/status', () => {
    const world = worldStateAt(T, null);
    const alice = CREW.find((c) => c.id === 'astro-alice')!;
    const ship = world.ships.find((s) => s.def.id === alice.shipId)!;
    const panel = crewPanelAt(alice, T, null, ship);
    expect(panel.sim).toBe(true);
    expect(panel.groups.map((g) => g.id)).toEqual([...SYSTEM_IDS]);
    for (const g of panel.groups) {
      expect(g.metrics.length).toBeGreaterThan(0);
      for (const m of g.metrics) {
        expect(m.labelKey.startsWith('panel.m.')).toBe(true);
        expect(m.source === 'simulation' || m.source === 'noaa').toBe(true);
        expect(m.range.length).toBeGreaterThan(0);
        expect(['Normal', 'Attention', 'Critical']).toContain(m.status);
      }
    }
    expect(panel.groups.find((g) => g.id === 'cardio')?.metrics.some((m) => m.id === 'hr')).toBe(true);
    expect(panel.groups.find((g) => g.id === 'resp')?.metrics.some((m) => m.id === 'ppco2')).toBe(true);
    expect(panel.groups.find((g) => g.id === 'msk')?.metrics.some((m) => m.id === 'ared')).toBe(true);
  });

  it('sorts a crew×system matrix by deviation from personal baseline', () => {
    const world = worldStateAt(T, null);
    const rows = buildRiskMatrix(CREW, T, null, world.ships);
    expect(rows.length).toBe(CREW.length);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].maxDeviation).toBeGreaterThanOrEqual(rows[i].maxDeviation);
    }
    expect(rows[0].cells).toHaveLength(SYSTEM_IDS.length);
  });

  it('asks AURA when anything is off and attaches series to flagged metrics', () => {
    const world = worldStateAt(T, null);
    const alice = CREW.find((c) => c.id === 'astro-alice')!;
    const ship = world.ships.find((s) => s.def.id === alice.shipId)!;
    const panel = attachSeries(crewPanelAt(alice, T, null, ship), alice, T, null, ship);
    if (panel.flagged.length) {
      expect(panelAction(panel)).toBe('askAura');
      const withSeries = panel.flagged.find((m) => m.series.length > 1);
      expect(withSeries).toBeTruthy();
    }
    const inRange = CREW.find((c) => c.id === 'astro-marcus')!;
    const mShip = world.ships.find((s) => s.def.id === inRange.shipId)!;
    const calm = crewPanelAt(inRange, WORLD_EPOCH_MS + 3600000, null, mShip);
    if (calm.flagged.length === 0) expect(panelAction(calm)).toBe('logSelfCheck');
  });

  it('never treats NOAA-missing GOES as a fabricated class', () => {
    const world = worldStateAt(T, null);
    const alice = CREW.find((c) => c.id === 'astro-alice')!;
    const ship = world.ships.find((s) => s.def.id === alice.shipId)!;
    const panel = crewPanelAt(alice, T, null, ship);
    expect(panel.groups.flatMap((g) => g.metrics).find((m) => m.id === 'goes')).toBeUndefined();
    expect(SHIPS.length).toBe(4);
  });
});
