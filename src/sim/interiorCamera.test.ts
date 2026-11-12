import { describe, expect, it } from 'vitest';
import { INTERIOR_PAD_X, interiorCamera, interiorWorldSize, tileCenter } from './interiorCamera.ts';
import { layoutOf, TILE } from './layouts.ts';

describe('interior camera', () => {
  it('fits Harmony in a 1280×800-class view instead of pinning on tile 9', () => {
    const layout = layoutOf('ship-harmony');
    const viewW = 928;
    const viewH = 731;
    const cam = interiorCamera(layout, [{ x: 37, y: 3 }], viewW, viewH);
    const world = interiorWorldSize(layout);
    expect(cam.zoom).toBeLessThan(1);
    expect(cam.zoom * world.w).toBeLessThanOrEqual(viewW + 1);
    expect(cam.zoom * world.h).toBeLessThanOrEqual(viewH + 1);
    const halfW = viewW / 2 / cam.zoom;
    expect(cam.cx - halfW).toBeLessThan(INTERIOR_PAD_X + TILE);
    expect(cam.cx + halfW).toBeGreaterThan(INTERIOR_PAD_X + (layout.cols - 1) * TILE);
    expect(cam.cx).toBeCloseTo(INTERIOR_PAD_X + (layout.cols * TILE) / 2, 5);
    expect(cam.cx).not.toBeCloseTo(INTERIOR_PAD_X + 9 * TILE, 0);
  });

  it('keeps tile centers inside the fitted world', () => {
    const layout = layoutOf('ship-harmony');
    const p = tileCenter(37, 3);
    const world = interiorWorldSize(layout);
    expect(p.x).toBeGreaterThan(0);
    expect(p.x).toBeLessThan(world.w);
    expect(p.y).toBeGreaterThan(0);
    expect(p.y).toBeLessThan(world.h);
  });
});
