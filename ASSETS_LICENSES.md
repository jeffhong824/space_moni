# SpaceMoni `/sim` asset licenses

Compiled 2026-11-10 (Asia/Taipei). Every file in this folder is listed below with its source, author, license and attribution text.
SpaceMoni is a **non-commercial** NASA Space Apps 2026 hackathon demo. No NASA logos or insignia are included.

## Sources

### 1. tgstation (Space Station 13): sprites
- Repository: https://github.com/tgstation/tgstation (commit `b75599a478ca97b6042726694f9d24e8d83566c9`, fetched 2026-11-10)
- License, quoted from the repository README: *"All assets including icons and sound are under a [Creative Commons 3.0 BY-SA license](https://creativecommons.org/licenses/by-sa/3.0/) unless otherwise indicated."*
  (The code is AGPLv3/GPLv3, but we use **only** the `icons/**/*.dmi` image assets. We read the DMI files as PNGs, sliced them, and in some cases composited/tinted them.)
- Author: tgstation contributors (Space Station 13 community). Per-file history: `git log -- <path>` in the repo.
- **Required attribution text** (put it in the app's credits / data-sources page):
  > Pixel art sprites from Space Station 13 / tgstation (https://github.com/tgstation/tgstation) by the tgstation contributors, licensed CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/). Modified for SpaceMoni: sliced, recoloured, composited, and animation frames derived. Modified sprites are shared under the same CC BY-SA 3.0 license.
- **ShareAlike**: these files, and any derivative sprite you make from them, must stay CC BY-SA 3.0. This applies only to the art. The app's code license is not affected.

### 2. AI-generated (this project)
- Made with Grok Bot's GenerateImage tool on 2026-11-10 using the tgstation sprites above as a *style reference*. The magenta background was keyed out and the result downsampled to pixel art with PIL.
- Marked **AI-generated** below. No third-party license is claimed. Free to use within this project. Credit as: "AI-generated art (SpaceMoni team)".
- Raw generations are kept in `/workspace/sim-ref/gen/` (not shipped).

## Per-file table

| File | Source | Author | License | Notes |
|---|---|---|---|---|
| `props/sleep/sleep_pod.png` | tgstation:icons/obj/machines/sleeper.dmi (state "sleeper") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/sleep/sleep_pod_open.png` | tgstation:icons/obj/machines/sleeper.dmi (state "sleeper-open") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/sleep/bunk.png` | tgstation:icons/obj/bed.dmi (state "bed") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/sleep/crew_quarters_locker.png` | tgstation:icons/obj/storage/closet.dmi (state "generic")<br>tgstation:icons/obj/storage/closet.dmi (state "generic_door") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/galley/fridge.png` | tgstation:icons/obj/machines/kitchen.dmi (state "fridge") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/galley/food_warmer.png` | tgstation:icons/obj/machines/microwave.dmi (state "mw") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/galley/food_warmer_on.png` | tgstation:icons/obj/machines/microwave.dmi (state "mw1") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/galley/coffee_maker.png` | tgstation:icons/obj/machines/coffeemaker.dmi (state "coffeemaker_pot_full") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/galley/food_storage.png` | tgstation:icons/obj/machines/smartfridge.dmi (state "smartfridge")<br>tgstation:icons/obj/machines/smartfridge.dmi (state "smartfridge-food-3") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/exercise/resistive_lifter.png` | tgstation:icons/obj/fluff/gym_equipment.dmi (state "stacklifter") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/exercise/resistive_lifter_in_use.png` | tgstation:icons/obj/fluff/gym_equipment.dmi (state "stacklifter-u") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/exercise/bench_press.png` | tgstation:icons/obj/fluff/gym_equipment.dmi (state "benchpress") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/exercise/bench_press_in_use.png` | tgstation:icons/obj/fluff/gym_equipment.dmi (state "benchpress-u") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/eclss/thermal_control.png` | tgstation:icons/obj/machines/atmospherics/thermomachine.dmi (state "thermo_base") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/eclss/thermal_control_on.png` | tgstation:icons/obj/machines/atmospherics/thermomachine.dmi (state "thermo_base_1") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/eclss/o2_tank.png` | tgstation:icons/obj/canisters.dmi (state "oxygen") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/eclss/n2_tank.png` | tgstation:icons/obj/canisters.dmi (state "generic") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/eclss/air_vent.png` | tgstation:icons/obj/machines/atmospherics/unary_devices.dmi (state "vent_out") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/eclss/co2_scrubber.png` | tgstation:icons/obj/machines/atmospherics/unary_devices.dmi (state "scrub_on") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/eclss/water_processor.png` | tgstation:icons/obj/machines/atmospherics/miners.dmi (state "miner") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/airlock/airlock_external.png` | tgstation:icons/obj/doors/airlocks/external/external.dmi (state "closed") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/airlock/airlock_external_opening.png` | tgstation:icons/obj/doors/airlocks/external/external.dmi (state "opening") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/airlock/hatch_shuttle.png` | tgstation:icons/obj/doors/airlocks/shuttle/shuttle.dmi (state "closed") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/airlock/hatch_shuttle_opening.png` | tgstation:icons/obj/doors/airlocks/shuttle/shuttle.dmi (state "opening") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/airlock/suit_storage.png` | tgstation:icons/obj/machines/suit_storage.dmi (state "classic")<br>tgstation:icons/obj/machines/suit_storage.dmi (state "classic_suit")<br>tgstation:icons/obj/machines/suit_storage.dmi (state "classic_helm")<br>tgstation:icons/obj/machines/suit_storage.dmi (state "classic_lights_closed") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/airlock/suit_storage_empty.png` | tgstation:icons/obj/machines/suit_storage.dmi (state "classic")<br>tgstation:icons/obj/machines/suit_storage.dmi (state "classic_lights_closed") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/airlock/suit_storage_industrial.png` | tgstation:icons/obj/machines/suit_storage.dmi (state "industrial")<br>tgstation:icons/obj/machines/suit_storage.dmi (state "industrial_suit")<br>tgstation:icons/obj/machines/suit_storage.dmi (state "industrial_helm")<br>tgstation:icons/obj/machines/suit_storage.dmi (state "industrial_lights_closed") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/lab/server_rack.png` | tgstation:icons/obj/machines/research.dmi (state "server-on") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/lab/fabricator.png` | tgstation:icons/obj/machines/research.dmi (state "protolathe") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/lab/circuit_bench.png` | tgstation:icons/obj/machines/research.dmi (state "circuit_imprinter") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/lab/analyzer.png` | tgstation:icons/obj/machines/research.dmi (state "d_analyzer") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/lab/sample_fridge.png` | tgstation:icons/obj/machines/smartfridge.dmi (state "smartfridge")<br>tgstation:icons/obj/machines/smartfridge.dmi (state "smartfridge-petri-3") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/medical/med_kiosk.png` | tgstation:icons/obj/machines/medical_kiosk.dmi (state "kiosk") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/medical/med_bed.png` | tgstation:icons/obj/medical/medical_bed.dmi (state "med_down") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/medical/stasis_bed.png` | tgstation:icons/obj/machines/stasis.dmi (state "stasis") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/medical/stasis_bed_on.png` | tgstation:icons/obj/machines/stasis.dmi (state "stasis_on") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/medical/vitals_monitor.png` | tgstation:icons/obj/machines/vitals_monitor.dmi (state "frame")<br>tgstation:icons/obj/machines/vitals_monitor.dmi (state "ekg") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/medical/iv_drip.png` | tgstation:icons/obj/medical/iv_drip.dmi (state "iv_drip") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/medical/medkit.png` | tgstation:icons/obj/storage/medkit.dmi (state "medkit") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/medical/medkit_advanced.png` | tgstation:icons/obj/storage/medkit.dmi (state "medkit_advanced") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/command/console_command.png` | tgstation:icons/obj/machines/modular_console.dmi (state "console")<br>tgstation:icons/obj/machines/modular_console.dmi (state "command") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/command/console_comms.png` | tgstation:icons/obj/machines/modular_console.dmi (state "console")<br>tgstation:icons/obj/machines/modular_console.dmi (state "comm_monitor") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/command/console_crew.png` | tgstation:icons/obj/machines/modular_console.dmi (state "console")<br>tgstation:icons/obj/machines/modular_console.dmi (state "crew") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/command/console_nav.png` | tgstation:icons/obj/machines/modular_console.dmi (state "console")<br>tgstation:icons/obj/machines/modular_console.dmi (state "shuttle") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/command/console_power.png` | tgstation:icons/obj/machines/modular_console.dmi (state "console")<br>tgstation:icons/obj/machines/modular_console.dmi (state "power_monitor") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/command/console_atmos.png` | tgstation:icons/obj/machines/modular_console.dmi (state "console")<br>tgstation:icons/obj/machines/modular_console.dmi (state "atmos_control") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/command/comms_transmitter.png` | tgstation:icons/obj/machines/telecomms.dmi (state "broadcaster") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/command/comms_relay.png` | tgstation:icons/obj/machines/telecomms.dmi (state "relay") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/command/comms_hub.png` | tgstation:icons/obj/machines/telecomms.dmi (state "hub") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/robotics/arm_base.png` | tgstation:icons/obj/machines/big_manipulator_parts/big_manipulator_core.dmi (state "core") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/robotics/arm_hand.png` | tgstation:icons/obj/machines/big_manipulator_parts/big_manipulator_hand.dmi (state "hand") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/robotics/robotics_fab.png` | tgstation:icons/obj/machines/robotics.dmi (state "fab-idle") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/robotics/robotics_fab_active.png` | tgstation:icons/obj/machines/robotics.dmi (state "fab-active") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/hygiene/toilet.png` | tgstation:icons/obj/watercloset.dmi (state "toilet00") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/hygiene/shower.png` | tgstation:icons/obj/watercloset.dmi (state "shower") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/hygiene/sink.png` | tgstation:icons/obj/watercloset.dmi (state "sink") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/hygiene/mirror.png` | tgstation:icons/obj/watercloset.dmi (state "mirror") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/hygiene/curtain.png` | tgstation:icons/obj/watercloset.dmi (state "bathroom-closed") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/storage/crate.png` | tgstation:icons/obj/storage/crates.dmi (state "crate") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/storage/crate_secure.png` | tgstation:icons/obj/storage/crates.dmi (state "securecrate") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/storage/locker_grey.png` | tgstation:icons/obj/storage/closet.dmi (state "generic")<br>tgstation:icons/obj/storage/closet.dmi (state "grey_door") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/storage/locker_eva.png` | tgstation:icons/obj/storage/closet.dmi (state "emergency")<br>tgstation:icons/obj/storage/closet.dmi (state "emergency_door") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/furniture/seat_shuttle.png` | tgstation:icons/obj/chairs.dmi (state "shuttle_chair") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/furniture/office_chair.png` | tgstation:icons/obj/chairs.dmi (state "officechair_dark") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/furniture/light_tube.png` | tgstation:icons/obj/lighting.dmi (state "tube") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `props/furniture/handrail.png` | tgstation:icons/obj/handrail.dmi (state "handrail") | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `tiles/floors.png` | tgstation:icons/turf/floors.dmi (states floor, white, dark, textured, textured_white, textured_dark, smooth, freezer, kitchen, plating, recharge_floor, solarpanel, darkfull, white_large, dark_large, showroomfloor) | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `tiles/shuttle_walls.png` | tgstation:icons/turf/shuttle.dmi (states swall0, swall1, swall2, swall3, swall4, swall7, swall8, swall11, swall12, swall13, swall14, swall15) | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `tiles/shuttle_misc.png` | tgstation:icons/turf/shuttle.dmi (states wall_floor, swall_s5, swall_s6, swall_s9, swall_s10, wall_floor, heater, router, burst_l, propulsion, burst_r, propulsion_w) | tgstation contributors | CC BY-SA 3.0 | sliced from DMI (frames laid out as strip / dirs as rows) |
| `crew/commander.png` | tgstation:icons/mob/human/bodyparts_greyscale.dmi (human_* parts, skin-tinted)<br>tgstation:icons/mob/human/human_eyes.dmi<br>tgstation:icons/mob/human/human_face.dmi (hair)<br>tgstation:icons/mob/clothing/feet.dmi<br>tgstation:icons/mob/clothing/under/color.dmi "jumpsuit" (tinted) | tgstation contributors | CC BY-SA 3.0 | Composited from layered tgstation mob sprites; walk/idle/sleep/work frames DERIVED by pixel-shifting/rotating the original frames (modification, same CC BY-SA 3.0). |
| `crew/flight_engineer.png` | tgstation:icons/mob/human/bodyparts_greyscale.dmi (human_* parts, skin-tinted)<br>tgstation:icons/mob/human/human_eyes.dmi<br>tgstation:icons/mob/human/human_face.dmi (hair)<br>tgstation:icons/mob/clothing/feet.dmi<br>tgstation:icons/mob/clothing/under/engineering.dmi "engine" | tgstation contributors | CC BY-SA 3.0 | Composited from layered tgstation mob sprites; walk/idle/sleep/work frames DERIVED by pixel-shifting/rotating the original frames (modification, same CC BY-SA 3.0). |
| `crew/science_officer.png` | tgstation:icons/mob/human/bodyparts_greyscale.dmi (human_* parts, skin-tinted)<br>tgstation:icons/mob/human/human_eyes.dmi<br>tgstation:icons/mob/human/human_face.dmi (hair)<br>tgstation:icons/mob/clothing/feet.dmi<br>tgstation:icons/mob/clothing/under/rnd.dmi "science" | tgstation contributors | CC BY-SA 3.0 | Composited from layered tgstation mob sprites; walk/idle/sleep/work frames DERIVED by pixel-shifting/rotating the original frames (modification, same CC BY-SA 3.0). |
| `crew/medical_officer.png` | tgstation:icons/mob/human/bodyparts_greyscale.dmi (human_* parts, skin-tinted)<br>tgstation:icons/mob/human/human_eyes.dmi<br>tgstation:icons/mob/human/human_face.dmi (hair)<br>tgstation:icons/mob/clothing/feet.dmi<br>tgstation:icons/mob/clothing/under/medical.dmi "scrubsblue" | tgstation contributors | CC BY-SA 3.0 | Composited from layered tgstation mob sprites; walk/idle/sleep/work frames DERIVED by pixel-shifting/rotating the original frames (modification, same CC BY-SA 3.0). |
| `crew/mission_specialist.png` | tgstation:icons/mob/human/bodyparts_greyscale.dmi (human_* parts, skin-tinted)<br>tgstation:icons/mob/human/human_eyes.dmi<br>tgstation:icons/mob/human/human_face.dmi (hair)<br>tgstation:icons/mob/clothing/feet.dmi<br>tgstation:icons/mob/clothing/under/color.dmi "jumpsuit" (tinted) | tgstation contributors | CC BY-SA 3.0 | Composited from layered tgstation mob sprites; walk/idle/sleep/work frames DERIVED by pixel-shifting/rotating the original frames (modification, same CC BY-SA 3.0). |
| `crew/pilot.png` | tgstation:icons/mob/human/bodyparts_greyscale.dmi (human_* parts, skin-tinted)<br>tgstation:icons/mob/human/human_eyes.dmi<br>tgstation:icons/mob/human/human_face.dmi (hair)<br>tgstation:icons/mob/clothing/feet.dmi<br>tgstation:icons/mob/clothing/under/color.dmi "jumpsuit" (tinted) | tgstation contributors | CC BY-SA 3.0 | Composited from layered tgstation mob sprites; walk/idle/sleep/work frames DERIVED by pixel-shifting/rotating the original frames (modification, same CC BY-SA 3.0). |
| `crew/eva_suit.png` | tgstation:icons/mob/human/bodyparts_greyscale.dmi (human_* parts, skin-tinted)<br>tgstation:icons/mob/human/human_eyes.dmi<br>tgstation:icons/mob/human/human_face.dmi (hair)<br>tgstation:icons/mob/clothing/feet.dmi<br>tgstation:icons/mob/clothing/suits/spacesuit.dmi "space"<br>tgstation:icons/mob/clothing/head/spacehelm.dmi "space"<br>tgstation:icons/mob/clothing/back.dmi "jetpack" | tgstation contributors | CC BY-SA 3.0 | Composited from layered tgstation mob sprites; walk/idle/sleep/work frames DERIVED by pixel-shifting/rotating the original frames (modification, same CC BY-SA 3.0). |
| `crew/eva_suit_heavy.png` | tgstation:icons/mob/human/bodyparts_greyscale.dmi (human_* parts, skin-tinted)<br>tgstation:icons/mob/human/human_eyes.dmi<br>tgstation:icons/mob/human/human_face.dmi (hair)<br>tgstation:icons/mob/clothing/feet.dmi<br>tgstation:icons/mob/clothing/suits/spacesuit.dmi "spaceold"<br>tgstation:icons/mob/clothing/head/spacehelm.dmi "spaceold" | tgstation contributors | CC BY-SA 3.0 | Composited from layered tgstation mob sprites; walk/idle/sleep/work frames DERIVED by pixel-shifting/rotating the original frames (modification, same CC BY-SA 3.0). |
| `props/exercise/treadmill.png` | AI-generated (gen_exercise_props) | SpaceMoni team via GenerateImage | **AI-generated**, no third-party license | keyed + pixel-downsampled |
| `props/exercise/cycle_ergometer.png` | AI-generated (gen_exercise_props) | SpaceMoni team via GenerateImage | **AI-generated**, no third-party license | keyed + pixel-downsampled |
| `props/exercise/ared.png` | AI-generated (gen_exercise_props) | SpaceMoni team via GenerateImage | **AI-generated**, no third-party license | keyed + pixel-downsampled |
| `ships/leo_station.png` | AI-generated (leo) | SpaceMoni team via GenerateImage | **AI-generated**, no third-party license | keyed + pixel-downsampled |
| `ships/lunar_gateway.png` | AI-generated (gateway) | SpaceMoni team via GenerateImage | **AI-generated**, no third-party license | keyed + pixel-downsampled |
| `ships/mars_transit.png` | AI-generated (mars) | SpaceMoni team via GenerateImage | **AI-generated**, no third-party license | keyed + pixel-downsampled |
| `ships/lunar_surface_base.png` | AI-generated (lunarbase) | SpaceMoni team via GenerateImage | **AI-generated**, no third-party license | keyed + pixel-downsampled |
| `planets/earth.png` | AI-generated (planets) | SpaceMoni team via GenerateImage | **AI-generated**, no third-party license | keyed + pixel-downsampled |
| `planets/moon.png` | AI-generated (planets) | SpaceMoni team via GenerateImage | **AI-generated**, no third-party license | keyed + pixel-downsampled |
| `planets/mars.png` | AI-generated (planets) | SpaceMoni team via GenerateImage | **AI-generated**, no third-party license | keyed + pixel-downsampled |

`tgstation:<path>` means https://github.com/tgstation/tgstation/blob/b75599a478ca97b6042726694f9d24e8d83566c9/<path>

`preview/*.png` are composed from the files above and inherit CC BY-SA 3.0 for the tgstation parts.
`tools/*.py` are our own build scripts.

Expanded 2026-11-10 crew (Harmony 7 / Gateway 4 / Ares 6 / Mare 4) **reuses** the existing `crew/*.png` tgstation composites by role (commander, pilot, flight_engineer, science_officer, medical_officer, mission_specialist, eva_suit). No new sprite sheets were generated; additional fictional crew members share those sheets. See `docs/crew-composition.md`.

## Clinical body map (dashboard)

| Asset | Source | Author | License | Notes |
|---|---|---|---|---|
| `public/bodymap/body-front.webp` (+ `.jpg` fallback) | AI-generated holographic anatomy (front) | SpaceMoni | **AI-generated**, non-commercial demo | 720×1280 plate. Overlay tints are simulated HRP-domain status, not medical imaging. |
| `public/bodymap/body-back.webp` (+ `.jpg` fallback) | AI-generated holographic anatomy (back) | SpaceMoni | **AI-generated**, non-commercial demo | 720×1280 plate. Same terms as front. |
| `src/components/AnatomicalFigure.tsx` | SVG hit regions / scanner overlay | SpaceMoni | Original (this repo) | Transparent hotspots aligned to the plates (brain, eyes, heart, lungs, kidneys, spine, hips, quads, calves/hamstrings, skin) plus radiation aura. |

HRP domain mapping (not an asset license, cited on Data sources):

- [NASA Human Research Roadmap](https://humanresearchroadmap.nasa.gov/)
- [SANS (NASA)](https://www.nasa.gov/humans-in-space/spaceflight-associated-neuro-ocular-syndrome-sans/)
- Bone unloading analog ~1.2% BMD / 30 d is a **transparent demo model**, not a NASA-certified rate for an individual.