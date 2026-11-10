# SpaceMoni `/sim` asset manifest

The pixel grid is **32×32 px per tile**, matching SS13. Render with nearest-neighbour scaling: Phaser `pixelArt: true` / `roundPixels: true`.

Conventions:
- **Strip**: frames go left to right with frame width = `fw`.
- **Dirs**: rows are S, N, E, W (the SS13 order). Single-direction props have one row.
- `delay_ds` is the SS13 per-frame delay in deciseconds (1 ds = 100 ms). Phaser `frameRate ≈ 10 / delay`.
- Props are bottom-anchored: place the sprite with `origin(0, 1)` at the tile's bottom-left. 32×48 lockers stand one tile tall and overhang upward.

## Crew spritesheets (`crew/*.png`, 128×224, 32×32 frames, 4 cols × 7 rows)

| Row | Animation | Frames | Phaser key suggestion |
|---|---|---|---|
| 0 | walk_S (col0 = stand S) | 4 (stand, stepL, stand, stepR) | `walk-s` @ 6 fps |
| 1 | walk_N | 4 | `walk-n` |
| 2 | walk_E | 4 | `walk-e` (also use for treadmill running) |
| 3 | walk_W | 4 | `walk-w` |
| 4 | idle_S ×2, idle_N ×2 | 2 + 2 | `idle-s` (cols 0–1), `idle-n` (cols 2–3) @ 2 fps |
| 5 | sleep_lying ×2, sleep_float ×2 | 2 + 2 | `sleep` (bunk or sleep pod, cols 0–1) or `sleep-float` (cols 2–3, microgravity sleeping bag) @ 1 fps |
| 6 | work_N ×2, work_E ×2 | 2 + 2 | `work-n` (back to camera at a wall console/rack), `work-e` (side bench) @ 2 fps |

| File | Role / look |
|---|---|
| `crew/commander.png` | Crew character: commander |
| `crew/flight_engineer.png` | Crew character: flight_engineer |
| `crew/science_officer.png` | Crew character: science_officer |
| `crew/medical_officer.png` | Crew character: medical_officer |
| `crew/mission_specialist.png` | Crew character: mission_specialist |
| `crew/pilot.png` | Crew character: pilot |
| `crew/eva_suit.png` | Crew character: eva_suit |
| `crew/eva_suit_heavy.png` | Crew character: eva_suit_heavy |

Activities with no dedicated crew frames reuse these:
- **Exercise**: on the treadmill play `walk-e` with the crew sprite overlapped on the belt. On the cycle ergometer or ARED use `idle-s`, or use `props/exercise/resistive_lifter_in_use.png` / `bench_press_in_use.png`, which have a person baked in, and hide the crew sprite.
- **EVA**: swap the texture to `eva_suit.png` or `eva_suit_heavy.png` when the crew member passes the airlock, and set `suit_storage_empty.png` on the rack.
- **Medical**: the patient uses `sleep` on `med_bed` / `stasis_bed_on`, and the medical officer uses `work-e` beside it.

## Props, tiles, ships, planets

| File | fw×fh | Frames / rows | Represents |
|---|---|---|---|
| `props/sleep/sleep_pod.png` | 32×32 | 1f, rows S,N,E,W | Crew sleep pod (closed) - SLEEP |
| `props/sleep/sleep_pod_open.png` | 32×32 | 1f, rows S,N,E,W | Crew sleep pod (open) |
| `props/sleep/bunk.png` | 32×32 | 1f | Bunk / sleep restraint bed - SLEEP |
| `props/sleep/crew_quarters_locker.png` | 32×48 | 1f | Vertical crew-quarters cabinet (ISS-style sleep station look); 32x48 |
| `props/galley/fridge.png` | 32×32 | 1f | Galley food fridge - MEAL |
| `props/galley/food_warmer.png` | 32×32 | 1f | Food warmer / microwave - MEAL |
| `props/galley/food_warmer_on.png` | 32×32 | 4f, delay 1,1,1,1 | Food warmer running |
| `props/galley/coffee_maker.png` | 32×32 | 1f | Drink dispenser - MEAL |
| `props/galley/food_storage.png` | 32×32 | 1f | Food storage rack - MEAL |
| `props/exercise/resistive_lifter.png` | 32×32 | 1f | Resistive lifting machine (ARED analog) - EXERCISE |
| `props/exercise/resistive_lifter_in_use.png` | 32×32 | 4f, delay 2,2,2,2 | Lifting animation (crew baked in, 4f) - EXERCISE |
| `props/exercise/bench_press.png` | 32×32 | 1f | Bench press - EXERCISE |
| `props/exercise/bench_press_in_use.png` | 32×32 | 4f, delay 2,2,2,2 | Bench press in use (crew baked in) - EXERCISE |
| `props/eclss/thermal_control.png` | 32×32 | 1f, rows S,N,E,W | Thermal control unit (ECLSS) |
| `props/eclss/thermal_control_on.png` | 32×32 | 10f, rows S,N,E,W, delay 1,1,1,1,1,1,1,1,1,1 | Thermal control unit running |
| `props/eclss/o2_tank.png` | 32×32 | 1f | Oxygen tank (ECLSS O2) |
| `props/eclss/n2_tank.png` | 32×32 | 1f | N2 / buffer gas tank (ECLSS) |
| `props/eclss/air_vent.png` | 32×32 | 4f, rows S,N,E,W, delay 0.8,0.8,0.8,0.8 | Air vent (ECLSS) |
| `props/eclss/co2_scrubber.png` | 32×32 | 24f, rows S,N,E,W, delay 0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8 | CO2 scrubber vent (ECLSS) |
| `props/eclss/water_processor.png` | 32×32 | 1f | Water / air processor (ECLSS) |
| `props/airlock/airlock_external.png` | 32×32 | 1f | External airlock hatch (closed) - EVA |
| `props/airlock/airlock_external_opening.png` | 32×32 | 6f, delay 1,1,1,1,1,1 | External airlock opening anim (6f) - EVA |
| `props/airlock/hatch_shuttle.png` | 32×32 | 1f | Internal module hatch (closed) |
| `props/airlock/hatch_shuttle_opening.png` | 32×32 | 6f, delay 1,1,1,1,1,1 | Internal module hatch opening anim |
| `props/airlock/suit_storage.png` | 32×32 | 1f | EVA suit storage unit with suit - EVA prep |
| `props/airlock/suit_storage_empty.png` | 32×32 | 1f | EVA suit storage (empty: crew is outside) |
| `props/airlock/suit_storage_industrial.png` | 32×32 | 1f | Heavy EVA suit storage |
| `props/lab/server_rack.png` | 32×32 | 8f, delay 0.75,0.75,0.75,0.75,0.75,0.75,0.75,8 | Payload / data server rack (animated) - SCIENCE |
| `props/lab/fabricator.png` | 32×32 | 1f | Fabricator / 3D printer rack - SCIENCE/MAINTENANCE |
| `props/lab/circuit_bench.png` | 32×32 | 1f | Electronics bench - MAINTENANCE |
| `props/lab/analyzer.png` | 32×32 | 1f | Sample analyzer - SCIENCE |
| `props/lab/sample_fridge.png` | 32×32 | 1f | Sample freezer (petri) - SCIENCE |
| `props/medical/med_kiosk.png` | 32×32 | 6f, delay 1,1,1,1,1,1 | Self-scan medical kiosk - MEDICAL check |
| `props/medical/med_bed.png` | 32×32 | 1f | Medical bed - MEDICAL |
| `props/medical/stasis_bed.png` | 32×32 | 1f, rows S,N,E,W | Advanced medical bed / stasis |
| `props/medical/stasis_bed_on.png` | 32×32 | 1f, rows S,N,E,W | Medical bed active |
| `props/medical/vitals_monitor.png` | 32×32 | 13f, delay 1,1,1,1,1,1,1,1,1,1,1,1,5 | Vitals monitor with EKG animation (13f) - MEDICAL |
| `props/medical/iv_drip.png` | 32×32 | 1f | IV stand - MEDICAL |
| `props/medical/medkit.png` | 32×32 | 1f | Medical kit - MEDICAL |
| `props/medical/medkit_advanced.png` | 32×32 | 1f | Advanced medical kit |
| `props/command/console_command.png` | 32×32 | 2f, rows S,N,E,W, delay 2,2 | Command console (4 dirs, 2f screen) - COMMS/COMMAND |
| `props/command/console_comms.png` | 32×32 | 3f, rows S,N,E,W, delay 4,4,4 | Comms console - COMMS |
| `props/command/console_crew.png` | 32×32 | 20f, rows S,N,E,W, delay 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | Crew vitals console - MEDICAL/COMMAND |
| `props/command/console_nav.png` | 32×32 | 3f, rows S,N,E,W, delay 1,1,1 | Navigation / flight console |
| `props/command/console_power.png` | 32×32 | 4f, rows S,N,E,W, delay 6,6,6,6 | Power monitor console - MAINTENANCE |
| `props/command/console_atmos.png` | 32×32 | 1f, rows S,N,E,W | ECLSS / atmosphere console |
| `props/command/comms_transmitter.png` | 32×32 | 1f | Comms transmitter - COMMS |
| `props/command/comms_relay.png` | 32×32 | 16f, delay 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | Comms relay - COMMS |
| `props/command/comms_hub.png` | 32×32 | 6f, delay 3,3,3,3,3,3 | Comms hub |
| `props/robotics/arm_base.png` | 32×32 | 1f | Robotic arm base - ROBOTICS |
| `props/robotics/arm_hand.png` | 96×96 | 1f | Robotic arm end-effector - ROBOTICS |
| `props/robotics/robotics_fab.png` | 32×32 | 1f | Robotics workstation / fab |
| `props/robotics/robotics_fab_active.png` | 32×32 | 22f, delay 15,1,1,1,1,1,1,0.5,1,3,1,0.5,1,3,1,0.5,1,3,1,1,1,1 | Robotics workstation active |
| `props/hygiene/toilet.png` | 32×32 | 1f, rows S,N,E,W | Waste & hygiene compartment toilet - HYGIENE |
| `props/hygiene/shower.png` | 32×32 | 1f, rows S,N,E,W | Hygiene shower head - HYGIENE |
| `props/hygiene/sink.png` | 32×32 | 1f, rows S,N,E,W | Hygiene sink - HYGIENE |
| `props/hygiene/mirror.png` | 32×32 | 1f, rows S,N,E,W | Mirror |
| `props/hygiene/curtain.png` | 32×32 | 1f | Privacy curtain closed |
| `props/storage/crate.png` | 32×48 | 1f | Cargo bag / crate - STORAGE |
| `props/storage/crate_secure.png` | 32×48 | 1f | Secure cargo crate |
| `props/storage/locker_grey.png` | 32×48 | 1f | Stowage locker (32x48) |
| `props/storage/locker_eva.png` | 32×48 | 1f | Emergency / EVA gear locker (32x48) |
| `props/furniture/seat_shuttle.png` | 32×32 | 1f, rows S,N,E,W | Flight seat |
| `props/furniture/office_chair.png` | 32×32 | 1f, rows S,N,E,W | Workstation chair |
| `props/furniture/light_tube.png` | 32×32 | 1f, rows S,N,E,W | Wall light tube |
| `props/furniture/handrail.png` | 32×32 | 1f, rows S,N,E,W | Handrail |
| `tiles/floors.png` | 32×32 | 16f; order: floor, white, dark, textured, textured_white, textured_dark, smooth, freezer, kitchen, plating, recharge_floor, solarpanel, darkfull, white_large, dark_large, showroomfloor | Floor tiles 32x32: index 0 floor(grey),1 white(med/lab),2 dark(command),3 textured,4 textured_white,5 textured_dark,6 smooth,7 freezer(hygiene),8 kitchen(galley),9 plating(maint),10 recharge pad,11 solar,12 darkfull,13 white_large,14 dark_large,15 showroom |
| `tiles/shuttle_walls.png` | 32×32 | 12f; order: swall0, swall1, swall2, swall3, swall4, swall7, swall8, swall11, swall12, swall13, swall14, swall15 | Shuttle hull walls; swallN is a neighbor bitmask (1=N,2=S,4=E,8=W) used by SS13 smoothing |
| `tiles/shuttle_misc.png` | 32×32 | 12f; order: wall_floor, swall_s5, swall_s6, swall_s9, swall_s10, wall_floor, heater, router, burst_l, propulsion, burst_r, propulsion_w | Hull misc: window floor, diagonal hull-to-space corners, heater, router, engine nozzles |
| `props/exercise/treadmill.png` | 49×64 | 1f | Treadmill w/ harness (T2/COLBERT analog) - EXERCISE |
| `props/exercise/cycle_ergometer.png` | 36×48 | 1f | Cycle ergometer (CEVIS analog) - EXERCISE |
| `props/exercise/ared.png` | 52×64 | 1f | Advanced resistive exercise device (ARED analog) - EXERCISE |
| `ships/leo_station.png` | 256×147 | 1f | LEO modular station (ISS-like) - fleet map |
| `ships/lunar_gateway.png` | 192×109 | 1f | Lunar orbit gateway - fleet map |
| `ships/mars_transit.png` | 288×81 | 1f | Mars transit vehicle - fleet map |
| `ships/lunar_surface_base.png` | 256×159 | 1f | Lunar surface base on regolith - fleet map |
| `planets/earth.png` | 96×96 | 1f | Planet backdrop: earth |
| `planets/moon.png` | 96×98 | 1f | Planet backdrop: moon |
| `planets/mars.png` | 96×97 | 1f | Planet backdrop: mars |

Note: `tiles/shuttle_walls.png` holds the SS13 shuttle-hull states present in the source (`swall0,1,2,3,4,7,8,11,12,13,14,15`). The index is the neighbour bitmask N=1, S=2, E=4, W=8. Bitmasks 5/6/9/10 (corners) are missing from the source: use `tiles/shuttle_misc.png` frames 1–4 (`swall_s5/s6/s9/s10`, diagonal hull corners) for outer corners. `tools/preview.py` (`W(mask)`) implements this lookup.