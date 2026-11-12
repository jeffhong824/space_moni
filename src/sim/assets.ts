import Phaser from 'phaser';

/** Phaser texture keys and public URLs for /sim sprites. */

export const CREW_SHEETS = [
  'commander',
  'flight_engineer',
  'science_officer',
  'medical_officer',
  'mission_specialist',
  'pilot',
  'eva_suit',
  'eva_suit_heavy',
] as const;

export const TILE_SHEETS = {
  floors: { url: '/sim/tiles/floors.png', fw: 32, fh: 32 },
  walls: { url: '/sim/tiles/shuttle_walls.png', fw: 32, fh: 32 },
  misc: { url: '/sim/tiles/shuttle_misc.png', fw: 32, fh: 32 },
} as const;

export const FLEET_IMAGES = {
  earth: '/sim/planets/earth.png',
  moon: '/sim/planets/moon.png',
  mars: '/sim/planets/mars.png',
  'ship-harmony': '/sim/ships/leo_station.png',
  'ship-gateway': '/sim/ships/lunar_gateway.png',
  'ship-ares': '/sim/ships/mars_transit.png',
  'ship-mare': '/sim/ships/lunar_surface_base.png',
} as const;

/** 32×32 frame sheets (animation and/or 4-dir rows). */
export const PROP_SHEETS: Record<string, { url: string; fw: number; fh: number }> = {
  console_command: { url: '/sim/props/command/console_command.png', fw: 32, fh: 32 },
  console_nav: { url: '/sim/props/command/console_nav.png', fw: 32, fh: 32 },
  console_comms: { url: '/sim/props/command/console_comms.png', fw: 32, fh: 32 },
  console_crew: { url: '/sim/props/command/console_crew.png', fw: 32, fh: 32 },
  console_power: { url: '/sim/props/command/console_power.png', fw: 32, fh: 32 },
  console_atmos: { url: '/sim/props/command/console_atmos.png', fw: 32, fh: 32 },
  comms_hub: { url: '/sim/props/command/comms_hub.png', fw: 32, fh: 32 },
  comms_relay: { url: '/sim/props/command/comms_relay.png', fw: 32, fh: 32 },
  sleep_pod: { url: '/sim/props/sleep/sleep_pod.png', fw: 32, fh: 32 },
  sleep_pod_open: { url: '/sim/props/sleep/sleep_pod_open.png', fw: 32, fh: 32 },
  office_chair: { url: '/sim/props/furniture/office_chair.png', fw: 32, fh: 32 },
  seat_shuttle: { url: '/sim/props/furniture/seat_shuttle.png', fw: 32, fh: 32 },
  handrail: { url: '/sim/props/furniture/handrail.png', fw: 32, fh: 32 },
  light_tube: { url: '/sim/props/furniture/light_tube.png', fw: 32, fh: 32 },
  food_warmer_on: { url: '/sim/props/galley/food_warmer_on.png', fw: 32, fh: 32 },
  thermal_control_on: { url: '/sim/props/eclss/thermal_control_on.png', fw: 32, fh: 32 },
  thermal_control: { url: '/sim/props/eclss/thermal_control.png', fw: 32, fh: 32 },
  co2_scrubber: { url: '/sim/props/eclss/co2_scrubber.png', fw: 32, fh: 32 },
  air_vent: { url: '/sim/props/eclss/air_vent.png', fw: 32, fh: 32 },
  server_rack: { url: '/sim/props/lab/server_rack.png', fw: 32, fh: 32 },
  hatch_shuttle_opening: { url: '/sim/props/airlock/hatch_shuttle_opening.png', fw: 32, fh: 32 },
  airlock_external_opening: { url: '/sim/props/airlock/airlock_external_opening.png', fw: 32, fh: 32 },
  robotics_fab_active: { url: '/sim/props/robotics/robotics_fab_active.png', fw: 32, fh: 32 },
  vitals_monitor: { url: '/sim/props/medical/vitals_monitor.png', fw: 32, fh: 32 },
  med_kiosk: { url: '/sim/props/medical/med_kiosk.png', fw: 32, fh: 32 },
  stasis_bed_on: { url: '/sim/props/medical/stasis_bed_on.png', fw: 32, fh: 32 },
  stasis_bed: { url: '/sim/props/medical/stasis_bed.png', fw: 32, fh: 32 },
  toilet: { url: '/sim/props/hygiene/toilet.png', fw: 32, fh: 32 },
  sink: { url: '/sim/props/hygiene/sink.png', fw: 32, fh: 32 },
  shower: { url: '/sim/props/hygiene/shower.png', fw: 32, fh: 32 },
  mirror: { url: '/sim/props/hygiene/mirror.png', fw: 32, fh: 32 },
  resistive_lifter_in_use: { url: '/sim/props/exercise/resistive_lifter_in_use.png', fw: 32, fh: 32 },
  bench_press_in_use: { url: '/sim/props/exercise/bench_press_in_use.png', fw: 32, fh: 32 },
};

export const PROP_IMAGES: Record<string, string> = {
  comms_transmitter: '/sim/props/command/comms_transmitter.png',
  fridge: '/sim/props/galley/fridge.png',
  coffee_maker: '/sim/props/galley/coffee_maker.png',
  food_storage: '/sim/props/galley/food_storage.png',
  food_warmer: '/sim/props/galley/food_warmer.png',
  bunk: '/sim/props/sleep/bunk.png',
  crew_quarters_locker: '/sim/props/sleep/crew_quarters_locker.png',
  crate: '/sim/props/storage/crate.png',
  crate_secure: '/sim/props/storage/crate_secure.png',
  locker_eva: '/sim/props/storage/locker_eva.png',
  locker_grey: '/sim/props/storage/locker_grey.png',
  treadmill: '/sim/props/exercise/treadmill.png',
  cycle_ergometer: '/sim/props/exercise/cycle_ergometer.png',
  ared: '/sim/props/exercise/ared.png',
  resistive_lifter: '/sim/props/exercise/resistive_lifter.png',
  bench_press: '/sim/props/exercise/bench_press.png',
  analyzer: '/sim/props/lab/analyzer.png',
  fabricator: '/sim/props/lab/fabricator.png',
  sample_fridge: '/sim/props/lab/sample_fridge.png',
  circuit_bench: '/sim/props/lab/circuit_bench.png',
  o2_tank: '/sim/props/eclss/o2_tank.png',
  n2_tank: '/sim/props/eclss/n2_tank.png',
  water_processor: '/sim/props/eclss/water_processor.png',
  suit_storage: '/sim/props/airlock/suit_storage.png',
  suit_storage_empty: '/sim/props/airlock/suit_storage_empty.png',
  suit_storage_industrial: '/sim/props/airlock/suit_storage_industrial.png',
  hatch_shuttle: '/sim/props/airlock/hatch_shuttle.png',
  airlock_external: '/sim/props/airlock/airlock_external.png',
  arm_base: '/sim/props/robotics/arm_base.png',
  arm_hand: '/sim/props/robotics/arm_hand.png',
  robotics_fab: '/sim/props/robotics/robotics_fab.png',
  curtain: '/sim/props/hygiene/curtain.png',
  iv_drip: '/sim/props/medical/iv_drip.png',
  med_bed: '/sim/props/medical/med_bed.png',
  medkit: '/sim/props/medical/medkit.png',
  medkit_advanced: '/sim/props/medical/medkit_advanced.png',
};

export function preloadSimAssets(load: Phaser.Loader.LoaderPlugin) {
  for (const [key, spec] of Object.entries(TILE_SHEETS)) {
    load.spritesheet(key, spec.url, { frameWidth: spec.fw, frameHeight: spec.fh });
  }
  for (const name of CREW_SHEETS) {
    load.spritesheet(`crew-${name}`, `/sim/crew/${name}.png`, { frameWidth: 32, frameHeight: 32 });
  }
  for (const [key, spec] of Object.entries(PROP_SHEETS)) {
    load.spritesheet(key, spec.url, { frameWidth: spec.fw, frameHeight: spec.fh });
  }
  for (const [key, url] of Object.entries(PROP_IMAGES)) {
    load.image(key, url);
  }
  for (const [key, url] of Object.entries(FLEET_IMAGES)) {
    load.image(key, url);
  }
}

const WALK_RATE = 8;
const IDLE_RATE = 2;
const WORK_RATE = 4;

export function ensureCrewAnims(scene: Phaser.Scene) {
  for (const name of CREW_SHEETS) {
    const key = `crew-${name}`;
    const mk = (suffix: string, start: number, end: number, rate: number) => {
      const animKey = `${key}-${suffix}`;
      if (scene.anims.exists(animKey)) return;
      scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNumbers(key, { start, end }),
        frameRate: rate,
        repeat: -1,
      });
    };
    mk('walk-s', 0, 3, WALK_RATE);
    mk('walk-n', 4, 7, WALK_RATE);
    mk('walk-e', 8, 11, WALK_RATE);
    mk('walk-w', 12, 15, WALK_RATE);
    mk('idle-s', 16, 17, IDLE_RATE);
    mk('idle-n', 18, 19, IDLE_RATE);
    mk('sleep', 20, 21, 1);
    mk('sleep-float', 22, 23, 1);
    mk('work-n', 24, 25, WORK_RATE);
    mk('work-e', 26, 27, WORK_RATE);
  }
}

export function sheetCols(scene: Phaser.Scene, key: string): number {
  const tex = scene.textures.get(key);
  const src = tex.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
  const w = src && 'width' in src ? src.width : 32;
  return Math.max(1, Math.floor(w / 32));
}
