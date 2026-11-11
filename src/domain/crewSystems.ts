/**
 * Simulated per-astronaut clinical systems panel.
 * Physiology is demonstration telemetry — never live NASA crew data.
 * Groupings follow NASA Human Research Program risk *categories* generically
 * (public HRP / Human Research Roadmap). No invented paper citations.
 */
import type { ClinicalStatus } from './healthThresholds.ts';
import { statusHrv, statusRestingHR, statusSpo2, THRESHOLDS } from './healthThresholds.ts';
import { sScaleElevated, type SpaceEnvironmentPayload } from './spaceWeather.ts';
import type { SelfCheckEntry } from './healthThresholds.ts';
import { boneLossPctAt, DOSE_LIMIT_MSV } from '../world/bodyHealth.ts';
import type { CrewDef } from '../world/catalog.ts';
import { hash32, mulberry32 } from '../world/rng.ts';
import { snapshotCrewAt, type CrewSnapshot, type ShipLive } from '../world/worldState.ts';
import { statusDoseRate } from './todayStatus.ts';

export const SYSTEM_IDS = [
  'cardio',
  'resp',
  'radiation',
  'msk',
  'sans',
  'sleep',
  'nutrition',
  'behavior',
  'medical',
] as const;

export type SystemId = (typeof SYSTEM_IDS)[number];

export type MetricSource = 'simulation' | 'noaa';

export interface SystemMetric {
  id: string;
  system: SystemId;
  labelKey: string;
  display: string;
  numericValue: number | null;
  unit: string;
  range: string;
  baseline: number | null;
  delta: number | null;
  status: ClinicalStatus;
  source: MetricSource;
  series: number[];
}

export interface DecisionPrompt {
  id: string;
  key: string;
  severity: ClinicalStatus;
}

export interface SystemGroup {
  id: SystemId;
  hrpKey: string;
  status: ClinicalStatus;
  metrics: SystemMetric[];
  prompts: DecisionPrompt[];
}

export interface CrewPanel {
  crewId: string;
  overall: ClinicalStatus;
  groups: SystemGroup[];
  flagged: SystemMetric[];
  prompts: DecisionPrompt[];
  maxDeviation: number;
  sim: true;
}

const RANK: Record<ClinicalStatus, number> = { Normal: 0, Attention: 1, Critical: 2 };

function worst(a: ClinicalStatus, b: ClinicalStatus): ClinicalStatus {
  return RANK[a] >= RANK[b] ? a : b;
}

function overallOf(statuses: ClinicalStatus[]): ClinicalStatus {
  return statuses.reduce((acc, s) => worst(acc, s), 'Normal' as ClinicalStatus);
}

function n1(n: number, d = 1): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function statusRange(v: number, lo: number, hi: number, critLo: number, critHi: number): ClinicalStatus {
  if (v < critLo || v > critHi) return 'Critical';
  if (v < lo || v > hi) return 'Attention';
  return 'Normal';
}

function statusHigh(v: number, attn: number, crit: number): ClinicalStatus {
  if (v >= crit) return 'Critical';
  if (v >= attn) return 'Attention';
  return 'Normal';
}

function statusLow(v: number, attn: number, crit: number): ClinicalStatus {
  if (v <= crit) return 'Critical';
  if (v <= attn) return 'Attention';
  return 'Normal';
}

function noise(crewId: string, ch: string, t: number): number {
  return mulberry32(hash32(crewId, ch, Math.floor(t / 60000)))();
}

function metric(partial: Omit<SystemMetric, 'series'> & { series?: number[] }): SystemMetric {
  return { ...partial, series: partial.series ?? [] };
}

function pctCo2ToMmHg(pct: number, kpa: number): number {
  return n1((pct / 100) * (kpa / 101.325) * 760, 2);
}

function pctO2ToMmHg(pct: number, kpa: number): number {
  return n1((pct / 100) * (kpa / 101.325) * 760, 1);
}

export function deviationScore(m: SystemMetric): number {
  if (m.numericValue == null || m.baseline == null) return RANK[m.status] * 10;
  const denom = Math.max(1, Math.abs(m.baseline));
  return RANK[m.status] * 10 + Math.abs(m.delta ?? 0) / denom;
}

function groupStatus(metrics: SystemMetric[]): ClinicalStatus {
  return overallOf(metrics.map((m) => m.status));
}

function promptsFor(groups: SystemGroup[], snap: CrewSnapshot, wx: SpaceEnvironmentPayload | null): DecisionPrompt[] {
  const byId = (id: string) => groups.flatMap((g) => g.metrics).find((m) => m.id === id);
  const out: DecisionPrompt[] = [];
  const cardio = groups.find((g) => g.id === 'cardio');
  const resp = groups.find((g) => g.id === 'resp');
  const sleep = groups.find((g) => g.id === 'sleep');
  const msk = groups.find((g) => g.id === 'msk');
  const sans = groups.find((g) => g.id === 'sans');
  const beh = groups.find((g) => g.id === 'behavior');
  const rad = groups.find((g) => g.id === 'radiation');
  const eva = snap.activityKey === 'act.eva';
  if (eva && (cardio?.status !== 'Normal' || rad?.status !== 'Normal' || sScaleElevated(wx?.scales.sScale))) {
    out.push({ id: 'postponeEva', key: 'panel.prompt.postponeEva', severity: 'Attention' });
  }
  if (resp && (byId('ppco2')?.status !== 'Normal' || snap.event === 'event.co2')) {
    out.push({ id: 'scrub', key: 'panel.prompt.scrubCo2', severity: resp.status === 'Critical' ? 'Critical' : 'Attention' });
  }
  if (sleep && sleep.status !== 'Normal') {
    out.push({ id: 'sleep', key: 'panel.prompt.protectSleep', severity: sleep.status });
  }
  if (msk && (byId('ared')?.status !== 'Normal' || byId('bone')?.status !== 'Normal')) {
    out.push({ id: 'ared', key: 'panel.prompt.ared', severity: 'Attention' });
  }
  if (sans && sans.status !== 'Normal') {
    out.push({ id: 'sans', key: 'panel.prompt.sansReport', severity: sans.status });
  }
  if (beh && beh.status !== 'Normal') {
    out.push({ id: 'bhp', key: 'panel.prompt.bhp', severity: beh.status });
  }
  if (cardio && byId('hr')?.status !== 'Normal') {
    out.push({ id: 'restHr', key: 'panel.prompt.restHr', severity: cardio.status });
  }
  if (byId('fluidOut') && (byId('fluidOut')?.status !== 'Normal' || byId('mass')?.status !== 'Normal')) {
    out.push({ id: 'hydrate', key: 'panel.prompt.hydrate', severity: 'Attention' });
  }
  return out;
}

export function crewPanelAt(
  crew: CrewDef,
  t: number,
  wx: SpaceEnvironmentPayload | null,
  ship: ShipLive | null,
  selfCheck?: SelfCheckEntry | null
): CrewPanel {
  const snap = snapshotCrewAt(crew, t, wx);
  const w = snap.wearable;
  const v = snap.vitals;
  const cabin = ship?.cabin;
  const rng = () => noise(crew.id, 'panel', t);
  const n = rng();

  const bpSysBase = 118 + (hash32(crew.id, 'sys') % 8);
  const bpDiaBase = 76 + (hash32(crew.id, 'dia') % 5);
  const gripBase = 38 + (hash32(crew.id, 'grip') % 10) + (crew.gender === 'Male' ? 8 : 0);
  const bone = boneLossPctAt(crew, t);
  const sleepH = n1(v.avgSleepMinutes / 60, 1);
  const sleepQ = selfCheck?.sleepQuality ?? Math.max(1, Math.min(5, Math.round(4 + (v.avgSleepMinutes - 430) / 40 - (snap.event === 'event.sleepDeficit' ? 2 : 0))));
  const ppCo2 = cabin ? pctCo2ToMmHg(cabin.carbonDioxidePercent, cabin.cabinPressureKpa) : n1(2.8 + n * 0.4, 2);
  const ppO2 = cabin ? pctO2ToMmHg(cabin.oxygenPercent, cabin.cabinPressureKpa) : n1(157 + n, 1);
  const temp = cabin?.cabinTempCelsius ?? 21.5;
  const humid = cabin?.humidityPercent ?? 45;
  const doseDay = ship?.radiationMsvDay ?? snap.radiationMsvDay;
  const careerPct = n1((w.doseMsv / DOSE_LIMIT_MSV) * 100, 3);
  const shelterOn = sScaleElevated(wx?.scales.sScale);
  const hrRest = snap.activityKey === 'act.exercise' || snap.activityKey === 'act.eva' ? crew.baselineHr + 6 : w.hr;
  const tachy = hrRest >= 100 && snap.activityKey !== 'act.exercise' && snap.activityKey !== 'act.eva';
  const pvc = hash32(crew.id, Math.floor(t / DAYISH), 'pvc') % 47 === 0;
  const ecgKey = tachy || snap.event === 'event.illness' ? 'tachy' : pvc ? 'pvc' : 'sinus';
  const ortho = snap.event === 'event.evaFatigue' || snap.event === 'event.sleepDeficit' || w.hr - crew.baselineHr > 22;
  const aredT = Math.round(v.avgExerciseMinutes * 0.42);
  const cevisT = Math.round(v.avgExerciseMinutes * 0.28);
  const t2T = Math.round(v.avgExerciseMinutes * 0.3);
  const aredTarget = 45;
  const cevisTarget = 30;
  const t2Target = 30;
  const grip = n1(gripBase * (1 - bone * 0.015) - (snap.event === 'event.evaFatigue' ? 3 : 0), 1);
  const fluidShift = Math.min(40, 8 + snap.def.age * 0.02 + (t > 0 ? 0.15 * Math.max(0, (t - Date.parse('2026-11-09T16:00:00.000Z')) / 86400000) : 0));
  const acuity = n1(-(fluidShift / 400) - (w.spo2 < 96 ? 0.02 : 0), 2);
  const headache = Math.max(0, Math.min(10, Math.round((fluidShift - 10) / 6 + (selfCheck?.pain === 'moderate' ? 3 : selfCheck?.pain === 'mild' ? 1 : 0) + (snap.event === 'event.co2' ? 2 : 0))));
  const fatigue = Math.max(0, Math.min(10, Math.round((510 - v.avgSleepMinutes) / 25 + (snap.event === 'event.sleepDeficit' ? 3 : 0) + (selfCheck?.mood === 'fatigued' ? 2 : 0))));
  const workload = snap.activityKey === 'act.eva' || snap.activityKey === 'act.exercise' ? 4 : snap.activityKey === 'act.sleep' ? 1 : 3;
  const pvt = Math.round(265 + (510 - v.avgSleepMinutes) * 0.35 + (snap.event === 'event.sleepDeficit' ? 40 : 0) + n * 12);
  const kcal = Math.round(2350 + (hash32(crew.id, 'kcal') % 180) - (snap.event === 'event.illness' ? 280 : 0));
  const fluidIn = n1(2.4 + n * 0.4 - (snap.event === 'event.illness' ? 0.4 : 0), 1);
  const fluidOut = n1(fluidIn - 0.15 + (n - 0.5) * 0.2, 1);
  const massDelta = n1(-0.04 * Math.max(1, (t - Date.parse('2026-11-09T16:00:00.000Z')) / 86400000) - (snap.event === 'event.illness' ? 0.3 : 0), 2);
  const mood = selfCheck?.mood === 'stressed' ? 2 : selfCheck?.mood === 'fatigued' ? 2 : selfCheck?.mood === 'normal' ? 4 : Math.max(1, 4 - (snap.event === 'event.sleepDeficit' || snap.event === 'event.illness' ? 1 : 0));
  const stress = Math.max(1, Math.min(5, 2 + (tachy ? 1 : 0) + (selfCheck?.mood === 'stressed' ? 2 : 0) + (snap.event === 'event.evaFatigue' ? 1 : 0)));
  const isolation = crew.shipId === 'ship-ares' ? 3 : crew.shipId === 'ship-mare' ? 2 : 1;
  const meds = snap.event === 'event.illness' ? 'ibuprofen 200 mg (sim)' : 'none';
  const symptoms =
    selfCheck?.symptoms?.trim() ||
    (snap.event === 'event.illness' ? 'fever analog, malaise' : snap.event === 'event.co2' ? 'headache, air hunger analog' : snap.event === 'event.sleepDeficit' ? 'fatigue' : 'none');

  const hrM = metric({
    id: 'hr',
    system: 'cardio',
    labelKey: 'panel.m.hr',
    display: String(w.hr),
    numericValue: w.hr,
    unit: 'bpm',
    range: THRESHOLDS.restingHR.normal,
    baseline: crew.baselineHr,
    delta: n1(w.hr - crew.baselineHr, 1),
    status: statusRestingHR(w.hr),
    source: 'simulation',
  });
  const sysM = metric({
    id: 'bpSys',
    system: 'cardio',
    labelKey: 'panel.m.bpSys',
    display: String(w.bpSys),
    numericValue: w.bpSys,
    unit: 'mmHg',
    range: '90–140',
    baseline: bpSysBase,
    delta: w.bpSys - bpSysBase,
    status: statusRange(w.bpSys, 90, 140, 80, 160),
    source: 'simulation',
  });
  const diaM = metric({
    id: 'bpDia',
    system: 'cardio',
    labelKey: 'panel.m.bpDia',
    display: String(w.bpDia),
    numericValue: w.bpDia,
    unit: 'mmHg',
    range: '60–90',
    baseline: bpDiaBase,
    delta: w.bpDia - bpDiaBase,
    status: statusRange(w.bpDia, 60, 90, 50, 100),
    source: 'simulation',
  });
  const ecgStatus: ClinicalStatus = ecgKey === 'sinus' ? 'Normal' : 'Attention';
  const ecgM = metric({
    id: 'ecg',
    system: 'cardio',
    labelKey: 'panel.m.ecg',
    display: ecgKey,
    numericValue: ecgKey === 'sinus' ? 0 : 1,
    unit: '',
    range: 'sinus',
    baseline: 0,
    delta: ecgKey === 'sinus' ? 0 : 1,
    status: ecgStatus,
    source: 'simulation',
  });
  const orthoM = metric({
    id: 'ortho',
    system: 'cardio',
    labelKey: 'panel.m.ortho',
    display: ortho ? '1' : '0',
    numericValue: ortho ? 1 : 0,
    unit: '',
    range: '0',
    baseline: 0,
    delta: ortho ? 1 : 0,
    status: ortho ? 'Attention' : 'Normal',
    source: 'simulation',
  });

  const rrM = metric({
    id: 'rr',
    system: 'resp',
    labelKey: 'panel.m.rr',
    display: String(w.respRate),
    numericValue: w.respRate,
    unit: '/min',
    range: '12–20',
    baseline: 15,
    delta: n1(w.respRate - 15, 1),
    status: statusRange(w.respRate, 12, 20, 8, 28),
    source: 'simulation',
  });
  const spoM = metric({
    id: 'spo2',
    system: 'resp',
    labelKey: 'panel.m.spo2',
    display: String(w.spo2),
    numericValue: w.spo2,
    unit: '%',
    range: THRESHOLDS.spo2.normal,
    baseline: crew.baselineSpo2,
    delta: n1(w.spo2 - crew.baselineSpo2, 1),
    status: statusSpo2(w.spo2),
    source: 'simulation',
  });
  const hrvM = metric({
    id: 'hrv',
    system: 'cardio',
    labelKey: 'panel.m.hrv',
    display: String(w.hrv),
    numericValue: w.hrv,
    unit: 'ms',
    range: THRESHOLDS.hrv.normal,
    baseline: crew.baselineHrv,
    delta: n1(w.hrv - crew.baselineHrv, 1),
    status: statusHrv(w.hrv),
    source: 'simulation',
  });
  const co2M = metric({
    id: 'ppco2',
    system: 'resp',
    labelKey: 'panel.m.ppco2',
    display: String(ppCo2),
    numericValue: ppCo2,
    unit: 'mmHg',
    range: '<4',
    baseline: 2.8,
    delta: n1(ppCo2 - 2.8, 2),
    status: statusHigh(ppCo2, 4, 6),
    source: 'simulation',
  });
  const o2M = metric({
    id: 'ppo2',
    system: 'resp',
    labelKey: 'panel.m.ppo2',
    display: String(ppO2),
    numericValue: ppO2,
    unit: 'mmHg',
    range: '150–170',
    baseline: 157,
    delta: n1(ppO2 - 157, 1),
    status: statusRange(ppO2, 150, 170, 140, 180),
    source: 'simulation',
  });
  const tempM = metric({
    id: 'cabinTemp',
    system: 'resp',
    labelKey: 'panel.m.cabinTemp',
    display: String(temp),
    numericValue: temp,
    unit: '°C',
    range: '18–27',
    baseline: 21.5,
    delta: n1(temp - 21.5, 1),
    status: statusRange(temp, 18, 27, 16, 30),
    source: 'simulation',
  });
  const humM = metric({
    id: 'humidity',
    system: 'resp',
    labelKey: 'panel.m.humidity',
    display: String(humid),
    numericValue: humid,
    unit: '%',
    range: '30–70',
    baseline: 45,
    delta: n1(humid - 45, 1),
    status: statusRange(humid, 30, 70, 20, 80),
    source: 'simulation',
  });

  const doseDayM = metric({
    id: 'doseDay',
    system: 'radiation',
    labelKey: 'panel.m.doseDay',
    display: doseDay.toFixed(3),
    numericValue: doseDay,
    unit: 'mSv/d',
    range: String(snap.radiationMsvDay),
    baseline: snap.def.shipId ? snap.radiationMsvDay : 0.42,
    delta: n1(doseDay - snap.radiationMsvDay, 3),
    status: statusDoseRate(doseDay, snap.radiationMsvDay || 0.42),
    source: 'simulation',
  });
  const cumM = metric({
    id: 'doseCum',
    system: 'radiation',
    labelKey: 'panel.m.doseCum',
    display: String(w.doseMsv),
    numericValue: w.doseMsv,
    unit: 'mSv',
    range: `≤${DOSE_LIMIT_MSV}`,
    baseline: 0,
    delta: w.doseMsv,
    status: statusHigh(w.doseMsv, DOSE_LIMIT_MSV * 0.3, DOSE_LIMIT_MSV * 0.7),
    source: 'simulation',
  });
  const careerM = metric({
    id: 'careerPct',
    system: 'radiation',
    labelKey: 'panel.m.careerPct',
    display: String(careerPct),
    numericValue: careerPct,
    unit: '%',
    range: '<30',
    baseline: 0,
    delta: careerPct,
    status: statusHigh(careerPct, 30, 70),
    source: 'simulation',
  });
  const speM = metric({
    id: 'speShelter',
    system: 'radiation',
    labelKey: 'panel.m.speShelter',
    display: shelterOn ? '1' : '0',
    numericValue: shelterOn ? 1 : 0,
    unit: '',
    range: '0',
    baseline: 0,
    delta: shelterOn ? 1 : 0,
    status: shelterOn ? 'Attention' : 'Normal',
    source: wx?.scales.sScale ? 'noaa' : 'simulation',
  });

  const radMetrics: SystemMetric[] = [doseDayM, cumM, careerM, speM];
  const goes = wx?.observations.goesXray;
  if (goes?.goesClass) {
    radMetrics.push(
      metric({
        id: 'goes',
        system: 'radiation',
        labelKey: 'panel.m.goes',
        display: goes.goesClass,
        numericValue: goes.flux ?? null,
        unit: '',
        range: 'A–X',
        baseline: null,
        delta: null,
        status: /^(M|X)/i.test(goes.goesClass) ? 'Attention' : 'Normal',
        source: 'noaa',
      })
    );
  }
  const kp = wx?.observations.kp;
  if (kp && Number.isFinite(kp.value)) {
    radMetrics.push(
      metric({
        id: 'kp',
        system: 'radiation',
        labelKey: 'panel.m.kp',
        display: String(kp.value),
        numericValue: kp.value,
        unit: '',
        range: '0–4',
        baseline: 2,
        delta: n1(kp.value - 2, 1),
        status: statusHigh(kp.value, 5, 7),
        source: 'noaa',
      })
    );
  }

  const boneM = metric({
    id: 'bone',
    system: 'msk',
    labelKey: 'panel.m.bone',
    display: String(bone),
    numericValue: bone,
    unit: '%',
    range: '<2',
    baseline: 0,
    delta: bone,
    status: statusHigh(bone, 2, 4),
    source: 'simulation',
  });
  const gripM = metric({
    id: 'grip',
    system: 'msk',
    labelKey: 'panel.m.grip',
    display: String(grip),
    numericValue: grip,
    unit: 'kg',
    range: `${Math.round(gripBase * 0.85)}–${gripBase}`,
    baseline: gripBase,
    delta: n1(grip - gripBase, 1),
    status: statusLow(grip, gripBase * 0.85, gripBase * 0.7),
    source: 'simulation',
  });
  const aredM = metric({
    id: 'ared',
    system: 'msk',
    labelKey: 'panel.m.ared',
    display: String(aredT),
    numericValue: aredT,
    unit: 'min',
    range: `${aredTarget}±10`,
    baseline: aredTarget,
    delta: aredT - aredTarget,
    status: statusRange(aredT, aredTarget - 15, aredTarget + 20, 15, 90),
    source: 'simulation',
  });
  const cevisM = metric({
    id: 'cevis',
    system: 'msk',
    labelKey: 'panel.m.cevis',
    display: String(cevisT),
    numericValue: cevisT,
    unit: 'min',
    range: `${cevisTarget}±10`,
    baseline: cevisTarget,
    delta: cevisT - cevisTarget,
    status: statusRange(cevisT, cevisTarget - 12, cevisTarget + 20, 8, 70),
    source: 'simulation',
  });
  const t2M = metric({
    id: 't2',
    system: 'msk',
    labelKey: 'panel.m.t2',
    display: String(t2T),
    numericValue: t2T,
    unit: 'min',
    range: `${t2Target}±10`,
    baseline: t2Target,
    delta: t2T - t2Target,
    status: statusRange(t2T, t2Target - 12, t2Target + 20, 8, 70),
    source: 'simulation',
  });

  const acuityM = metric({
    id: 'acuity',
    system: 'sans',
    labelKey: 'panel.m.acuity',
    display: String(acuity),
    numericValue: acuity,
    unit: 'logMAR',
    range: '≥ −0.05',
    baseline: 0,
    delta: acuity,
    status: statusLow(acuity, -0.05, -0.12),
    source: 'simulation',
  });
  const headM = metric({
    id: 'headache',
    system: 'sans',
    labelKey: 'panel.m.headache',
    display: String(headache),
    numericValue: headache,
    unit: '',
    range: '0–2',
    baseline: 0,
    delta: headache,
    status: statusHigh(headache, 3, 6),
    source: 'simulation',
  });

  const sleepHM = metric({
    id: 'sleepH',
    system: 'sleep',
    labelKey: 'panel.m.sleepH',
    display: String(sleepH),
    numericValue: sleepH,
    unit: 'h',
    range: '7–9',
    baseline: 7.5,
    delta: n1(sleepH - 7.5, 1),
    status: statusRange(sleepH, 7, 9, 5.5, 10),
    source: 'simulation',
  });
  const sleepQM = metric({
    id: 'sleepQ',
    system: 'sleep',
    labelKey: 'panel.m.sleepQ',
    display: String(sleepQ),
    numericValue: sleepQ,
    unit: '',
    range: '3–5',
    baseline: 4,
    delta: sleepQ - 4,
    status: statusLow(sleepQ, 2, 1),
    source: 'simulation',
  });
  const fatM = metric({
    id: 'fatigue',
    system: 'sleep',
    labelKey: 'panel.m.fatigue',
    display: String(fatigue),
    numericValue: fatigue,
    unit: '',
    range: '0–3',
    baseline: 2,
    delta: fatigue - 2,
    status: statusHigh(fatigue, 4, 7),
    source: 'simulation',
  });
  const workM = metric({
    id: 'workload',
    system: 'sleep',
    labelKey: 'panel.m.workload',
    display: String(workload),
    numericValue: workload,
    unit: '',
    range: '1–4',
    baseline: 3,
    delta: workload - 3,
    status: statusHigh(workload, 5, 6),
    source: 'simulation',
  });
  const pvtM = metric({
    id: 'pvt',
    system: 'sleep',
    labelKey: 'panel.m.pvt',
    display: String(pvt),
    numericValue: pvt,
    unit: 'ms',
    range: '250–320',
    baseline: 270,
    delta: pvt - 270,
    status: statusHigh(pvt, 340, 420),
    source: 'simulation',
  });

  const kcalM = metric({
    id: 'kcal',
    system: 'nutrition',
    labelKey: 'panel.m.kcal',
    display: String(kcal),
    numericValue: kcal,
    unit: 'kcal',
    range: '2200–2800',
    baseline: 2500,
    delta: kcal - 2500,
    status: statusRange(kcal, 2200, 2800, 1800, 3200),
    source: 'simulation',
  });
  const inM = metric({
    id: 'fluidIn',
    system: 'nutrition',
    labelKey: 'panel.m.fluidIn',
    display: String(fluidIn),
    numericValue: fluidIn,
    unit: 'L',
    range: '2.0–3.2',
    baseline: 2.5,
    delta: n1(fluidIn - 2.5, 1),
    status: statusRange(fluidIn, 2.0, 3.2, 1.4, 4),
    source: 'simulation',
  });
  const outM = metric({
    id: 'fluidOut',
    system: 'nutrition',
    labelKey: 'panel.m.fluidOut',
    display: String(fluidOut),
    numericValue: fluidOut,
    unit: 'L',
    range: '1.8–3.0',
    baseline: 2.4,
    delta: n1(fluidOut - 2.4, 1),
    status: statusRange(fluidOut, 1.8, 3.0, 1.2, 4),
    source: 'simulation',
  });
  const massM = metric({
    id: 'mass',
    system: 'nutrition',
    labelKey: 'panel.m.mass',
    display: String(massDelta),
    numericValue: massDelta,
    unit: 'kg',
    range: '−1.0–0.5',
    baseline: 0,
    delta: massDelta,
    status: statusRange(massDelta, -1, 0.5, -2.5, 1.5),
    source: 'simulation',
  });

  const moodM = metric({
    id: 'mood',
    system: 'behavior',
    labelKey: 'panel.m.mood',
    display: String(mood),
    numericValue: mood,
    unit: '',
    range: '3–5',
    baseline: 4,
    delta: mood - 4,
    status: statusLow(mood, 2, 1),
    source: 'simulation',
  });
  const stressM = metric({
    id: 'stress',
    system: 'behavior',
    labelKey: 'panel.m.stress',
    display: String(stress),
    numericValue: stress,
    unit: '',
    range: '1–3',
    baseline: 2,
    delta: stress - 2,
    status: statusHigh(stress, 4, 5),
    source: 'simulation',
  });
  const isoM = metric({
    id: 'isolation',
    system: 'behavior',
    labelKey: 'panel.m.isolation',
    display: String(isolation),
    numericValue: isolation,
    unit: '',
    range: '1–3',
    baseline: 1,
    delta: isolation - 1,
    status: statusHigh(isolation, 4, 5),
    source: 'simulation',
  });

  const medStatus: ClinicalStatus = meds === 'none' ? 'Normal' : 'Attention';
  const sxStatus: ClinicalStatus = symptoms === 'none' ? 'Normal' : snap.event === 'event.illness' ? 'Attention' : 'Attention';
  const medM = metric({
    id: 'meds',
    system: 'medical',
    labelKey: 'panel.m.meds',
    display: meds,
    numericValue: meds === 'none' ? 0 : 1,
    unit: '',
    range: 'none',
    baseline: 0,
    delta: meds === 'none' ? 0 : 1,
    status: medStatus,
    source: 'simulation',
  });
  const sxM = metric({
    id: 'symptoms',
    system: 'medical',
    labelKey: 'panel.m.symptoms',
    display: symptoms,
    numericValue: symptoms === 'none' ? 0 : 1,
    unit: '',
    range: 'none',
    baseline: 0,
    delta: symptoms === 'none' ? 0 : 1,
    status: sxStatus,
    source: 'simulation',
  });

  const groups: SystemGroup[] = [
    { id: 'cardio' as const, hrpKey: 'panel.hrp.cardio', status: 'Normal', metrics: [hrM, hrvM, sysM, diaM, ecgM, orthoM], prompts: [] },
    { id: 'resp' as const, hrpKey: 'panel.hrp.resp', status: 'Normal', metrics: [spoM, rrM, co2M, o2M, tempM, humM], prompts: [] },
    { id: 'radiation' as const, hrpKey: 'panel.hrp.radiation', status: 'Normal', metrics: radMetrics, prompts: [] },
    { id: 'msk' as const, hrpKey: 'panel.hrp.msk', status: 'Normal', metrics: [boneM, gripM, aredM, cevisM, t2M], prompts: [] },
    { id: 'sans' as const, hrpKey: 'panel.hrp.sans', status: 'Normal', metrics: [acuityM, headM], prompts: [] },
    { id: 'sleep' as const, hrpKey: 'panel.hrp.sleep', status: 'Normal', metrics: [sleepHM, sleepQM, fatM, workM, pvtM], prompts: [] },
    { id: 'nutrition' as const, hrpKey: 'panel.hrp.nutrition', status: 'Normal', metrics: [kcalM, inM, outM, massM], prompts: [] },
    { id: 'behavior' as const, hrpKey: 'panel.hrp.behavior', status: 'Normal', metrics: [moodM, stressM, isoM], prompts: [] },
    { id: 'medical' as const, hrpKey: 'panel.hrp.medical', status: 'Normal', metrics: [medM, sxM], prompts: [] },
  ].map((g) => ({ ...g, status: groupStatus(g.metrics) }));

  const allPrompts = promptsFor(groups, snap, wx);
  for (const g of groups) {
    g.prompts = allPrompts.filter((p) => {
      if (p.id === 'postponeEva' || p.id === 'restHr') return g.id === 'cardio' || g.id === 'radiation';
      if (p.id === 'scrub') return g.id === 'resp';
      if (p.id === 'sleep') return g.id === 'sleep';
      if (p.id === 'ared') return g.id === 'msk';
      if (p.id === 'sans') return g.id === 'sans';
      if (p.id === 'bhp') return g.id === 'behavior';
      if (p.id === 'hydrate') return g.id === 'nutrition';
      return false;
    });
  }

  const flagged = groups
    .flatMap((g) => g.metrics)
    .filter((m) => m.status !== 'Normal')
    .sort((a, b) => RANK[b.status] - RANK[a.status] || deviationScore(b) - deviationScore(a));
  const maxDeviation = groups.flatMap((g) => g.metrics).reduce((m, x) => Math.max(m, deviationScore(x)), 0);

  return {
    crewId: crew.id,
    overall: overallOf(groups.map((g) => g.status)),
    groups,
    flagged,
    prompts: allPrompts,
    maxDeviation,
    sim: true,
  };
}

const DAYISH = 86_400_000;

export interface RiskCell {
  system: SystemId;
  status: ClinicalStatus;
  deviation: number;
}

export interface RiskRow {
  crewId: string;
  name: string;
  shipId: string;
  overall: ClinicalStatus;
  maxDeviation: number;
  cells: RiskCell[];
  prompts: DecisionPrompt[];
}

export function buildRiskMatrix(
  crews: CrewDef[],
  t: number,
  wx: SpaceEnvironmentPayload | null,
  ships: ShipLive[]
): RiskRow[] {
  const rows = crews.map((crew) => {
    const ship = ships.find((s) => s.def.id === crew.shipId) ?? null;
    const panel = crewPanelAt(crew, t, wx, ship);
    return {
      crewId: crew.id,
      name: crew.name,
      shipId: crew.shipId,
      overall: panel.overall,
      maxDeviation: panel.maxDeviation,
      cells: panel.groups.map((g) => ({
        system: g.id,
        status: g.status,
        deviation: g.metrics.reduce((m, x) => Math.max(m, deviationScore(x)), 0),
      })),
      prompts: panel.prompts,
    };
  });
  return rows.sort((a, b) => b.maxDeviation - a.maxDeviation || RANK[b.overall] - RANK[a.overall] || a.name.localeCompare(b.name));
}

export function attachSeries(
  panel: CrewPanel,
  crew: CrewDef,
  t: number,
  wx: SpaceEnvironmentPayload | null,
  ship: ShipLive | null,
  all = false
): CrewPanel {
  const steps = 8;
  const ids = new Set((all ? panel.groups.flatMap((g) => g.metrics) : panel.flagged.slice(0, 8)).map((m) => m.id));
  const samples: CrewPanel[] = [];
  for (let i = steps - 1; i >= 0; i--) {
    samples.push(crewPanelAt(crew, t - i * 2 * 3600 * 1000, wx, ship));
  }
  const pick = (id: string): number[] =>
    samples.map((p) => {
      const m = p.groups.flatMap((g) => g.metrics).find((x) => x.id === id);
      return m?.numericValue ?? 0;
    });
  const groups: SystemGroup[] = panel.groups.map((g) => ({
    ...g,
    metrics: g.metrics.map((m) => (ids.has(m.id) && m.numericValue != null ? { ...m, series: pick(m.id) } : m)),
  }));
  return {
    ...panel,
    groups,
    flagged: panel.flagged.map((m) => groups.flatMap((g) => g.metrics).find((x) => x.id === m.id) ?? m),
  };
}

export function panelAction(panel: CrewPanel): 'askAura' | 'logSelfCheck' {
  return panel.flagged.length ? 'askAura' : 'logSelfCheck';
}
