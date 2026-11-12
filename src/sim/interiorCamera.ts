import { TILE, type ShipLayout } from './layouts.ts';

export const INTERIOR_PAD_X = 24;
export const INTERIOR_PAD_Y = 40;
export const INTERIOR_PAD_BOTTOM = 24;

export function interiorWorldSize(layout: ShipLayout): { w: number; h: number } {
  return {
    w: layout.cols * TILE + INTERIOR_PAD_X * 2,
    h: layout.rows * TILE + INTERIOR_PAD_Y + INTERIOR_PAD_BOTTOM,
  };
}

export function tileCenter(x: number, y: number): { x: number; y: number } {
  return { x: INTERIOR_PAD_X + x * TILE + TILE / 2, y: INTERIOR_PAD_Y + y * TILE + TILE / 2 };
}

export interface InteriorCamera {
  zoom: number;
  cx: number;
  cy: number;
}

/**
 * Fit the whole ship in the view when possible so off-duty crew in far modules
 * stay on screen. If that would shrink sprites too far, zoom in on the crew centroid.
 */
export function interiorCamera(
  layout: ShipLayout,
  crew: Array<{ x: number; y: number }>,
  viewW: number,
  viewH: number
): InteriorCamera {
  const world = interiorWorldSize(layout);
  const fit = Math.min(viewW / Math.max(1, world.w), viewH / Math.max(1, world.h)) * 0.92;
  const shipCx = INTERIOR_PAD_X + (layout.cols * TILE) / 2;
  const shipCy = INTERIOR_PAD_Y + (layout.rows * TILE) / 2;
  if (fit >= 0.42 || crew.length === 0) {
    return { zoom: Math.min(2, Math.max(0.35, fit)), cx: shipCx, cy: shipCy };
  }
  const cx = crew.reduce((s, c) => s + tileCenter(c.x, c.y).x, 0) / crew.length;
  const cy = crew.reduce((s, c) => s + tileCenter(c.x, c.y).y, 0) / crew.length;
  return { zoom: Math.min(2, Math.max(0.55, fit)), cx, cy };
}
