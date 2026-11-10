/** Tile layouts matching DESIGN_NOTES.md and the approved preview screenshots. */

export const TILE = 32;

export type RoomId =
  | 'command'
  | 'galley'
  | 'crew_quarters'
  | 'exercise'
  | 'lab'
  | 'medical'
  | 'hygiene'
  | 'eclss'
  | 'airlock'
  | 'shelter'
  | 'capsule';

export type Facing = 's' | 'n' | 'e' | 'w';
export type CrewAnim = 'walk-s' | 'walk-n' | 'walk-e' | 'walk-w' | 'idle-s' | 'idle-n' | 'sleep' | 'sleep-float' | 'work-n' | 'work-e';

export interface PropPlace {
  tex: string;
  x: number;
  y: number;
  dir?: number;
  frame?: number;
  anim?: { frames: number; ds: number };
  originBottom?: boolean;
  wide?: number;
  tall?: number;
}

export interface StationPlace {
  x: number;
  y: number;
  facing: Facing;
  anim: CrewAnim;
  hideSprite?: boolean;
  eva?: boolean;
  hull?: boolean;
}

export interface RoomDef {
  id: RoomId;
  labelKey: string;
  descKey: string;
  /** Left wall column (partition). */
  x0: number;
  /** Right wall column (exclusive interior end / next partition). */
  x1: number;
  y0: number;
  y1: number;
  floor: number;
  stations: StationPlace[];
}

export interface DoorDef {
  x: number;
  y: number;
  left: RoomId;
  right: RoomId;
}

export interface ShipLayout {
  id: string;
  cols: number;
  rows: number;
  interiorH: number;
  rooms: RoomDef[];
  doors: DoorDef[];
  props: PropPlace[];
  hullEva: StationPlace[];
  microgravity: boolean;
  hasShower: boolean;
  shelterRoom: RoomId;
}

export const FLOOR = {
  grey: 0,
  white: 1,
  dark: 2,
  textured: 3,
  texturedWhite: 4,
  texturedDark: 5,
  smooth: 6,
  freezer: 7,
  kitchen: 8,
  plating: 9,
  darkFull: 12,
  whiteLarge: 13,
  darkLarge: 14,
} as const;

const WALL_ORDER = [0, 1, 2, 3, 4, 7, 8, 11, 12, 13, 14, 15];

export function wallFrame(mask: number): { key: 'walls' | 'misc'; frame: number } {
  const i = WALL_ORDER.indexOf(mask);
  if (i >= 0) return { key: 'walls', frame: i };
  const corner: Record<number, number> = { 5: 1, 6: 2, 9: 3, 10: 4 };
  if (corner[mask] != null) return { key: 'misc', frame: corner[mask] };
  return { key: 'walls', frame: 0 };
}

interface RoomSpec {
  id: RoomId;
  w: number;
  floor: number;
  props: Array<Omit<PropPlace, 'x' | 'y'> & { tx: number; ty: number }>;
  stations: StationPlace[];
}

function chain(shipId: string, specs: RoomSpec[], opts: { H?: number; microgravity: boolean; hasShower: boolean; shelterRoom: RoomId }): ShipLayout {
  const H = opts.H ?? 7;
  const rows = H + 2;
  const widths = specs.map((s) => s.w);
  const bounds: number[] = [0];
  for (const w of widths) bounds.push(bounds[bounds.length - 1] + w);
  const cols = bounds[bounds.length - 1] + 1;
  const rooms: RoomDef[] = specs.map((s, i) => ({
    id: s.id,
    labelKey: `sim.room.${s.id}`,
    descKey: `sim.roomDesc.${s.id}`,
    x0: bounds[i],
    x1: bounds[i + 1],
    y0: 0,
    y1: rows - 1,
    floor: s.floor,
    stations: s.stations.map((st) => ({ ...st, x: bounds[i] + st.x, y: st.y })),
  }));
  const doors: DoorDef[] = [];
  const mid = Math.floor(H / 2);
  for (let i = 1; i < bounds.length - 1; i++) {
    doors.push({ x: bounds[i], y: mid, left: specs[i - 1].id, right: specs[i].id });
    doors.push({ x: bounds[i], y: mid + 1, left: specs[i - 1].id, right: specs[i].id });
  }
  const props: PropPlace[] = [];
  specs.forEach((s, i) => {
    for (const p of s.props) {
      props.push({ ...p, x: bounds[i] + p.tx, y: p.ty });
    }
  });
  const last = rooms[rooms.length - 1];
  const hullEva: StationPlace[] = last
    ? [
        { x: last.x1, y: mid, facing: 'e', anim: 'walk-e', eva: true, hull: true },
        { x: last.x1, y: mid + 1, facing: 'e', anim: 'walk-e', eva: true, hull: true },
      ]
    : [];
  return {
    id: shipId,
    cols,
    rows,
    interiorH: H,
    rooms,
    doors,
    props,
    hullEva,
    microgravity: opts.microgravity,
    hasShower: opts.hasShower,
    shelterRoom: opts.shelterRoom,
  };
}

const P = (tex: string, tx: number, ty: number, extra: Partial<PropPlace> = {}): RoomSpec['props'][number] => ({
  tex,
  tx,
  ty,
  ...extra,
});

/** LEO US-segment chain — matches preview/sim-preview-1-leo-interior.png */
const LEO = chain(
  'ship-harmony',
  [
    {
      id: 'command',
      w: 6,
      floor: FLOOR.darkLarge,
      props: [
        P('console_command', 1, 1, { dir: 1, anim: { frames: 2, ds: 2 } }),
        P('console_nav', 2, 1, { dir: 1, anim: { frames: 3, ds: 1 } }),
        P('console_comms', 3, 1, { dir: 1, anim: { frames: 3, ds: 4 } }),
        P('comms_transmitter', 5, 1),
        P('comms_hub', 5, 2, { anim: { frames: 6, ds: 3 } }),
        P('office_chair', 2, 2, { dir: 1 }),
        P('console_crew', 1, 6, { dir: 0, anim: { frames: 20, ds: 1 } }),
      ],
      stations: [
        { x: 2, y: 2, facing: 'n', anim: 'work-n' },
        { x: 3, y: 2, facing: 'n', anim: 'work-n' },
      ],
    },
    {
      id: 'galley',
      w: 5,
      floor: FLOOR.kitchen,
      props: [
        P('fridge', 1, 1),
        P('food_warmer_on', 2, 1, { anim: { frames: 4, ds: 1 } }),
        P('coffee_maker', 3, 1),
        P('food_storage', 4, 1),
        P('crate', 4, 6, { originBottom: true, tall: 48 }),
      ],
      stations: [
        { x: 2, y: 4, facing: 's', anim: 'idle-s' },
        { x: 3, y: 4, facing: 'n', anim: 'idle-n' },
      ],
    },
    {
      id: 'crew_quarters',
      w: 5,
      floor: FLOOR.smooth,
      props: [
        P('crew_quarters_locker', 1, 1, { originBottom: true, tall: 48 }),
        P('crew_quarters_locker', 2, 1, { originBottom: true, tall: 48 }),
        P('crew_quarters_locker', 3, 1, { originBottom: true, tall: 48 }),
        P('crew_quarters_locker', 4, 1, { originBottom: true, tall: 48 }),
        P('sleep_pod', 1, 5, { dir: 0 }),
        P('bunk', 3, 6),
      ],
      stations: [
        { x: 1, y: 2, facing: 's', anim: 'sleep-float' },
        { x: 2, y: 2, facing: 's', anim: 'sleep-float' },
        { x: 3, y: 6, facing: 's', anim: 'sleep' },
        { x: 4, y: 2, facing: 's', anim: 'sleep-float' },
      ],
    },
    {
      id: 'exercise',
      w: 7,
      floor: FLOOR.textured,
      props: [
        P('treadmill', 1, 2, { wide: 49, tall: 64, originBottom: true }),
        P('cycle_ergometer', 4, 2, { wide: 36, tall: 48, originBottom: true }),
        P('ared', 1, 6, { wide: 52, tall: 64, originBottom: true }),
        P('resistive_lifter_in_use', 5, 6, { anim: { frames: 4, ds: 2 } }),
      ],
      stations: [
        { x: 2, y: 2, facing: 'e', anim: 'walk-e' },
        { x: 4, y: 3, facing: 's', anim: 'idle-s' },
        { x: 5, y: 6, facing: 's', anim: 'idle-s', hideSprite: true },
      ],
    },
    {
      id: 'lab',
      w: 6,
      floor: FLOOR.white,
      props: [
        P('server_rack', 1, 1, { anim: { frames: 8, ds: 0.75 } }),
        P('server_rack', 2, 1, { frame: 5, anim: { frames: 8, ds: 0.75 } }),
        P('analyzer', 3, 1),
        P('fabricator', 4, 1),
        P('sample_fridge', 5, 1),
        P('circuit_bench', 4, 6),
      ],
      stations: [
        { x: 3, y: 2, facing: 'n', anim: 'work-n' },
        { x: 4, y: 5, facing: 's', anim: 'work-e' },
      ],
    },
    {
      id: 'medical',
      w: 6,
      floor: FLOOR.whiteLarge,
      props: [
        P('med_kiosk', 1, 1, { anim: { frames: 6, ds: 1 } }),
        P('vitals_monitor', 3, 1, { anim: { frames: 13, ds: 1 } }),
        P('stasis_bed_on', 3, 2, { dir: 0 }),
        P('iv_drip', 4, 2),
        P('med_bed', 1, 6),
        P('medkit', 5, 1),
        P('medkit_advanced', 5, 6),
      ],
      stations: [
        { x: 2, y: 3, facing: 'e', anim: 'work-e' },
        { x: 3, y: 2, facing: 's', anim: 'sleep' },
        { x: 1, y: 6, facing: 's', anim: 'sleep' },
      ],
    },
    {
      id: 'hygiene',
      w: 4,
      floor: FLOOR.freezer,
      props: [P('toilet', 1, 1, { dir: 0 }), P('sink', 2, 1, { dir: 0 }), P('curtain', 3, 2)],
      stations: [{ x: 2, y: 3, facing: 'n', anim: 'idle-n' }],
    },
    {
      id: 'eclss',
      w: 5,
      floor: FLOOR.plating,
      props: [
        P('thermal_control_on', 1, 1, { dir: 0, anim: { frames: 10, ds: 1 } }),
        P('water_processor', 2, 1),
        P('o2_tank', 3, 1),
        P('n2_tank', 4, 1),
        P('console_atmos', 1, 6, { dir: 0 }),
        P('co2_scrubber', 3, 4, { dir: 0, anim: { frames: 24, ds: 0.8 } }),
      ],
      stations: [
        { x: 2, y: 5, facing: 'n', anim: 'work-n' },
        { x: 1, y: 5, facing: 'n', anim: 'work-n' },
      ],
    },
    {
      id: 'airlock',
      w: 6,
      floor: FLOOR.texturedDark,
      props: [
        P('suit_storage', 1, 1),
        P('suit_storage_empty', 2, 1),
        P('suit_storage_industrial', 3, 1),
        P('locker_eva', 4, 1, { originBottom: true, tall: 48 }),
        P('robotics_fab_active', 1, 6, { anim: { frames: 22, ds: 1 } }),
        P('airlock_external', 5, 3),
        P('airlock_external', 5, 4),
        P('arm_base', 4, 6),
      ],
      stations: [
        { x: 2, y: 3, facing: 'e', anim: 'idle-s' },
        { x: 4, y: 5, facing: 'n', anim: 'work-n' },
      ],
    },
  ],
  { microgravity: true, hasShower: false, shelterRoom: 'crew_quarters' }
);

const GATEWAY = chain(
  'ship-gateway',
  [
    {
      id: 'capsule',
      w: 3,
      floor: FLOOR.dark,
      props: [P('seat_shuttle', 1, 2, { dir: 1 }), P('seat_shuttle', 1, 4, { dir: 1 }), P('console_nav', 1, 1, { dir: 1, anim: { frames: 3, ds: 1 } })],
      stations: [{ x: 1, y: 3, facing: 'n', anim: 'work-n' }],
    },
    {
      id: 'command',
      w: 4,
      floor: FLOOR.darkLarge,
      props: [
        P('console_command', 1, 1, { dir: 1, anim: { frames: 2, ds: 2 } }),
        P('console_comms', 2, 1, { dir: 1, anim: { frames: 3, ds: 4 } }),
        P('comms_hub', 3, 2, { anim: { frames: 6, ds: 3 } }),
      ],
      stations: [{ x: 2, y: 2, facing: 'n', anim: 'work-n' }],
    },
    {
      id: 'galley',
      w: 3,
      floor: FLOOR.kitchen,
      props: [P('fridge', 1, 1), P('coffee_maker', 2, 1), P('food_warmer_on', 1, 6, { anim: { frames: 4, ds: 1 } })],
      stations: [{ x: 1, y: 3, facing: 's', anim: 'idle-s' }],
    },
    {
      id: 'crew_quarters',
      w: 4,
      floor: FLOOR.smooth,
      props: [
        P('crew_quarters_locker', 1, 1, { originBottom: true, tall: 48 }),
        P('crew_quarters_locker', 2, 1, { originBottom: true, tall: 48 }),
        P('crew_quarters_locker', 3, 1, { originBottom: true, tall: 48 }),
        P('crate_secure', 3, 6, { originBottom: true, tall: 48 }),
      ],
      stations: [
        { x: 1, y: 2, facing: 's', anim: 'sleep-float' },
        { x: 2, y: 2, facing: 's', anim: 'sleep-float' },
        { x: 3, y: 2, facing: 's', anim: 'sleep-float' },
      ],
    },
    {
      id: 'exercise',
      w: 4,
      floor: FLOOR.textured,
      props: [P('cycle_ergometer', 1, 2, { wide: 36, tall: 48, originBottom: true }), P('ared', 1, 6, { wide: 52, tall: 64, originBottom: true })],
      stations: [
        { x: 1, y: 3, facing: 's', anim: 'idle-s' },
        { x: 2, y: 5, facing: 's', anim: 'idle-s' },
      ],
    },
    {
      id: 'medical',
      w: 3,
      floor: FLOOR.white,
      props: [P('med_kiosk', 1, 1, { anim: { frames: 6, ds: 1 } }), P('vitals_monitor', 2, 1, { anim: { frames: 13, ds: 1 } })],
      stations: [{ x: 1, y: 3, facing: 'n', anim: 'work-e' }],
    },
    {
      id: 'hygiene',
      w: 3,
      floor: FLOOR.freezer,
      props: [P('sink', 1, 1, { dir: 0 }), P('toilet', 2, 1, { dir: 0 })],
      stations: [{ x: 1, y: 3, facing: 'n', anim: 'idle-n' }],
    },
    {
      id: 'eclss',
      w: 3,
      floor: FLOOR.plating,
      props: [P('thermal_control_on', 1, 1, { dir: 0, anim: { frames: 10, ds: 1 } }), P('o2_tank', 2, 1), P('co2_scrubber', 1, 4, { anim: { frames: 24, ds: 0.8 } })],
      stations: [{ x: 1, y: 5, facing: 'n', anim: 'work-n' }],
    },
    {
      id: 'airlock',
      w: 4,
      floor: FLOOR.texturedDark,
      props: [P('suit_storage', 1, 1), P('suit_storage_empty', 2, 1), P('airlock_external', 3, 3)],
      stations: [{ x: 1, y: 3, facing: 'e', anim: 'idle-s' }],
    },
  ],
  { H: 7, microgravity: true, hasShower: false, shelterRoom: 'crew_quarters' }
);

const ARES = chain(
  'ship-ares',
  [
    {
      id: 'command',
      w: 5,
      floor: FLOOR.darkLarge,
      props: [
        P('console_command', 1, 1, { dir: 1, anim: { frames: 2, ds: 2 } }),
        P('console_nav', 2, 1, { dir: 1, anim: { frames: 3, ds: 1 } }),
        P('console_comms', 3, 1, { dir: 1, anim: { frames: 3, ds: 4 } }),
        P('comms_relay', 4, 3, { anim: { frames: 16, ds: 1 } }),
      ],
      stations: [{ x: 2, y: 2, facing: 'n', anim: 'work-n' }],
    },
    {
      id: 'lab',
      w: 5,
      floor: FLOOR.white,
      props: [P('server_rack', 1, 1, { anim: { frames: 8, ds: 0.75 } }), P('analyzer', 2, 1), P('sample_fridge', 3, 1), P('circuit_bench', 3, 6)],
      stations: [{ x: 2, y: 2, facing: 'n', anim: 'work-n' }],
    },
    {
      id: 'medical',
      w: 5,
      floor: FLOOR.whiteLarge,
      props: [
        P('stasis_bed_on', 2, 2, { dir: 0 }),
        P('vitals_monitor', 3, 1, { anim: { frames: 13, ds: 1 } }),
        P('iv_drip', 3, 2),
        P('med_bed', 1, 6),
      ],
      stations: [
        { x: 2, y: 3, facing: 's', anim: 'sleep' },
        { x: 1, y: 5, facing: 'e', anim: 'work-e' },
      ],
    },
    {
      id: 'exercise',
      w: 5,
      floor: FLOOR.textured,
      props: [P('treadmill', 1, 2, { wide: 49, tall: 64, originBottom: true }), P('cycle_ergometer', 3, 2, { wide: 36, tall: 48, originBottom: true })],
      stations: [
        { x: 2, y: 2, facing: 'e', anim: 'walk-e' },
        { x: 3, y: 3, facing: 's', anim: 'idle-s' },
      ],
    },
    {
      id: 'crew_quarters',
      w: 4,
      floor: FLOOR.smooth,
      props: [
        P('crew_quarters_locker', 1, 1, { originBottom: true, tall: 48 }),
        P('crew_quarters_locker', 2, 1, { originBottom: true, tall: 48 }),
        P('crew_quarters_locker', 3, 1, { originBottom: true, tall: 48 }),
      ],
      stations: [
        { x: 1, y: 2, facing: 's', anim: 'sleep-float' },
        { x: 2, y: 2, facing: 's', anim: 'sleep-float' },
      ],
    },
    {
      id: 'shelter',
      w: 4,
      floor: FLOOR.plating,
      props: [
        P('crate', 1, 1, { originBottom: true, tall: 48 }),
        P('crate_secure', 2, 1, { originBottom: true, tall: 48 }),
        P('crate', 3, 1, { originBottom: true, tall: 48 }),
        P('crate', 1, 6, { originBottom: true, tall: 48 }),
        P('crate_secure', 2, 6, { originBottom: true, tall: 48 }),
      ],
      stations: [
        { x: 1, y: 3, facing: 's', anim: 'idle-s' },
        { x: 2, y: 3, facing: 's', anim: 'idle-s' },
        { x: 3, y: 3, facing: 's', anim: 'idle-s' },
      ],
    },
    {
      id: 'galley',
      w: 4,
      floor: FLOOR.kitchen,
      props: [P('fridge', 1, 1), P('food_storage', 2, 1), P('food_warmer_on', 3, 1, { anim: { frames: 4, ds: 1 } })],
      stations: [{ x: 2, y: 3, facing: 's', anim: 'idle-s' }],
    },
    {
      id: 'hygiene',
      w: 3,
      floor: FLOOR.freezer,
      props: [P('sink', 1, 1, { dir: 0 }), P('toilet', 2, 1, { dir: 0 })],
      stations: [{ x: 1, y: 3, facing: 'n', anim: 'idle-n' }],
    },
    {
      id: 'eclss',
      w: 5,
      floor: FLOOR.plating,
      props: [
        P('thermal_control_on', 1, 1, { anim: { frames: 10, ds: 1 } }),
        P('water_processor', 2, 1),
        P('o2_tank', 3, 1),
        P('co2_scrubber', 2, 4, { anim: { frames: 24, ds: 0.8 } }),
        P('airlock_external', 4, 3),
      ],
      stations: [{ x: 1, y: 5, facing: 'n', anim: 'work-n' }],
    },
  ],
  { microgravity: true, hasShower: false, shelterRoom: 'shelter' }
);

const MARE = chain(
  'ship-mare',
  [
    {
      id: 'crew_quarters',
      w: 5,
      floor: FLOOR.smooth,
      props: [P('bunk', 1, 2), P('bunk', 2, 2), P('bunk', 3, 2), P('crew_quarters_locker', 4, 1, { originBottom: true, tall: 48 })],
      stations: [
        { x: 1, y: 2, facing: 's', anim: 'sleep' },
        { x: 2, y: 2, facing: 's', anim: 'sleep' },
        { x: 3, y: 2, facing: 's', anim: 'sleep' },
      ],
    },
    {
      id: 'galley',
      w: 4,
      floor: FLOOR.kitchen,
      props: [P('fridge', 1, 1), P('food_warmer_on', 2, 1, { anim: { frames: 4, ds: 1 } }), P('coffee_maker', 3, 1)],
      stations: [{ x: 2, y: 3, facing: 's', anim: 'idle-s' }],
    },
    {
      id: 'hygiene',
      w: 4,
      floor: FLOOR.freezer,
      props: [P('toilet', 1, 1, { dir: 0 }), P('sink', 2, 1, { dir: 0 }), P('shower', 3, 1, { dir: 0 }), P('curtain', 3, 2)],
      stations: [{ x: 2, y: 3, facing: 'n', anim: 'idle-n' }],
    },
    {
      id: 'lab',
      w: 5,
      floor: FLOOR.white,
      props: [P('analyzer', 1, 1), P('sample_fridge', 2, 1), P('server_rack', 3, 1, { anim: { frames: 8, ds: 0.75 } }), P('fabricator', 4, 1)],
      stations: [{ x: 2, y: 2, facing: 'n', anim: 'work-n' }],
    },
    {
      id: 'medical',
      w: 4,
      floor: FLOOR.whiteLarge,
      props: [P('med_bed', 1, 3), P('vitals_monitor', 2, 1, { anim: { frames: 13, ds: 1 } }), P('med_kiosk', 3, 1, { anim: { frames: 6, ds: 1 } })],
      stations: [{ x: 1, y: 3, facing: 's', anim: 'sleep' }],
    },
    {
      id: 'exercise',
      w: 5,
      floor: FLOOR.textured,
      props: [P('treadmill', 1, 2, { wide: 49, tall: 64, originBottom: true }), P('ared', 3, 5, { wide: 52, tall: 64, originBottom: true })],
      stations: [
        { x: 2, y: 2, facing: 'e', anim: 'walk-e' },
        { x: 3, y: 4, facing: 's', anim: 'idle-s' },
      ],
    },
    {
      id: 'command',
      w: 4,
      floor: FLOOR.darkLarge,
      props: [P('console_command', 1, 1, { dir: 1, anim: { frames: 2, ds: 2 } }), P('console_comms', 2, 1, { dir: 1, anim: { frames: 3, ds: 4 } })],
      stations: [{ x: 2, y: 2, facing: 'n', anim: 'work-n' }],
    },
    {
      id: 'airlock',
      w: 5,
      floor: FLOOR.plating,
      props: [
        P('suit_storage', 1, 1),
        P('suit_storage_industrial', 2, 1),
        P('locker_eva', 3, 1, { originBottom: true, tall: 48 }),
        P('airlock_external', 4, 3),
      ],
      stations: [{ x: 2, y: 3, facing: 'e', anim: 'idle-s' }],
    },
  ],
  { microgravity: false, hasShower: true, shelterRoom: 'crew_quarters' }
);

export const LAYOUTS: Record<string, ShipLayout> = {
  'ship-harmony': LEO,
  'ship-gateway': GATEWAY,
  'ship-ares': ARES,
  'ship-mare': MARE,
};

export function layoutOf(shipId: string): ShipLayout {
  return LAYOUTS[shipId] ?? LEO;
}

export function roomById(layout: ShipLayout, id: RoomId): RoomDef | undefined {
  return layout.rooms.find((r) => r.id === id);
}

export function roomAtTile(layout: ShipLayout, x: number, y: number): RoomDef | undefined {
  return layout.rooms.find((r) => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1);
}

export function isWalkable(layout: ShipLayout, x: number, y: number): boolean {
  if (layout.doors.some((d) => d.x === x && d.y === y)) return true;
  return layout.rooms.some((r) => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1);
}

export function doorBetween(layout: ShipLayout, a: RoomId, b: RoomId): DoorDef | undefined {
  return layout.doors.find(
    (d) => (d.left === a && d.right === b) || (d.left === b && d.right === a)
  );
}

export function roomPath(layout: ShipLayout, from: RoomId, to: RoomId): RoomId[] {
  if (from === to) return [from];
  const adj = new Map<RoomId, RoomId[]>();
  for (const d of layout.doors) {
    adj.set(d.left, [...(adj.get(d.left) ?? []), d.right]);
    adj.set(d.right, [...(adj.get(d.right) ?? []), d.left]);
  }
  const q: RoomId[][] = [[from]];
  const seen = new Set<RoomId>([from]);
  while (q.length) {
    const path = q.shift()!;
    const last = path[path.length - 1];
    for (const n of adj.get(last) ?? []) {
      if (seen.has(n)) continue;
      const next = [...path, n];
      if (n === to) return next;
      seen.add(n);
      q.push(next);
    }
  }
  return [from, to];
}
