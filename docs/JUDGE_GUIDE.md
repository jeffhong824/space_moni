# Judge guide — SpaceMoni (60 seconds)

SpaceMoni is a **prototype** of the HRP **EIHSO-202** semi-autonomous crew monitoring dashboard (NASA Space Apps 2026 Taipei, Best Use of Science). It is **not a NASA product** and **not a medical device**.

Demo password: **`12345`**. Or click **Take the 60-second tour** on the login screen (`/tour` or `/?tour=1`).

## Suggested path

1. **Alice / `/today` (Harmony, LEO)**  
   Simulated vitals. HRV caution should show a **cited AURA CMO rec** without opening the orb. Earth-independent card: **Real-time link · no queue** (0 s delay) — send a note and it shows **Delivered**. Delay badge and sol chip are visible at 390 px.
2. **SPE card**  
   Quiet still shows GOES ≥10 / ≥100 MeV PFU. Bars for **600 mSv career** and **250 mSv SPE**. Ladder Quiet → WATCH → SHELTER. Toggle **Drill / SIMULATION** to preview stages. No invented NOAA numbers.
3. **Body map `/body`**  
   Circular **i** on each metric: How / Why (HRR link) / When. SANS logMAR uses localized eye labels, term `logMAR` kept.
4. **Science `/science`**  
   Traceability table + 22-row HRR matrix. Moon Base source line: *Hypothetical lunar south-pole surface base, per NASA Moon Base direction, Mar 2026* (no leftover Gateway). Kicker is localized (including zh).
5. **Commander `marcus_vance` `/crew`**  
   Station-aware day line (LEO / Moon / Mars sol). CMO recs and return-to-Earth / next-landing readiness.
6. **NASA `nasa_mission_control` `/hq` then `/cases` then `/sources`**  
   Readiness across ships. DONKI badge: empty window is **not** “feed failed”; Partial vs failed are distinct. About this project + MIT + not-a-device notice.

## Labels to trust

LIVE / SOURCED-STATIC / SIMULATION / SELF-REPORTED / ASSUMPTION.

Glucose 65–99 mg/dL is from **OSD-575 CMP CSV**, not invented.
