import type { AuthUser } from '../types.ts';
import { CREW, CREW_SIZE_BY_SHIP, crewByLogin } from '../world/catalog.ts';
import type { WorldState } from '../world/worldState.ts';

export const MAP_W = 1080;
export const MAP_H = 640;
export const EARTH = { x: 170, y: 380 };
export const MOON = { x: 560, y: 180 };
export const MARS = { x: 980, y: 420 };

export type SimFocus =
  | { mode: 'fleet'; pinId: null; crewId: null }
  | { mode: 'station'; pinId: string; crewId: string | null };

export function simFocusForUser(user: Pick<AuthUser, 'account' | 'role'> | null | undefined): SimFocus {
  if (!user || user.role === 'Guest') return { mode: 'fleet', pinId: null, crewId: null };
  if (user.role === 'NASA') return { mode: 'station', pinId: 'earth-hq', crewId: null };
  const crew = crewByLogin(user.account);
  if (!crew) return { mode: 'fleet', pinId: null, crewId: null };
  return { mode: 'station', pinId: crew.shipId, crewId: crew.id };
}

function bezier(a: number, x0: number, y0: number, x1: number, y1: number, bulge: number) {
  return {
    x: x0 + (x1 - x0) * a,
    y: y0 + (y1 - y0) * a - bulge * 4 * a * (1 - a),
  };
}

export function pinXY(id: string, world: WorldState): { x: number; y: number } {
  if (id === 'earth-hq' || id === 'hq-earth') return EARTH;
  const ship = world.ships.find((s) => s.def.id === id);
  const loc = ship?.location;
  const rad = ((loc?.phaseDeg ?? 0) * Math.PI) / 180;
  if (id === 'ship-harmony') {
    return { x: 230 + Math.cos(rad) * 28, y: 195 + Math.sin(rad) * 16 };
  }
  if (id === 'ship-gateway') {
    return { x: 430 + Math.cos(rad) * 22, y: 95 + Math.sin(rad) * 14 };
  }
  if (id === 'ship-mare') {
    return { x: 670 + Math.sin(rad) * 6, y: 330 };
  }
  const au = loc?.auFromEarth ?? 1.05;
  const a = Math.min(0.72, Math.max(0.28, (au - 1.05) / 0.55));
  return bezier(a, EARTH.x, EARTH.y, MARS.x, MARS.y, -70);
}

/** Portrait overview: stack stations so the fleet fills a tall canvas. */
export const PORTRAIT_FLEET_XY: Record<string, { x: number; y: number }> = {
  'earth-hq': { x: 540, y: 48 },
  'ship-harmony': { x: 430, y: 170 },
  'ship-gateway': { x: 650, y: 255 },
  'ship-ares': { x: 430, y: 400 },
  'ship-mare': { x: 650, y: 548 },
};

export function isPortraitView(viewW: number, viewH: number): boolean {
  return viewH > viewW * 1.05;
}

export function pinXYForView(id: string, world: WorldState, portraitOverview: boolean): { x: number; y: number } {
  if (portraitOverview && PORTRAIT_FLEET_XY[id]) return PORTRAIT_FLEET_XY[id];
  return pinXY(id, world);
}

export interface MapRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function rectsOverlap(a: MapRect, b: MapRect, pad = 0): boolean {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

/** Pick a You-badge offset that does not sit on another station's label. */
export function youBadgeOffset(
  origin: { x: number; y: number },
  badge: { w: number; h: number },
  obstacles: MapRect[],
  candidates: Array<{ dx: number; dy: number }> = [
    { dx: 0, dy: -52 },
    { dx: -56, dy: -48 },
    { dx: 56, dy: -48 },
    { dx: -72, dy: 10 },
    { dx: 72, dy: 10 },
    { dx: 0, dy: 62 },
    { dx: -88, dy: -72 },
  ]
): { dx: number; dy: number } {
  for (const c of candidates) {
    const r: MapRect = {
      x: origin.x + c.dx - badge.w / 2,
      y: origin.y + c.dy - badge.h,
      w: badge.w,
      h: badge.h,
    };
    if (!obstacles.some((o) => rectsOverlap(r, o, 10))) return c;
  }
  return candidates[0];
}

export function overviewCamera(
  viewW: number,
  viewH: number,
  pins: Array<{ x: number; y: number }>
): { zoom: number; cx: number; cy: number } {
  const pad = 64;
  const xs = pins.map((p) => p.x);
  const ys = pins.map((p) => p.y);
  const minX = Math.min(...xs) - pad;
  const maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad;
  const maxY = Math.max(...ys) + pad;
  const bw = Math.max(1, maxX - minX);
  const bh = Math.max(1, maxY - minY);
  const zoom = Math.min(viewW / bw, viewH / bh);
  return { zoom: Math.max(0.35, zoom), cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

export function mapCamera(
  overview: boolean,
  pin: { x: number; y: number } | null,
  viewW: number,
  viewH: number,
  overviewPins?: Array<{ x: number; y: number }>
): { zoom: number; cx: number; cy: number } {
  if ((overview || !pin) && overviewPins && overviewPins.length > 0) {
    return overviewCamera(viewW, viewH, overviewPins);
  }
  const fit = Math.min(viewW / MAP_W, viewH / MAP_H);
  if (overview || !pin) {
    return { zoom: Math.max(0.42, fit), cx: MAP_W / 2, cy: MAP_H / 2 };
  }
  const zoom = Math.min(2.55, Math.max(1.35, Math.min(viewW / 360, viewH / 240)));
  return { zoom, cx: pin.x, cy: pin.y };
}

export interface RosterRow {
  shipId: string;
  names: string[];
  count: number;
}

export function catalogRoster(): RosterRow[] {
  return Object.keys(CREW_SIZE_BY_SHIP).map((shipId) => {
    const names = CREW.filter((c) => c.shipId === shipId)
      .map((c) => c.name)
      .sort();
    return { shipId, names, count: CREW_SIZE_BY_SHIP[shipId] };
  });
}

export function worldRoster(world: WorldState): RosterRow[] {
  return world.ships.map((s) => ({
    shipId: s.def.id,
    names: s.crew.map((c) => c.def.name).sort(),
    count: s.crew.length,
  }));
}

export function guestSeesPrivateVitals(): boolean {
  return false;
}
