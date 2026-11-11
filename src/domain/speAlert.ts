/**
 * Two-stage SPE alert + dose comparison to NASA-STD-3001 PELs.
 *
 * LIVE: NOAA SWPC GOES integral protons, DONKI SEP/notifications.
 * SOURCED-STATIC: NASA-STD-3001 Vol 2 [V2 6095] → Vol 1 §4.8 career PEL;
 *   Artemis I HERA HSU2 13.47 mGy / 0.96–1.24 mSv d⁻¹ GCR (Nature 2024).
 * ASSUMPTION: SPE extra dose scaling from S-scale (not a NASA formula).
 * SIMULATION: crew career accumulation from demo mission days.
 */
import { protonToSScale, sScaleElevated, type SpaceEnvironmentPayload } from './spaceWeather.ts';

export const STD3001_CAREER_MSV = 600;
export const STD3001_CAREER_CITE = {
  id: 'V2 6095',
  doc: 'NASA-STD-3001 Volume 2 Rev F §6.8.1.2',
  text: 'Career space PELs as set forth in Section 4.8 of NASA-STD-3001, Volume 1. 600 mSv career effective-dose limit (Vol 1 §4.8, 2023 revision).',
};

/** Historical 30-day SPE PEL. Not restated in attached Vol 2 Rev F. */
export const SPE_30DAY_MSV = 250;
export const SPE_30DAY_CITE = {
  id: 'PEL-30d-historical',
  doc: 'NASA-STD-3001 Volume 1 historical short-term PEL (pre-2022 Table 4)',
  text: '250 mSv in 30 days — historical NASA operational SPE comparison limit. Not restated in attached Vol 2 Rev F; shown as requested 30-day SPE bound.',
};

export const ARTEMIS_I_CITE = {
  id: 'Nature-2024-Artemis-I',
  doc: 'George et al., Nature 2024, Space radiation measurements during the Artemis I lunar mission',
  url: 'https://doi.org/10.1038/s41586-024-07927-7',
  absorbedMgyHsu2: 13.47,
  gcrMsvPerDay: { min: 0.96, max: 1.24, mid: 1.1 },
  innerBeltUgyPerMinHsu2: 287,
};

export type SpeStage = 'quiet' | 'watch' | 'shelter';

export interface SpeAlert {
  stage: SpeStage;
  sScale: string;
  pfu10: number | null;
  pfu100: number | null;
  reasons: string[];
  estimatedGcrMsvDay: number;
  estimatedSpeExtraMsvHour: number | null;
  speExtraAssumption: string;
  careerLimitMsv: number;
  spe30DayLimitMsv: number;
  shelterChecklist: Array<{ id: string; label: string }>;
}

function risingProtons(current: number | null, previous: number | null): boolean {
  if (current == null || previous == null) return false;
  return current >= 1 && current > previous * 1.25;
}

export function speStageFromInputs(opts: {
  pfu10: number | null;
  pfu100: number | null;
  prevPfu10?: number | null;
  donkiSepCount: number;
  donkiSepNotifications: number;
}): { stage: SpeStage; sScale: string; reasons: string[] } {
  const s = opts.pfu10 != null ? protonToSScale(opts.pfu10).code : 'S?';
  const reasons: string[] = [];
  const sElev = sScaleElevated(s);
  const pfu100Hot = opts.pfu100 != null && opts.pfu100 >= 1;
  if (sElev || pfu100Hot) {
    if (sElev) reasons.push(`NOAA S-scale ${s} from GOES ≥10 MeV integral protons`);
    if (pfu100Hot) reasons.push(`GOES ≥100 MeV flux ${opts.pfu100} pfu`);
    return { stage: 'shelter', sScale: s, reasons };
  }
  const watchDonki = opts.donkiSepCount > 0 || opts.donkiSepNotifications > 0;
  const watchRise = risingProtons(opts.pfu10, opts.prevPfu10 ?? null);
  const watchApproach = opts.pfu10 != null && opts.pfu10 >= 2 && opts.pfu10 < 10;
  if (watchDonki || watchRise || watchApproach) {
    if (watchDonki) reasons.push('DONKI SEP catalog and/or SEP notifications');
    if (watchRise) reasons.push('Rising GOES ≥10 MeV proton flux');
    if (watchApproach) reasons.push('GOES ≥10 MeV flux approaching S1 (10 pfu)');
    return { stage: 'watch', sScale: s, reasons };
  }
  return { stage: 'quiet', sScale: s, reasons: ['No DONKI SEP and GOES protons below NOAA S1'] };
}

/**
 * SPE extra dose rate. S-scale → mSv/h is an ASSUMPTION (not a NASA formula).
 * Anchored only as order-of-magnitude against Artemis I inner-belt proton rates
 * (Nature: inner belt and large SPE have similar peak fluxes).
 */
export function assumedSpeExtraMsvPerHour(sCode: string): number | null {
  const n = Number(/^S(\d)/.exec(sCode)?.[1]);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const table: Record<number, number> = { 1: 0.05, 2: 0.2, 3: 1.0, 4: 3.0, 5: 8.0 };
  return table[n] ?? 0;
}

export const SHELTER_CHECKLIST = [
  { id: 'move', label: 'Move crew to the highest-shielding volume' },
  { id: 'eva', label: 'Terminate EVA; no new EVA until S-scale declines' },
  { id: 'water', label: 'Use ECLSS water / gray-water mass as additional SPE shielding if procedure allows (HHP 2023)' },
  { id: 'dosimetry', label: 'Confirm personal/area monitors are logging ([V2 6161])' },
  { id: 'cmo', label: 'CMO reviews prodromal symptoms; AURA is decision support, not a diagnosis' },
  { id: 'ground', label: 'Queue a delayed ground report (EIHSO-202); do not wait for sign-off to shelter' },
] as const;

export function buildSpeAlert(payload: SpaceEnvironmentPayload | null, prevPfu10?: number | null): SpeAlert {
  const pfu10 = payload?.observations.protons?.flux ?? null;
  const pfu100 = payload?.observations.protons100?.flux ?? null;
  const sep = payload?.events.solarEnergeticParticles?.length ?? 0;
  const notes = (payload?.events.donkiNotifications ?? []).filter((n) =>
    /SEP|SPE|FLR|RAD/i.test(String(n.messageType || ''))
  ).length;
  const staged = speStageFromInputs({
    pfu10,
    pfu100,
    prevPfu10,
    donkiSepCount: sep,
    donkiSepNotifications: notes,
  });
  const extra = assumedSpeExtraMsvPerHour(staged.sScale);
  return {
    stage: staged.stage,
    sScale: staged.sScale,
    pfu10,
    pfu100,
    reasons: staged.reasons,
    estimatedGcrMsvDay: ARTEMIS_I_CITE.gcrMsvPerDay.mid,
    estimatedSpeExtraMsvHour: extra,
    speExtraAssumption:
      'SPE extra mSv/h from S-scale is an ASSUMPTION, not a NASA formula. GCR 1.1 mSv/d is the mid of Artemis I HERA 0.96–1.24 mSv d⁻¹ (Nature 2024).',
    careerLimitMsv: STD3001_CAREER_MSV,
    spe30DayLimitMsv: SPE_30DAY_MSV,
    shelterChecklist: SHELTER_CHECKLIST.map((s) => ({ id: s.id, label: s.label })),
  };
}

export function careerDoseMsv(opts: {
  missionDays: number;
  baselineMsvDay: number;
  speExtraMsv: number;
}): { total: number; source: 'simulation'; pctCareer: number; pctSpe30: number } {
  const gcr = Math.max(0, opts.missionDays) * opts.baselineMsvDay;
  const total = gcr + Math.max(0, opts.speExtraMsv);
  return {
    total,
    source: 'simulation',
    pctCareer: (total / STD3001_CAREER_MSV) * 100,
    pctSpe30: (Math.max(0, opts.speExtraMsv) / SPE_30DAY_MSV) * 100,
  };
}
