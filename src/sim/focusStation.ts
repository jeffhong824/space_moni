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

export function mapCamera(
  overview: boolean,
  pin: { x: number; y: number } | null,
  viewW: number,
  viewH: number
): { zoom: number; cx: number; cy: number } {
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
