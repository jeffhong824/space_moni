import { sScaleElevated } from '../domain/spaceWeather.ts';
import type { OccupationKey } from '../world/catalog.ts';
import { hash32 } from '../world/rng.ts';
import type { ActivityKey, CrewLive, ShipLive } from '../world/worldState.ts';
import {
  doorBetween,
  layoutOf,
  roomById,
  roomPath,
  type CrewAnim,
  type Facing,
  type RoomId,
  type ShipLayout,
  type StationPlace,
} from './layouts.ts';

const TILE_SPEED = 1.5;
const EVA_EXIT_S = 18;

export type CrewSheet =
  | 'commander'
  | 'flight_engineer'
  | 'science_officer'
  | 'medical_officer'
  | 'mission_specialist'
  | 'pilot'
  | 'eva_suit'
  | 'eva_suit_heavy';

export interface CrewPose {
  crewId: string;
  shipId: string;
  roomId: RoomId;
  x: number;
  y: number;
  facing: Facing;
  anim: CrewAnim;
  walking: boolean;
  sheet: CrewSheet;
  eva: boolean;
}

const ACTIVITY_ROOM: Record<ActivityKey, RoomId> = {
  'act.sleep': 'crew_quarters',
  'act.wake': 'crew_quarters',
  'act.preSleep': 'crew_quarters',
  'act.personal': 'hygiene',
  'act.breakfast': 'galley',
  'act.lunch': 'galley',
  'act.dinner': 'galley',
  'act.exercise': 'exercise',
  'act.eva': 'airlock',
  'act.science': 'lab',
  'act.maintenance': 'eclss',
  'act.comms': 'command',
};

export function roomForActivity(layout: ShipLayout, activity: ActivityKey): RoomId {
  const want = ACTIVITY_ROOM[activity] ?? 'command';
  if (want === 'hygiene' && !roomById(layout, 'hygiene')) return 'crew_quarters';
  if (roomById(layout, want)) return want;
  if (roomById(layout, 'command')) return 'command';
  return layout.rooms[0]?.id ?? 'command';
}

export function crewSheetFor(occ: OccupationKey, eva: boolean, microgravity: boolean): CrewSheet {
  if (eva) return microgravity ? 'eva_suit' : 'eva_suit_heavy';
  if (occ === 'occ.commander') return 'commander';
  if (occ === 'occ.medical') return 'medical_officer';
  if (occ === 'occ.avionics' || occ === 'occ.pilot') return 'pilot';
  if (occ === 'occ.botanist' || occ === 'occ.science' || occ === 'occ.geology') return 'science_officer';
  if (occ === 'occ.eclss' || occ === 'occ.lifeSupport' || occ === 'occ.flightEng' || occ === 'occ.habitat') {
    return 'flight_engineer';
  }
  return 'mission_specialist';
}

function pickStation(
  layout: ShipLayout,
  roomId: RoomId,
  _crewId: string,
  prefer: 'sleep' | 'patient' | 'any',
  slot = 0
): StationPlace {
  const room = roomById(layout, roomId);
  const list = room?.stations?.length ? room.stations : [{ x: (room?.x0 ?? 0) + 2, y: 3, facing: 's' as Facing, anim: 'idle-s' as CrewAnim }];
  let pool = list;
  if (prefer === 'patient') {
    const beds = list.filter((s) => s.anim === 'sleep' || s.anim === 'sleep-float');
    if (beds.length) pool = beds;
  }
  if (prefer === 'sleep') {
    const beds = list.filter((s) => s.anim === 'sleep' || s.anim === 'sleep-float');
    if (beds.length) pool = beds;
  }
  return pool[slot % pool.length];
}

function targetFor(
  layout: ShipLayout,
  ship: ShipLive,
  crew: CrewLive,
  activity: ActivityKey,
  slot = 0
): { room: RoomId; station: StationPlace; eva: boolean } {
  if (sScaleElevated(ship.sScaleUsed)) {
    const room = roomById(layout, layout.shelterRoom) ? layout.shelterRoom : 'crew_quarters';
    return { room, station: pickStation(layout, room, crew.def.id, 'any', slot), eva: false };
  }
  if (crew.event === 'event.illness' || crew.event === 'event.evaFatigue') {
    const room = roomById(layout, 'medical') ? 'medical' : roomForActivity(layout, activity);
    return { room, station: pickStation(layout, room, crew.def.id, 'patient', slot), eva: false };
  }
  const room = roomForActivity(layout, activity);
  if (activity === 'act.eva') {
    return { room, station: pickStation(layout, room, crew.def.id, 'any', slot), eva: true };
  }
  const prefer = activity === 'act.sleep' || activity === 'act.preSleep' ? 'sleep' : 'any';
  return { room, station: pickStation(layout, room, crew.def.id, prefer, slot), eva: false };
}

interface Pt {
  x: number;
  y: number;
}

function waypoints(layout: ShipLayout, from: Pt, to: Pt, fromRoom: RoomId, toRoom: RoomId): Pt[] {
  const rooms = roomPath(layout, fromRoom, toRoom);
  const pts: Pt[] = [{ ...from }];
  for (let i = 0; i < rooms.length - 1; i++) {
    const door = doorBetween(layout, rooms[i], rooms[i + 1]);
    if (door) pts.push({ x: door.x, y: door.y });
  }
  pts.push({ ...to });
  return pts;
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function along(pts: Pt[], travel: number): { x: number; y: number; facing: Facing } {
  if (pts.length === 0) return { x: 0, y: 0, facing: 's' };
  if (pts.length === 1 || travel <= 0) return { ...pts[0], facing: 's' };
  let left = travel;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const d = dist(a, b);
    const facing: Facing = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y) ? (b.x >= a.x ? 'e' : 'w') : b.y >= a.y ? 's' : 'n';
    if (d < 1e-6) continue;
    if (left <= d) {
      const u = left / d;
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, facing };
    }
    left -= d;
  }
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  const facing: Facing =
    Math.abs(last.x - prev.x) >= Math.abs(last.y - prev.y) ? (last.x >= prev.x ? 'e' : 'w') : last.y >= prev.y ? 's' : 'n';
  return { ...last, facing };
}

function walkAnim(facing: Facing): CrewAnim {
  return (`walk-${facing}` as CrewAnim);
}

export function crewPoseAt(t: number, crew: CrewLive, ship: ShipLive, slot = 0): CrewPose {
  const layout = layoutOf(ship.def.id);
  const dest = targetFor(layout, ship, crew, crew.activityKey, slot);
  const origin = targetFor(layout, ship, crew, crew.prevActivityKey, slot);
  const elapsed = Math.max(0, (t - crew.activityStartedAt) / 1000);
  let evaOutside = false;
  let destStation = dest.station;
  if (dest.eva && elapsed > EVA_EXIT_S && layout.hullEva.length) {
    destStation = layout.hullEva[hash32(crew.def.id, 'eva') % layout.hullEva.length];
    evaOutside = true;
  }
  const path = waypoints(layout, origin.station, destStation, origin.room, dest.room);
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) total += dist(path[i], path[i + 1]);
  const walkT = total / TILE_SPEED;
  const walking = elapsed < walkT && total > 0.2;
  const pos = walking ? along(path, elapsed * TILE_SPEED) : { x: destStation.x, y: destStation.y, facing: destStation.facing };
  const eva = dest.eva && (walking || evaOutside || elapsed > walkT);
  let anim: CrewAnim = destStation.anim;
  if (walking) anim = walkAnim(pos.facing);
  else if (evaOutside) anim = walkAnim(destStation.facing);
  else if (layout.microgravity && (anim === 'sleep' || destStation.anim === 'sleep-float')) {
    if (crew.activityKey === 'act.sleep' || crew.activityKey === 'act.preSleep') anim = 'sleep-float';
  }
  if (destStation.hideSprite && !walking) anim = destStation.anim;
  return {
    crewId: crew.def.id,
    shipId: ship.def.id,
    roomId: walking ? dest.room : evaOutside ? dest.room : dest.room,
    x: pos.x,
    y: pos.y,
    facing: walking ? pos.facing : destStation.facing,
    anim,
    walking,
    sheet: crewSheetFor(crew.def.occupationKey, eva, layout.microgravity),
    eva,
  };
}

export function crewPosesForShip(t: number, ship: ShipLive): CrewPose[] {
  const slots = new Map<string, number>();
  return ship.crew.map((c) => {
    const layout = layoutOf(ship.def.id);
    const room = targetFor(layout, ship, c, c.activityKey).room;
    const slot = slots.get(room) ?? 0;
    slots.set(room, slot + 1);
    return crewPoseAt(t, c, ship, slot);
  });
}
