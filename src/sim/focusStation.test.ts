import { describe, expect, it } from 'vitest';
import { GUEST_ACCOUNT, NASA_ACCOUNT } from '../world/accounts.ts';
import { CREW, CREW_SIZE_BY_SHIP } from '../world/catalog.ts';
import { worldStateAt } from '../world/worldState.ts';
import {
  PORTRAIT_FLEET_XY,
  catalogRoster,
  guestSeesPrivateVitals,
  mapCamera,
  overviewCamera,
  rectsOverlap,
  simFocusForUser,
  worldRoster,
  youBadgeOffset,
} from './focusStation.ts';

describe('signed-in roles focus the assigned station', () => {
  it('Alice / Marcus / Sofia / NASA land on the right pin with a You marker', () => {
    expect(simFocusForUser({ account: 'alice_smith', role: 'Astronaut' })).toEqual({
      mode: 'station',
      pinId: 'ship-harmony',
      crewId: 'astro-alice',
    });
    expect(simFocusForUser({ account: 'marcus_vance', role: 'Commander' })).toEqual({
      mode: 'station',
      pinId: 'ship-harmony',
      crewId: 'astro-marcus',
    });
    expect(simFocusForUser({ account: 'sofia_berg', role: 'Commander' })).toEqual({
      mode: 'station',
      pinId: 'ship-ares',
      crewId: 'astro-sofia',
    });
    expect(simFocusForUser(NASA_ACCOUNT)).toEqual({
      mode: 'station',
      pinId: 'earth-hq',
      crewId: null,
    });
    expect(CREW.find((c) => c.id === 'astro-alice')?.shipId).toBe('ship-harmony');
    expect(CREW.find((c) => c.id === 'astro-marcus')?.shipId).toBe('ship-harmony');
    expect(CREW.find((c) => c.id === 'astro-sofia')?.shipId).toBe('ship-ares');
  });

  it('Guest / missing user stay on the whole-fleet overview', () => {
    expect(simFocusForUser(GUEST_ACCOUNT)).toEqual({ mode: 'fleet', pinId: null, crewId: null });
    expect(simFocusForUser(null)).toEqual({ mode: 'fleet', pinId: null, crewId: null });
    expect(guestSeesPrivateVitals()).toBe(false);
  });

  it('station camera zooms in relative to the fleet fit', () => {
    const fleet = mapCamera(true, null, 1280, 800);
    const station = mapCamera(false, { x: 230, y: 195 }, 1280, 800);
    expect(station.zoom).toBeGreaterThan(fleet.zoom);
    expect(station.cx).toBe(230);
    expect(station.cy).toBe(195);
    expect(fleet.cx).toBe(1080 / 2);
    expect(fleet.cy).toBe(640 / 2);
  });

  it('offsets the You badge so it does not sit on Mare’s label', () => {
    const ares = { x: 575, y: 330 };
    const mareLabel = { x: 590, y: 300, w: 170, h: 40 };
    const colliding = { x: ares.x + 26 - 55, y: ares.y - 30 - 22, w: 110, h: 22 };
    expect(rectsOverlap(colliding, mareLabel, 10)).toBe(true);
    const off = youBadgeOffset(ares, { w: 110, h: 22 }, [mareLabel]);
    const placed = { x: ares.x + off.dx - 55, y: ares.y + off.dy - 22, w: 110, h: 22 };
    expect(rectsOverlap(placed, mareLabel, 10)).toBe(false);
  });

  it('portrait overview camera fills the tall canvas with the fleet bbox', () => {
    const pins = Object.values(PORTRAIT_FLEET_XY);
    const cam = overviewCamera(390, 780, pins);
    const visH = 780 / cam.zoom;
    const visW = 390 / cam.zoom;
    const ys = pins.map((p) => p.y);
    const xs = pins.map((p) => p.x);
    const bh = Math.max(...ys) - Math.min(...ys);
    const bw = Math.max(...xs) - Math.min(...xs);
    expect(bh / visH).toBeGreaterThan(0.68);
    expect(bw / visW).toBeGreaterThan(0.5);
    const landscape = mapCamera(true, null, 390, 780);
    expect(cam.zoom).toBeGreaterThan(landscape.zoom);
  });
});

describe('sim roster parity with crew data', () => {
  it('matches names and Harmony 7 / Gateway 4 / Ares 6 / Mare 4', () => {
    const world = worldStateAt(Date.now(), null);
    const catalog = catalogRoster();
    const live = worldRoster(world);
    expect(catalog.map((r) => r.shipId).sort()).toEqual(live.map((r) => r.shipId).sort());
    expect(CREW_SIZE_BY_SHIP).toEqual({
      'ship-harmony': 7,
      'ship-gateway': 4,
      'ship-ares': 6,
      'ship-mare': 4,
    });
    for (const row of catalog) {
      const sim = live.find((r) => r.shipId === row.shipId);
      expect(sim, row.shipId).toBeTruthy();
      expect(sim!.count, row.shipId).toBe(row.count);
      expect(sim!.names, row.shipId).toEqual(row.names);
      expect(row.names).toHaveLength(row.count);
    }
    expect(live.reduce((n, r) => n + r.count, 0)).toBe(CREW.length);
  });
});
