/**
 * Body-map domains mapped to NASA Human Research Program risks.
 * Scores and forecasts are SIMULATION — not clinical diagnoses.
 *
 * Citations (public):
 * - NASA HRP risks / Human Research Roadmap: https://humanresearchroadmap.nasa.gov/
 * - SANS: https://www.nasa.gov/humans-in-space/spaceflight-associated-neuro-ocular-syndrome-sans/
 * - Bone / muscle unloading: NASA HRP Bone and Muscle risks
 * - Behavioral Health & Performance (sleep, mood, cognition)
 * - Space radiation career-limit analog 600 mSv (NASA STD-3001 context, demo only)
 */

import type { SpaceEnvironmentPayload } from '../domain/spaceWeather.ts';
import { hash32, mulberry32 } from './rng.ts';
import type { CrewDef } from './catalog.ts';
import {
  WORLD_EPOCH_MS,
  missionDayAt,
  snapshotCrewAt,
  type CrewSnapshot,
} from './worldState.ts';

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

/** Career PEL 600 mSv (NASA-STD-3001 Vol 1 §4.8 via Vol 2 [V2 6095]). Crew totals here are SIMULATION. */
export const DOSE_LIMIT_MSV = 600;
/** ISS-like lumbar/hip BMD loss rate used in the transparent model: ~1.2% / 30 d without full loading. */
export const BONE_LOSS_PCT_PER_30D = 1.2;
export const ISS_SLEEP_MIN = 510; // 8.5 h

export type BodyDomainId =
  | 'brain'
  | 'eyes'
  | 'heart'
  | 'lungs'
  | 'bones'
  | 'muscles'
  | 'skin'
  | 'kidneys'
  | 'radiation'
  | 'sleep'
  | 'mind';

export type BodyRegionId =
  | 'brain'
  | 'eyes'
  | 'heart'
  | 'lungs'
  | 'spine'
  | 'hips'
  | 'quads'
  | 'calves'
  | 'back'
  | 'kidneys'
  | 'skin';

export const REGION_DOMAIN: Record<BodyRegionId, BodyDomainId> = {
  brain: 'brain',
  eyes: 'eyes',
  heart: 'heart',
  lungs: 'lungs',
  spine: 'bones',
  hips: 'bones',
  quads: 'muscles',
  calves: 'muscles',
  back: 'muscles',
  kidneys: 'kidneys',
  skin: 'skin',
};

export const FRONT_REGIONS: BodyRegionId[] = ['brain', 'eyes', 'heart', 'lungs', 'hips', 'quads', 'calves', 'skin'];
export const BACK_REGIONS: BodyRegionId[] = ['brain', 'back', 'spine', 'kidneys', 'hips', 'calves', 'skin'];

export type Rank = 0 | 1 | 2;

export interface DomainScore {
  id: BodyDomainId;
  score: number;
  rank: Rank;
  valueLabel: string;
}

export interface BodyHealth {
  t: number;
  snap: CrewSnapshot;
  domains: DomainScore[];
  regionRank: Record<BodyRegionId, Rank>;
  overallRank: Rank;
  overallScore: number;
  boneLossPct: number;
  sleepDebtMin: number;
  doseMsv: number;
  doseLimitMsv: number;
  sim: true;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function rankFromScore(score: number): Rank {
  if (score < 45) return 2;
  if (score < 70) return 1;
  return 0;
}

export function boneLossPctAt(crew: CrewDef, t: number): number {
  const days = Math.max(0, (t - WORLD_EPOCH_MS) / DAY_MS);
  const rng = mulberry32(hash32(crew.id, 'bone'));
  const personal = 0.85 + rng() * 0.3;
  const exerciseProtect = 0.22;
  return Number((days * (BONE_LOSS_PCT_PER_30D / 30) * personal * (1 - exerciseProtect)).toFixed(3));
}

function domainScores(snap: CrewSnapshot, t: number): DomainScore[] {
  const w = snap.wearable;
  const v = snap.vitals;
  const day = missionDayAt(t);
  const bone = boneLossPctAt(snap.def, t);
  const sleepDebt = Math.max(0, ISS_SLEEP_MIN - v.avgSleepMinutes);
  const fluidShift = clamp(8 + day * 0.15, 0, 40);

  const heartScore = clamp(100 - Math.max(0, w.hr - snap.def.baselineHr - 8) * 1.4 - Math.max(0, 25 - w.hrv) * 1.6, 8, 100);
  const lungScore = clamp(100 - Math.max(0, 97 - w.spo2) * 12 - (snap.event === 'event.co2' ? 28 : 0), 8, 100);
  const brainScore = clamp(100 - (snap.event === 'event.sleepDeficit' ? 22 : 0) - Math.max(0, 24 - w.hrv) * 1.2, 12, 100);
  const eyeScore = clamp(100 - fluidShift * 0.9 - (w.spo2 < 96 ? 8 : 0), 20, 100);
  const boneScore = clamp(100 - bone * 18, 15, 100);
  const muscleScore = clamp(
    100 - Math.max(0, 120 - v.avgExerciseMinutes) * 0.35 - (snap.event === 'event.evaFatigue' ? 20 : 0),
    12,
    100
  );
  const skinScore = clamp(100 - Math.max(0, w.skinTempC - 34.2) * 18 - (snap.activityKey === 'act.eva' ? 12 : 0), 20, 100);
  const kidneyScore = clamp(100 - bone * 6 - (v.avgExerciseMinutes > 190 ? 8 : 0) - day * 0.08, 25, 100);
  const radScore = clamp(100 - (w.doseMsv / DOSE_LIMIT_MSV) * 100, 5, 100);
  const sleepScore = clamp(100 - sleepDebt * 0.12 - (w.sleepStage !== 'wake' && snap.activityKey !== 'act.sleep' ? 0 : 0), 10, 100);
  const mindScore = clamp(
    100 -
      (snap.event === 'event.illness' || snap.event === 'event.sleepDeficit' ? 24 : 0) -
      sleepDebt * 0.08 -
      Math.max(0, 22 - w.hrv) * 1.1,
    10,
    100
  );

  const rows: Array<[BodyDomainId, number, string]> = [
    ['brain', brainScore, `HRV ${w.hrv} ms`],
    ['eyes', eyeScore, `SANS analog ${fluidShift.toFixed(0)}`],
    ['heart', heartScore, `${w.hr} bpm · ${w.bpSys}/${w.bpDia}`],
    ['lungs', lungScore, `SpO₂ ${w.spo2}% · RR ${w.respRate}`],
    ['bones', boneScore, `BMD −${bone.toFixed(2)}%`],
    ['muscles', muscleScore, `${v.avgExerciseMinutes} min`],
    ['skin', skinScore, `${w.skinTempC}°C`],
    ['kidneys', kidneyScore, `stone-risk analog`],
    ['radiation', radScore, `${w.doseMsv} / ${DOSE_LIMIT_MSV} mSv`],
    ['sleep', sleepScore, `debt ${sleepDebt} min`],
    ['mind', mindScore, snap.event ? snap.event : 'nominal'],
  ];
  return rows.map(([id, score, valueLabel]) => ({
    id,
    score: Math.round(score),
    rank: rankFromScore(score),
    valueLabel,
  }));
}

export function bodyHealthAt(crew: CrewDef, t: number, wx: SpaceEnvironmentPayload | null = null): BodyHealth {
  const snap = snapshotCrewAt(crew, t, wx);
  const domains = domainScores(snap, t);
  const byId = Object.fromEntries(domains.map((d) => [d.id, d])) as Record<BodyDomainId, DomainScore>;
  const regionRank = {} as Record<BodyRegionId, Rank>;
  for (const region of Object.keys(REGION_DOMAIN) as BodyRegionId[]) {
    regionRank[region] = byId[REGION_DOMAIN[region]].rank;
  }
  const overallScore = Math.round(domains.reduce((s, d) => s + d.score, 0) / domains.length);
  const overallRank = domains.reduce((r, d) => (d.rank > r ? d.rank : r), 0 as Rank);
  return {
    t,
    snap,
    domains,
    regionRank,
    overallRank,
    overallScore,
    boneLossPct: boneLossPctAt(crew, t),
    sleepDebtMin: Math.max(0, ISS_SLEEP_MIN - snap.vitals.avgSleepMinutes),
    doseMsv: snap.wearable.doseMsv,
    doseLimitMsv: DOSE_LIMIT_MSV,
    sim: true,
  };
}

export type TrendRange = '24h' | '7d' | 'mission';

export interface TrendPoint {
  t: number;
  label: string;
  hr: number;
  hrv: number;
  spo2: number;
  doseMsv: number;
  boneLossPct: number;
  sleepMin: number;
  predicted?: boolean;
  hrLo?: number;
  hrHi?: number;
  doseLo?: number;
  doseHi?: number;
  boneLo?: number;
  boneHi?: number;
}

function labelFor(t: number, range: TrendRange): string {
  const d = new Date(t + 8 * 3600 * 1000);
  if (range === '24h') {
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  }
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

function band(value: number, crewId: string, channel: string, rel = 0.06): { lo: number; hi: number } {
  const n = mulberry32(hash32(crewId, channel, Math.round(value * 10)))();
  const span = Math.max(0.4, Math.abs(value) * rel * (0.7 + n));
  return { lo: Number((value - span).toFixed(3)), hi: Number((value + span).toFixed(3)) };
}

export function trendSeries(
  crew: CrewDef,
  t: number,
  range: TrendRange,
  wx: SpaceEnvironmentPayload | null = null
): TrendPoint[] {
  const spanMs = range === '24h' ? DAY_MS : range === '7d' ? 7 * DAY_MS : Math.max(DAY_MS, t - WORLD_EPOCH_MS);
  const step = range === '24h' ? 30 * 60 * 1000 : DAY_MS;
  const start = Math.max(WORLD_EPOCH_MS, t - spanMs);
  const out: TrendPoint[] = [];
  for (let tt = start; tt <= t + 500; tt += step) {
    const snap = snapshotCrewAt(crew, tt, wx);
    out.push({
      t: tt,
      label: labelFor(tt, range),
      hr: snap.wearable.hr,
      hrv: snap.wearable.hrv,
      spo2: snap.wearable.spo2,
      doseMsv: snap.wearable.doseMsv,
      boneLossPct: boneLossPctAt(crew, tt),
      sleepMin: snap.vitals.avgSleepMinutes,
      predicted: false,
    });
  }
  return out;
}

export interface ForecastPoint extends TrendPoint {
  predicted: true;
}

/** Transparent linear/exponential forecast with a deterministic confidence band. */
export function forecastSeries(
  crew: CrewDef,
  t: number,
  horizonDays: 1 | 7,
  wx: SpaceEnvironmentPayload | null = null
): ForecastPoint[] {
  const now = snapshotCrewAt(crew, t, wx);
  const step = horizonDays === 1 ? HOUR_MS : DAY_MS;
  const end = t + horizonDays * DAY_MS;
  const rate = now.wearable.doseRateUSvH / 1000; // mSv/h
  const boneNow = boneLossPctAt(crew, t);
  const bonePerMs = BONE_LOSS_PCT_PER_30D / 30 / DAY_MS;
  const out: ForecastPoint[] = [];
  for (let tt = t + step; tt <= end + 500; tt += step) {
    const dtH = (tt - t) / HOUR_MS;
    const hrMean = now.def.baselineHr + (now.event === 'event.illness' ? 10 : 0);
    const hr = hrMean + Math.sin(dtH / 24 * Math.PI * 2) * 4;
    const dose = now.wearable.doseMsv + rate * dtH;
    const bone = boneNow + bonePerMs * (tt - t);
    const hrB = band(hr, crew.id, 'hrF');
    const doseB = band(dose, crew.id, 'doseF', 0.08);
    const boneB = band(bone, crew.id, 'boneF', 0.1);
    out.push({
      t: tt,
      label: labelFor(tt, horizonDays === 1 ? '24h' : '7d'),
      hr: Math.round(hr),
      hrv: now.wearable.hrv,
      spo2: now.wearable.spo2,
      doseMsv: Number(dose.toFixed(3)),
      boneLossPct: Number(bone.toFixed(3)),
      sleepMin: now.vitals.avgSleepMinutes,
      predicted: true,
      hrLo: hrB.lo,
      hrHi: hrB.hi,
      doseLo: doseB.lo,
      doseHi: doseB.hi,
      boneLo: boneB.lo,
      boneHi: boneB.hi,
    });
  }
  return out;
}

export function combinedTrend(
  crew: CrewDef,
  t: number,
  range: TrendRange,
  wx: SpaceEnvironmentPayload | null = null
): TrendPoint[] {
  const hist = trendSeries(crew, t, range, wx);
  const horizon: 1 | 7 = range === '24h' ? 1 : 7;
  return [...hist, ...forecastSeries(crew, t, horizon, wx)];
}
