import { describe, expect, it } from 'vitest';
import { layoutOf, roomPath } from './layouts.ts';

describe('distinct data-driven ship layouts', () => {
  it('gives each ship a different room graph per DESIGN_NOTES', () => {
    const leo = layoutOf('ship-harmony');
    const gate = layoutOf('ship-gateway');
    const ares = layoutOf('ship-ares');
    const mare = layoutOf('ship-mare');
    expect(new Set(leo.rooms.map((r) => r.y0)).size).toBe(1);
    expect(leo.rooms.some((r) => r.id === 'capsule')).toBe(false);
    expect(gate.rooms.some((r) => r.id === 'capsule')).toBe(true);
    expect(gate.cols).toBeLessThan(leo.cols);
    expect(new Set(ares.rooms.map((r) => r.y0)).size).toBeGreaterThan(1);
    expect(ares.rooms.some((r) => r.id === 'shelter')).toBe(true);
    expect(mare.rooms.some((r) => r.id === 'tunnel')).toBe(true);
    expect(mare.hasShower).toBe(true);
    expect(leo.hasShower).toBe(false);
    expect(mare.microgravity).toBe(false);
    expect(leo.microgravity).toBe(true);
  });

  it('connects two-row and two-dome layouts through doors', () => {
    const ares = layoutOf('ship-ares');
    expect(roomPath(ares, 'command', 'crew_quarters').length).toBeGreaterThan(1);
    expect(roomPath(ares, 'lab', 'galley').length).toBeGreaterThan(1);
    const mare = layoutOf('ship-mare');
    const viaTunnel = roomPath(mare, 'crew_quarters', 'lab');
    expect(viaTunnel).toContain('tunnel');
  });

  it('includes an HQ control-room layout with flight-controller stations', () => {
    const hq = layoutOf('hq-earth');
    expect(hq.rooms.some((r) => r.id === 'display')).toBe(true);
    expect(hq.rooms.some((r) => r.id === 'command')).toBe(true);
    expect((hq.npcs ?? []).length).toBeGreaterThanOrEqual(4);
  });
});
