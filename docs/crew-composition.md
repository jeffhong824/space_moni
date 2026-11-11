# Crew composition and biomonitoring (public sources)

SpaceMoni’s fleet is a **labeled simulation**. Crew names are fictional. Sizes, roles, and wearable *signal types* follow public NASA / CSA / ESA documents cited below. Simulated vitals are never presented as live NASA telemetry. Official NOAA SWPC / NASA DONKI weather stays labeled LIVE.

Epoch for the sim: **2026-11-10 00:00 Asia/Taipei**.

## Typical crew size and roles

### ISS long-duration expeditions — normally 7

NASA states that after Commercial Crew began flying **crews of four** on U.S. spacecraft, **the full station crew expanded to seven**, combining those four with a **three-person Soyuz** complement. Direct handover briefly raises the count further (e.g. 11). Expedition pages list seven long-duration residents at a time (commander plus flight engineers).

Roles in practice: **Commander**, plus **Pilot** (Crew Dragon) and **Flight Engineers / Mission Specialists** covering ECLSS, robotics, science, and medical collateral duties. NASA: “Today there are usually seven astronauts living on board at any given time, from a variety of countries.”

Sources:

- [Top Things to Know about Space Station Crew Handovers (NASA)](https://www.nasa.gov/general/top-things-to-know-about-space-station-crew-handovers/)
- [Astronauts — NASA](https://www.nasa.gov/humans-in-space/astronauts/)
- [Expedition 75 (NASA)](https://www.nasa.gov/mission/expedition-75/)

**SpaceMoni mapping:** Harmony Station (LEO analog) carries **7**.

### Artemis II / Orion — 4

NASA named a crew of four for Artemis II, the first crewed Orion lunar flyby: **Commander, Pilot, Mission Specialist 1, Mission Specialist 2**.

Sources:

- [NASA Names Astronauts to Next Moon Mission, First Crew Under Artemis](https://www.nasa.gov/news-release/nasa-names-astronauts-to-next-moon-mission-first-crew-under-artemis/)
- [The Roles of the Artemis II Crew (NASA PDF)](https://www.nasa.gov/wp-content/uploads/2026/01/a2-crew-infographic-012225.pdf)
- [Our Artemis Crew (NASA)](https://www.nasa.gov/feature/our-artemis-crew/)

### Gateway — up to 4

NASA: “Early configurations of Gateway with Orion attached can accommodate **up to four astronauts** for 30–90 days.” CSA: living quarters for crews of four, visits up to about three months. Early missions: four arrive on Orion; **two may go to the surface while two remain aboard Gateway**.

Sources:

- [Gateway Capabilities (NASA)](https://www.nasa.gov/gateway-capabilities/)
- [Gateway: Frequently Asked Questions (NASA)](https://www.nasa.gov/gateway-frequently-asked-questions/)
- [Gateway | Canadian Space Agency](https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/gateway.asp)
- [Houston We Have a Podcast: Gateway (NASA JSC)](https://www.nasa.gov/podcasts/houston-we-have-a-podcast/gateway-the-lunar-space-station/)

**SpaceMoni mapping:** After NASA’s March 2026 pivot from Gateway to a lunar south-pole surface base, this four-person slot is a **hypothetical Moon Base · South Pole** (same `ship-gateway` id so existing art/layout stay). Commander, Pilot, two Mission Specialists. Labeled SIMULATION.

### Artemis lunar surface stays — 2 (early); habitat up to 4

NASA’s Artemis III surface concept of operations: **two astronauts** board the lander; **two remain in Orion**. Surface stay ~6.5 days. Later Artemis Base Camp concept: a fixed habitat that can house **up to four astronauts** for about a month.

Sources:

- [Artemis III: NASA’s First Human Mission to Lunar South Pole](https://www.nasa.gov/missions/artemis/artemis-iii/)
- [Exploration EVA System Concept of Operations Summary (NASA PDF)](https://www.nasa.gov/wp-content/uploads/2020/01/topic_1-_eva_lunar_surface_concept_of_operations.pdf)
- [Lunar Living: NASA’s Artemis Base Camp Concept](https://www.nasa.gov/blogs/missions/2020/10/28/lunar-living-nasas-artemis-base-camp-concept/)

**SpaceMoni mapping:** Mare Serenitatis Outpost is a **surface habitat analog**, so **4** (Base Camp), not a two-person 6.5-day sortie.

### NASA Mars Design Reference Architecture — 4–6 (DRA 5.0 uses 6)

NASA SP-2009-566 *Human Exploration of Mars Design Reference Architecture 5.0* sends **a crew of six** on each conjunction-class mission: “a reasonable compromise between the skill mix and level of effort … balanced with the magnitude of the systems and infrastructure.” Addendum 2 also studies **four vs six**. Other public architectures (e.g. Mars Direct) use four; this sim follows DRA 5.0’s six for the transit vehicle.

Sources:

- [NASA SP-2009-566 (PDF on nasa.gov)](https://www.nasa.gov/wp-content/uploads/2015/09/373665main_nasa-sp-2009-566.pdf)
- [NTRS 20090040343 — Human Exploration of Mars Design Reference](https://ntrs.nasa.gov/api/citations/20090040343/downloads/20090040343.pdf)
- [DRA 5.0 Addendum 2 (four vs six)](https://www.nasa.gov/wp-content/uploads/2015/09/nasa-sp-2009-566-add2.pdf)

**SpaceMoni mapping:** Ares Drift (Mars transit analog) carries **6**.

## ISS-style daily timeline (schedule basis)

A weekday 24 h block is typically: **8.5 h sleep**, **6.5 h scheduled work**, **2.5 h required exercise**, **1 h lunch**, plus post-sleep / pre-sleep, morning and evening Daily Planning Conferences, meals, and personal time. Exercise uses treadmill, cycle ergometer, and ARED.

Sources:

- [ESA Outpost 42 — The astronaut daily schedule](https://outpost42.esa.int/blog/the-astronaut-daily-schedule/index.html)
- NASA ISS blog examples of exercise / science / maintenance days, e.g. [Crew’s Wednesday Schedule…](https://www.nasa.gov/blogs/spacestation/2022/07/27/crews-wednesday-schedule-focuses-on-exercise-science-and-maintenance/)

## Wearables and biomonitoring (what they actually measure)

These devices exist on ISS or in ISS research. SpaceMoni **simulates the same signal classes**. It does not ingest a live ISS Bio-Monitor feed.

| System | Agency / vendor | Signals actually reported |
|---|---|---|
| **Bio-Monitor / Astroskin** smart shirt | CSA; Carré Technologies (Hexoskin) | Pulse and **3-lead ECG**; **heart rate / HRV**; **breathing rate and volume**; **SpO₂**; **skin temperature**; **blood pressure** (estimate); **physical activity** / 3-axis accel. Wearable during sleep and exercise. Operational on ISS since ~2018–2019. |
| **Actiwatch Spectrum** | NASA ISS Medical Project (COTS wristwatch) | Wrist **motion** and **ambient light** for sleep–wake, circadian, and activity. Not ECG. |
| **Crew Health Care System (CHeCS)** | NASA ISS | On-orbit medical hardware catalog: environmental / clinical kit plus **radiation** subsystem. |
| **Crew Passive Dosimeter (CPD)** and area RAMs | NASA CHeCS Radiation | Personal **absorbed dose / dose equivalent** (TLD, OSLD, PNTD). Worn all flight including EVA. **Analyzed post-flight — not a real-time telemetry stream.** Russian / ESA crewmembers use partner dosimeters. |
| **TEPC** (cabin) | NASA | Near-real-time **cabin** dose rate / LET — station environment, not a worn shirt. |
| **ESA Active Dosimeter** / CSA **EVARM** | ESA / CSA research | Worn or pocket **active** dosimetry during ISS and (Active Dosimeter) Artemis I. |

Sources:

- [Bio-Monitor: Keeping an eye on astronauts' vital signs (CSA)](https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp)
- [Astroskin (Canada.ca / CSA, 2016)](https://www.canada.ca/en/space-agency/news/2016/10/astroskin.html)
- [Wearable Tech for Space Station Research (NASA)](https://www.nasa.gov/missions/station/iss-research/wearable-tech-for-space-station-research/)
- [ISS Medical Project on-orbit hardware list — Actiwatch Spectrum (NASA PDF)](https://www.nasa.gov/wp-content/uploads/2015/05/issmp_on-orbit-hardware.pdf)
- [CHeCS Medical Hardware Catalog v10 (NTRS 20110022379)](https://ntrs.nasa.gov/api/citations/20110022379/downloads/20110022379.pdf)

## How SpaceMoni uses this

| Ship | Analog | Sim crew | Roles (fictional people) |
|---|---|---|---|
| Harmony Station | ISS long-duration | **7** | Commander, Pilot, Flight Engineers, Mission Specialists |
| Moon Base · South Pole | Hypothetical lunar south-pole surface base (Gateway pivot, Mar 2026) | **4** | Commander, Pilot, 2 Mission Specialists |
| Ares Drift | Mars DRA 5.0 transit | **6** | Commander, Pilot, Flight Engineers, Medical, Science |
| Mare Serenitatis | Artemis Base Camp habitat | **4** | Commander, habitat/EVA/geology specialists |

Wearable stream (SIMULATION, ~1 Hz): HR, HRV, respiration, SpO₂, skin/core temperature, BP, steps/activity, sleep stage, battery/signal, and **accumulated dose** scaled from ship shielding × official NOAA S-scale / GOES proton flux (LIVE weather). EVA raises dose rate (less shielding). Exercise raises HR/resp; sleep lowers them. Status Caution/Critical comes from scripted events (illness, CO₂, EVA fatigue, sleep deficit) and out-of-band SpO₂/temp — not from a normal ARED session.
