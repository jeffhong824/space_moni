/** Science traceability rows for /science (judges). Provenance: LIVE / SOURCED-STATIC / SIMULATION / ASSUMPTION. */
export type Provenance = 'LIVE' | 'SOURCED-STATIC' | 'SIMULATION' | 'ASSUMPTION';

export interface ScienceRow {
  feature: string;
  hrp: string;
  std3001: string;
  source: string;
  provenance: Provenance;
}

export const SCIENCE_ROWS: ScienceRow[] = [
  {
    feature: 'Semi-autonomous crew dashboard (EIHSO-202)',
    hrp: 'EIHSO-202 item 2 — Recommendations for semi-autonomous monitoring dashboard (RAP June 2026)',
    std3001: 'Vol 2 Earth-independent ops context; HHP 2023 “Earth independence”',
    source: 'HRP Risk Approach Plans June 2026; HHP 2023 white paper',
    provenance: 'SOURCED-STATIC',
  },
  {
    feature: 'Comm delay badge + ground queue',
    hrp: 'EIHSO-102 / EIHSO-202 (communication delays)',
    std3001: '—',
    source: 'LEO ~0 s; Moon 384 400 km / c; Mars light-time from simulated AU (not JPL Horizons)',
    provenance: 'SOURCED-STATIC',
  },
  {
    feature: 'Two-stage SPE WATCH / SHELTER',
    hrp: 'Radiation / Cancer RAP; HHP space radiation monitoring',
    std3001: '[V2 6161] area/personal monitoring; [V2 6095] career PEL',
    source: 'NOAA SWPC GOES integral protons; NASA DONKI SEP/notifications',
    provenance: 'LIVE',
  },
  {
    feature: 'Artemis I GCR dose rate used in SPE card',
    hrp: '—',
    std3001: '—',
    source: 'George et al. Nature 2024 doi:10.1038/s41586-024-07927-7 — HERA 0.96–1.24 mSv d⁻¹; HSU2 13.47 mGy',
    provenance: 'SOURCED-STATIC',
  },
  {
    feature: 'SPE extra mSv/h vs S-scale',
    hrp: '—',
    std3001: '—',
    source: 'Demo mapping S1–S5 → mSv/h; not a NASA formula',
    provenance: 'ASSUMPTION',
  },
  {
    feature: 'Career 600 mSv comparison',
    hrp: 'Cancer RAP / NPR 8900 PEL evaluation',
    std3001: '[V2 6095] → NASA-STD-3001 Vol 1 §4.8 career PEL (600 mSv)',
    source: 'NASA-STD-3001 Vol 2 Rev F citation of Vol 1 §4.8',
    provenance: 'SOURCED-STATIC',
  },
  {
    feature: '250 mSv SPE 30-day comparison',
    hrp: '—',
    std3001: 'Historical Vol 1 short-term PEL (pre-2022); not restated in attached Vol 2 Rev F',
    source: 'Requested operational comparison bound',
    provenance: 'SOURCED-STATIC',
  },
  {
    feature: 'Crew accumulated dose',
    hrp: '—',
    std3001: 'Compared to PELs above',
    source: 'Demo mission-day × ship baseline mSv/d',
    provenance: 'SIMULATION',
  },
  {
    feature: 'AURA CMO decision support',
    hrp: 'EIHSO-204 decision support; HHP onboard medical',
    std3001: 'Medical §7.5; Doc-in-a-Box offline concept',
    source: 'Offline rules + optional Gemini/OpenAI; citations on each rec',
    provenance: 'SIMULATION',
  },
  {
    feature: 'Personal baseline z-score',
    hrp: 'Personalized monitoring (SANS-403 / BH-201)',
    std3001: '—',
    source: 'Each crew member’s own baseline ± demo σ',
    provenance: 'SIMULATION',
  },
  {
    feature: 'NASA OSDR Inspiration4 CBC',
    hrp: '—',
    std3001: '—',
    source: 'OSD-569 https://osdr.nasa.gov/bio/repo/data/studies/OSD-569/',
    provenance: 'SOURCED-STATIC',
  },
  {
    feature: 'NASA OSDR Inspiration4 CMP / cytokines',
    hrp: '—',
    std3001: '—',
    source: 'OSD-575 https://osdr.nasa.gov/bio/repo/data/studies/OSD-575/',
    provenance: 'SOURCED-STATIC',
  },
  {
    feature: 'Daily mood & team check-in',
    hrp: 'BH-201 indicators/thresholds; Team-201 team monitoring',
    std3001: '—',
    source: 'Crew-entered Likert; demo cut-scores',
    provenance: 'SIMULATION',
  },
  {
    feature: 'Sol clock 24h39m35s',
    hrp: '—',
    std3001: 'Vol 2 lighting rationale: 24 h 40 min Mars cycle',
    source: 'NASA-STD-3001 Vol 2 Rev F circadian rationale',
    provenance: 'SOURCED-STATIC',
  },
  {
    feature: 'Sleep debt / PVT trend',
    hrp: 'BH-201; sleep as SANS-202 inherent factor',
    std3001: 'Vol 2 sleep accommodations [V2 7073]',
    source: 'Demo sleep minutes and PVT analog',
    provenance: 'SIMULATION',
  },
  {
    feature: 'Weekly SANS self-check',
    hrp: 'SANS-101, SANS-404 ocular monitoring',
    std3001: '—',
    source: 'Amsler analog + logMAR entry; IRP-47065 §4.3.9',
    provenance: 'SIMULATION',
  },
  {
    feature: 'Post-landing egress card',
    hrp: 'SM-106 / SM-206 egress after G-transition',
    std3001: '[V2 7042] orthostatic intolerance countermeasures',
    source: 'Simulated stand/grip/vision scores',
    provenance: 'SIMULATION',
  },
  {
    feature: 'Moon Base · South Pole station',
    hrp: 'Lunar deliverable / Artemis RAP symbols',
    std3001: '—',
    source: 'Hypothetical surface base (Mar 2026 Gateway pivot). Not a real NASA crew manifest.',
    provenance: 'SIMULATION',
  },
  {
    feature: 'NOAA Kp / GOES X-ray / solar wind',
    hrp: '—',
    std3001: '[V2 6161] ionizing radiation monitoring',
    source: 'services.swpc.noaa.gov',
    provenance: 'LIVE',
  },
];
