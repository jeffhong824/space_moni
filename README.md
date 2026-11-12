# SpaceMoni

Prototype of the NASA Human Research Program **EIHSO-202** semi-autonomous crew monitoring dashboard.

**NASA Space Apps 2026 — Taipei · Best Use of Science**  
Team: **OGTech AI** (歐碁科技有限公司)  
Challenge: *Create Health Monitoring Software for Astronauts on Space Missions*

SpaceMoni is a hackathon prototype, **not a medical device** and **not a NASA product**. AURA is decision support, not a diagnosis. Crew physiology is labeled **SIMULATION**. Space weather is **LIVE** NOAA SWPC/GOES (and NASA DONKI when the catalog answers). Nothing is silently filled in.

Traditional Chinese README: [`docs/README.zh-Hant-TW.md`](docs/README.zh-Hant-TW.md)  
Judge walkthrough: [`docs/JUDGE_GUIDE.md`](docs/JUDGE_GUIDE.md)

## What it is

A dual-runtime (Vite + Express) console for three demo roles:

| Role | Account | Home |
| --- | --- | --- |
| Astronaut | `alice_smith` | `/today` personal dashboard |
| Commander | `marcus_vance` | `/crew` roster |
| NASA flight surgeon | `nasa_mission_control` | `/hq` + `/cases` |
| Guest | (no password) | `/sim` fleet |

Demo password for every signed-in account: **`12345`**.

Four locales with key parity: `en`, `zh-Hant-TW`, `es`, `ja`.

## Provenance labels

| Tag | Meaning |
| --- | --- |
| LIVE | NOAA SWPC/GOES or NASA DONKI at runtime |
| SOURCED-STATIC | Cited publication or NASA-STD-3001 / HRP RAP |
| SIMULATION | Demo crew, world, or formula |
| SELF-REPORTED | Crew-entered measurement |
| ASSUMPTION | Labeled demo mapping, not a NASA equation |

## Features shipped for the brief (HRP directions)

1. **Earth-independent ops (EIHSO-202)** — delay badge, autonomous vs ground actions, LEO real-time link (no dead queue), Moon ~1.28 s, Mars AU clamped 4–22 min (not JPL Horizons).
2. **SPE WATCH / SHELTER** — GOES ≥10 / ≥100 MeV PFU even when quiet; career 600 mSv and 250 mSv SPE bars; stage ladder; labeled Drill / SIMULATION overlay.
3. **AURA CMO recs** — visible by default; HRV and baseline-z triggers; empty state with cited checks that passed; real station delay on the surgeon desk.
4. **Personal baselines** — z vs that person’s own pre-mission numbers (demo |z| 1.5 / 2.5).
5. **OSDR Inspiration4** — OSD-569 CBC / OSD-575 CMP (glucose 65–99 mg/dL from the CMP CSV).
6. **BH-201 / Team-201** mood check-in.
7. **Sol clock** 24 h 39 m 35 s; sleep debt / PVT analog.
8. **SANS** weekly Amsler + logMAR (OD/OS labels localized, term `logMAR` kept).
9. **Post-landing / return-to-Earth readiness** on Harmony, Moon Base, Ares, commander, and HQ (fleet).
10. **Moon Base · South Pole** — hypothetical lunar south-pole surface base, per NASA Moon Base direction, Mar 2026 (`ship-gateway` id unchanged).

Plus audit-gap work: DONKI aggregate (ok / empty / degraded / error), i18n bands, self-measurement log, How/Why/When on every metric, daily prompts, streaks, not-a-device notice, Apollo 9 login still, MIT license, `/tour`, EVA/DCS/dust/immune log, 22-row HRR matrix on `/science`.

## Quick start

```bash
npm install
npm run dev          # Vite + API
npm test
npm run build
```

Env (optional): `NASA_API_KEY` for DONKI, `AI_PROVIDER=gemini|openai|offline`.

## Data honesty

- No invented NASA crew numbers.
- Flare class is from **GOES X-ray**, not DONKI FLR.
- 250 mSv 30-day SPE bound is a **historical PEL**, not restated in attached Vol 2 Rev F.
- SPE extra mSv/h from S-scale is an **ASSUMPTION**.
- Login hero: NASA AS09-20-3064 (Apollo 9, 6 March 1969). No NASA logos.

## License

MIT © 2026 OGTech AI team (歐碁科技有限公司). See `LICENSE`.  
Sim pixel art from tgstation is CC BY-SA 3.0 — see `ASSETS_LICENSES.md`.
