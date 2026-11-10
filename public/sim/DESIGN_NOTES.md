# SpaceMoni `/sim` design notes

The goal is to replace the procedurally drawn circles and rectangles with a believable crew-life simulation: real pixel-art crew moving between real-looking cabin components according to the shared daily mission timeline.

## 1. What the reference games do well, and what we take from each

| Game | What works | What we borrow |
|---|---|---|
| **Space Station 13 / tgstation**, plus Space Station 14 (same art lineage) | A tile-based station split into *departments* (Medbay, Science, Engineering/Atmos, Bridge, Kitchen, Dorms, EVA). Every machine is a recognisable 32×32 sprite, so a player can "read" a room at a glance. Doors and airlocks are explicit objects. | **The whole art set**: one consistent 32 px 3/4 top-down style. The room is the unit of meaning: each timeline activity happens in one named room at one named prop. |
| **FTL: Faster Than Light** | Side or top cross-section of a ship as a grid of small rooms. Crew stand at a *station* tile to man a system (helm, engines, O2, medbay). Rooms show O2 levels, breaches and fire as tinted overlays. The whole ship fits on one screen. | Fit each ship on one screen. Give every room a station tile where the crew stands. Use overlay tints for alerts (radiation = amber/purple, low O2 = blue, medical = red pulse). Click a room to open details. |
| **Oxygen Not Included** | A colour-coded **schedule bar** per duplicant (Work / Downtime / Bedtime / Bathtime). Crew walk to the right building when their block starts. The overlay modes (oxygen, temperature, power) are the "data view" of the same map. | Show the existing SpaceMoni timeline as a per-crew schedule strip under the map, with the current block highlighted. Add overlay toggles (Radiation, CO₂/O₂, Crew vitals) that recolour rooms with the real or simulated data already in the app. |
| **Space Haven** | Crew have needs and moods, with a visible "current job" label. The ship is built from modules. Crew path automatically through doors. | Show a hover tooltip: name, role, current activity and remaining time, HR/HRV/SpO₂ (simulated), and mood or fatigue. |
| **Pixel Starships** | A side-view ship made of stacked rooms, with crew walking left and right on floors. Rooms are 2–3 tiles tall. | We stay top-down, which matches the art, but use the same compact "room strip" layout for small ships such as the Gateway. |
| **Barotrauma** | A cross-section submarine with real-feeling hardware (pumps, reactor, airlocks, medical). Atmosphere and pressure are shown per hull. | Show ECLSS as visible hardware, not an abstract number. Show EVA as a crew member cycling through the airlock and then appearing outside on the hull. |

We did **not** download FTL, Pixel Starships, Space Haven, ONI or Barotrauma; they are commercial games used only as design references. Only tgstation art was downloaded (sparse clone of `icons/` in `/workspace/sim-ref/tgstation`).

## 2. Engine guidance (Phaser 4, existing `src/sim/FleetScene.ts`)

- **Scenes**: `FleetMapScene` (planets, ships, transfer arcs) → `ShipInteriorScene(shipId)` → a side panel in React for crew details. Set `pixelArt: true` and scale ×2 or ×3 with integer zoom only.
- **Map data**: describe each ship in a small JSON or TS literal: `rooms[]` (id, label key, tile rect, floor index), `doors[]` (tile), `props[]` (file, tile, frame or anim, `station: true` if a crew member stands there), `stations{activity → [tile, facing]}`. The preview script `tools/preview.py` already renders this kind of structure.
- **Walls**: auto-tile using the 4-bit neighbour mask, as described in MANIFEST.md.
- **Pathing**: rooms are a linear or graph chain connected by doors. Use a **room graph + door waypoints**: walk to the door, through it, then to the station tile. This is cheaper and more readable than A* on tiles. Fall back to grid A* only for the lunar base, which has two domes. Speed is about 1.5 tiles/s, using `walk-*` animations by direction.
- **Determinism**: the "world started on 2026-11-10 and runs every day" requirement means position is a **pure function of (mission clock, crew id)**. From the timeline, find the current activity and its start time. If less than *walk duration* has passed since the start, interpolate along the path from the previous station. Otherwise sit at the station and play the activity animation. Every viewer then sees the same thing without a server tick.
- **Depth**: y-sort sprites with `setDepth(y)` so crew walk behind or in front of 32×48 lockers correctly.
- **Overlays**: add a semi-transparent rectangle per room, tinted by a data layer. When the live NOAA/DONKI feed puts the ship in an SPE or radiation alert, crew re-path to the **storm shelter** room. This makes the real space-weather data visibly drive the simulation, which strengthens the pitch.
- **Labels**: room names come from i18n keys (`sim.room.galley`, …). Do not bake text into sprites; that keeps all four languages working.

## 3. Activity → room → prop → animation mapping

| Timeline activity | Room | Station prop(s) | Crew anim | Notes |
|---|---|---|---|---|
| `sleep` | Crew Quarters | `props/sleep/crew_quarters_locker.png` (ISS-style sleep station), `sleep_pod.png`, `bunk.png` | `sleep-float` in front of the locker in microgravity (LEO, Gateway, Mars transit); `sleep` on `bunk` on the lunar surface | Dim the room overlay to night |
| `exercise` | Exercise | `exercise/treadmill.png`, `cycle_ergometer.png`, `ared.png`, `resistive_lifter_in_use.png` | `walk-e` on the treadmill; `idle-s` on the cycle or ARED | 2.5 h/day split into cardio and resistive blocks |
| `eva` | Airlock / EVA → outside the hull | `airlock/suit_storage.png` → `suit_storage_empty.png`, `airlock_external_opening.png` (6f) | `idle-s` at the rack, swap to `crew/eva_suit*.png`, walk out through the airlock, then appear on the hull/exterior layer | Pre-breathe can be shown as `idle` in the airlock with a timer |
| `science` | Lab | `lab/server_rack.png` (animated), `analyzer.png`, `sample_fridge.png`, `fabricator.png` | `work-n` | |
| `maintenance` | ECLSS or Lab | `eclss/thermal_control_on.png`, `eclss/water_processor.png`, `command/console_power.png`, `lab/circuit_bench.png`, `robotics/robotics_fab_active.png` | `work-n` / `work-e` | Randomly pick the station per day via a seeded RNG |
| `comms` | Command / Comms | `command/console_comms.png` (dir N), `comms_transmitter.png`, `comms_hub.png` | `work-n` | Link to the HQ console message delay (Mars ≈ 4–24 min one-way) |
| `meal` | Galley | `galley/fridge.png`, `food_warmer_on.png`, `coffee_maker.png`, `food_storage.png` | `idle-s` / `idle-n` | Crew members with the same meal block gather here |
| `hygiene` | Hygiene | `hygiene/toilet.png`, `sink.png`, `shower.png` (surface base only), `curtain.png` | `idle-n` | No shower in microgravity: sink and wipes only, so hide `shower` on orbital ships |
| `medical` | Medical | `medical/med_kiosk.png` (self-check), `vitals_monitor.png` (EKG anim), `stasis_bed_on.png`, `med_bed.png`, `iv_drip.png`, `medkit*.png` | Patient: `sleep` on the bed; CMO: `work-e` | Hook to the SpaceMoni anomaly queue: a flagged crew member walks here |
| `command` / `briefing` | Command | `command/console_command.png`, `console_nav.png`, `console_crew.png` | `work-n` | Daily planning conference |
| `robotics` | Airlock/EVA or Cupola | `robotics/arm_base.png` + `arm_hand.png`, `robotics_fab*.png` | `work-n` | Only on LEO and Gateway |
| `storm_shelter` (event) | Shelter (Mars, Gateway) or Crew Quarters (LEO) | `storage/crate*.png` stacked as a water and food wall | `idle-s` | Triggered by real SWPC proton or DONKI SEP alerts |
| `free` / `off-duty` | Galley or a window | `tiles/shuttle_misc.png` frame 0 (window floor) | `idle-s` | |

`activity_map.json` contains the same mapping in machine-readable form.

## 4. Proposed layout per ship type (tile grid, 32 px tiles)

### 4.1 LEO Station (6 crew), 52 × 9 tiles, a linear module chain like the ISS US segment
```
[Command/Comms 6][Galley 5][Crew Qtrs 5][Exercise 7][Lab 6][Medical 6][Hygiene 4][ECLSS 5][Airlock/EVA 6]
```
- Hatches sit in the middle of each partition. EVA exits from the airlock's east wall to the hull layer.
- The robotic arm station shares the Airlock/EVA module (`arm_base` + `console_nav`).
- Rendered in `preview/sim-preview-1-leo-interior.png`.

### 4.2 Lunar Gateway (4 crew), 26 × 7 tiles, a compact chain plus a docked capsule
```
[Docked capsule 3: seats] - [HALO 8: Command/Comms | Galley | 4 sleep lockers] - [I-Hab 8: Exercise(cycle+ARED) | Medical kiosk | Hygiene] - [Airlock 4: suits] - [PPE 3: ECLSS/power]
```
- Small modules are subdivided with half-height partitions or by props only.
- The storm shelter is the HALO sleep area.

### 4.3 Mars Transit Vehicle (4 crew), 40 × 11 tiles, a two-row habitat ring cross-section
```
Row A: [Flight deck/Command 6][Lab 6][Medical (expanded, telemedicine) 6][Exercise 6]
Row B: [Crew Qtrs 4 lockers 6][**Storm shelter** (water-wall crates) 4][Galley/Wardroom 6][Hygiene 3][ECLSS (closed loop) 6]
```
- The long spine, propellant tanks and engines are exterior only (fleet-map sprite).
- The airlock is a contingency only and is kept small inside ECLSS.
- Comms shows the Earth–Mars light-time delay on the console tooltip.

### 4.4 Lunar Surface Base (4 crew), 34 × 14 tiles, two domes plus a tunnel
```
Dome A (living): Crew Qtrs (bunks, gravity → `sleep` not `sleep-float`), Galley, Hygiene (shower allowed)
Tunnel
Dome B (work): Lab, Medical, Exercise (treadmill + ARED), Command/Comms
Dust lock / Suitport + Rover garage: suit storage, EVA exit to regolith (`ships/lunar_surface_base.png` as the outside view)
```
- Floors: `white` for the lab and medical areas, `textured_dark` for the work dome, `freezer` for hygiene, and `plating` for the airlock.

## 5. Status overlays and UI

- **Per crew**: a small coloured pip above the head (green/amber/red from the SpaceMoni health score) and a speech-bubble icon when they are in comms.
- **Per room**: a radiation tint driven by live NOAA GOES proton flux scaled by ship location (LEO is shielded by the magnetosphere; Gateway and Mars transit are not). CO₂/O₂ tints come from simulated ECLSS values.
- **Schedule strip**, ONI-style: 24 h bars per crew member with a "now" cursor.
- **Label honesty**: show "SIMULATED" on crew and vitals and "LIVE · NOAA SWPC / NASA DONKI" on space-weather tints. This follows the project rule of never inventing live data.
