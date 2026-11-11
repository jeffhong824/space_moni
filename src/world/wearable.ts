/**
 * Simulated wearable digital twin (Bio-Monitor / Astroskin + Actiwatch + personal dosimeter).
 * Pure function of t. Never treat as live ISS telemetry.
 */

import type { SpaceEnvironmentPayload } from '../domain/spaceWeather.ts';
import { scaleNumber } from '../domain/spaceWeather.ts';
import type { CrewDef, ShipDef } from './catalog.ts';
import { hash32, mulberry32 } from './rng.ts';
import type { ActivityKey, ScriptedEvent } from './worldState.ts';

const WORLD_EPOCH_MS = Date.parse('2026-11-09T16:00:00.000Z');
const DAY_MS = 86_400_000;

export type SleepStage = 'wake' | 'n1' | 'n2' | 'n3' | 'rem';

export interface WearableSample {
  t: number;
  hr: number;
  hrv: number;
  respRate: number;
  spo2: number;
  skinTempC: number;
  coreTempC: number;
  bpSys: number;
  bpDia: number;
  steps: number;
  activityG: number;
  sleepStage: SleepStage;
  doseMsv: number;
  doseRateUSvH: number;
  batteryPct: number;
  signalPct: number;
  sim: true;
}

export interface WearableContext {
  crew: CrewDef;
  ship: ShipDef;
  activity: ActivityKey;
  event: ScriptedEvent;
  cabinMsvDay: number;
  wx: SpaceEnvironmentPayload | null;
}

function lerpNoise(tMs: number, crewId: string, channel: string): number {
  const sec = Math.floor(tMs / 1000);
  const u = tMs / 1000 - sec;
  const a = mulberry32(hash32(crewId, channel, sec))();
  const b = mulberry32(hash32(crewId, channel, sec + 1))();
  return a * (1 - u) + b * u;
}

function wave(tSec: number, phase: number, period: number): number {
  return Math.sin((tSec / period) * 2 * Math.PI + phase);
}

function activityOffset(activity: ActivityKey): {
  hr: number;
  hrv: number;
  resp: number;
  spo2: number;
  core: number;
  skin: number;
  sys: number;
  g: number;
  evaDose: number;
} {
  switch (activity) {
    case 'act.sleep':
    case 'act.preSleep':
      return { hr: -12, hrv: 6, resp: -3, spo2: 0.3, core: -0.4, skin: -0.6, sys: -10, g: 0.05, evaDose: 1 };
    case 'act.wake':
    case 'act.personal':
      return { hr: -2, hrv: 2, resp: 0, spo2: 0.1, core: -0.1, skin: -0.1, sys: -2, g: 0.2, evaDose: 1 };
    case 'act.breakfast':
    case 'act.lunch':
    case 'act.dinner':
      return { hr: 6, hrv: -1, resp: 1, spo2: 0, core: 0.1, skin: 0.1, sys: 4, g: 0.35, evaDose: 1 };
    case 'act.exercise':
      return { hr: 48, hrv: -10, resp: 14, spo2: -1.4, core: 0.8, skin: 0.9, sys: 28, g: 1.6, evaDose: 1 };
    case 'act.eva':
      return { hr: 32, hrv: -8, resp: 8, spo2: -0.8, core: 0.6, skin: 1.1, sys: 18, g: 1.1, evaDose: 2.4 };
    case 'act.maintenance':
      return { hr: 8, hrv: -2, resp: 2, spo2: 0, core: 0.15, skin: 0.2, sys: 6, g: 0.55, evaDose: 1 };
    case 'act.science':
    case 'act.comms':
    default:
      return { hr: 4, hrv: 0, resp: 1, spo2: 0, core: 0.05, skin: 0.05, sys: 2, g: 0.3, evaDose: 1 };
  }
}

export function sleepStageAt(activity: ActivityKey, t: number, crewId: string): SleepStage {
  if (activity !== 'act.sleep' && activity !== 'act.preSleep') return 'wake';
  const hour = new Date(t + 8 * 3600 * 1000).getUTCHours() + new Date(t + 8 * 3600 * 1000).getUTCMinutes() / 60;
  const into = hour >= 21 ? hour - 21 : hour + 3;
  const cycle = (into * 60 + (hash32(crewId, 'rem') % 20)) % 90;
  if (activity === 'act.preSleep' || into < 0.4) return 'n1';
  if (cycle < 20) return 'n2';
  if (cycle < 50) return 'n3';
  if (cycle < 70) return 'n2';
  return 'rem';
}

function protonBoost(wx: SpaceEnvironmentPayload | null): number {
  const flux = wx?.observations.protons?.flux;
  if (flux == null || !(flux > 0)) return 0;
  return Math.min(0.45, Math.log10(1 + flux) * 0.07);
}

export function wearableAt(t: number, ctx: WearableContext): WearableSample {
  const { crew, ship, activity, event, cabinMsvDay, wx } = ctx;
  const off = activityOffset(activity);
  const tSec = t / 1000;
  const phase = (hash32(crew.id) % 1000) / 159.0;
  const nHr = lerpNoise(t, crew.id, 'hr');
  const nHrv = lerpNoise(t, crew.id, 'hrv');
  const nResp = lerpNoise(t, crew.id, 'resp');
  const nSpo = lerpNoise(t, crew.id, 'spo');

  let hr = crew.baselineHr + off.hr + wave(tSec, phase, 4.7) * 1.8 + (nHr - 0.5) * 2.4;
  let hrv = crew.baselineHrv + off.hrv + wave(tSec, phase + 1, 7.1) * 1.2 + (nHrv - 0.5) * 1.6;
  let resp = 15 + off.resp + wave(tSec, phase + 2, 5.5) * 0.6 + (nResp - 0.5) * 0.8;
  let spo2 = crew.baselineSpo2 + off.spo2 + (nSpo - 0.5) * 0.25;
  let core = 36.8 + off.core + (lerpNoise(t, crew.id, 'core') - 0.5) * 0.08;
  let skin = 33.4 + off.skin + (lerpNoise(t, crew.id, 'skin') - 0.5) * 0.2;
  let sys = 118 + off.sys + (lerpNoise(t, crew.id, 'sys') - 0.5) * 4;
  let dia = 76 + off.sys * 0.15 + (lerpNoise(t, crew.id, 'dia') - 0.5) * 2;

  if (event === 'event.illness') {
    hr += 22;
    hrv -= 10;
    resp += 3;
    spo2 -= 1.5;
    core += 0.9;
    skin += 0.5;
  }
  if (event === 'event.evaFatigue') {
    hr += 16;
    hrv -= 12;
    resp += 2;
    core += 0.3;
  }
  if (event === 'event.co2') {
    spo2 -= 2;
    hr += 6;
    resp += 4;
  }
  if (event === 'event.sleepDeficit') {
    hr += 8;
    hrv -= 8;
    core += 0.15;
  }

  const elapsedDays = Math.max(0, (t - WORLD_EPOCH_MS) / DAY_MS);
  const sN = wx?.scales.sScale ? scaleNumber(wx.scales.sScale, 'S') ?? 0 : 0;
  const rateMsvDay = (cabinMsvDay + sN * 0.04 * (1 - ship.shielding) + protonBoost(wx)) * off.evaDose;
  const doseMsv = elapsedDays * rateMsvDay;
  const doseRateUSvH = (rateMsvDay / 24) * 1000;

  const hour = new Date(t + 8 * 3600 * 1000).getUTCHours() + new Date(t + 8 * 3600 * 1000).getUTCMinutes() / 60;
  const stepsPerH =
    activity === 'act.exercise' ? 420 : activity === 'act.eva' ? 280 : activity === 'act.sleep' ? 4 : 90;
  const steps = Math.round(Math.min(hour, 24) * stepsPerH * (0.85 + lerpNoise(t, crew.id, 'steps') * 0.3));

  let battery = 97 - hour * 1.6 + (activity === 'act.sleep' ? 8 : 0);
  battery = Math.max(18, Math.min(100, battery + (lerpNoise(t, crew.id, 'bat') - 0.5) * 2));
  let signal = ship.kind === 'leo-station' ? 96 : ship.kind === 'lunar-south-pole' ? 82 : ship.kind === 'mars-transit' ? 54 : 88;
  if (activity === 'act.eva') signal -= 14;
  signal = Math.max(12, Math.min(99, signal + (lerpNoise(t, crew.id, 'sig') - 0.5) * 4));

  return {
    t,
    hr: Math.round(Math.max(42, Math.min(185, hr))),
    hrv: Math.round(Math.max(8, Math.min(80, hrv))),
    respRate: Math.round(Math.max(8, Math.min(42, resp)) * 10) / 10,
    spo2: Math.round(Math.max(88, Math.min(100, spo2)) * 10) / 10,
    skinTempC: Math.round(skin * 10) / 10,
    coreTempC: Math.round(core * 10) / 10,
    bpSys: Math.round(Math.max(90, Math.min(175, sys))),
    bpDia: Math.round(Math.max(55, Math.min(105, dia))),
    steps,
    activityG: Math.round((off.g + (lerpNoise(t, crew.id, 'g') - 0.5) * 0.1) * 100) / 100,
    sleepStage: sleepStageAt(activity, t, crew.id),
    doseMsv: Number(doseMsv.toFixed(3)),
    doseRateUSvH: Number(doseRateUSvH.toFixed(2)),
    batteryPct: Math.round(battery),
    signalPct: Math.round(signal),
    sim: true,
  };
}

export function wearableSparkline(t: number, ctx: WearableContext, seconds = 30): number[] {
  const out: number[] = [];
  for (let i = seconds - 1; i >= 0; i--) out.push(wearableAt(t - i * 1000, ctx).hr);
  return out;
}

/** Rank from wearable + events. Normal ARED/exercise HR is not Caution. */
export function wearableRank(sample: WearableSample, activity: ActivityKey, event: ScriptedEvent): 0 | 1 | 2 {
  if (sample.spo2 < 94 || sample.coreTempC >= 39 || sample.hr >= 165) return 2;
  if (event === 'event.illness' || event === 'event.co2') return sample.spo2 < 95 ? 2 : 1;
  if (event === 'event.evaFatigue' || event === 'event.sleepDeficit') return 1;
  if (activity === 'act.eva' && sample.hr >= 110) return 1;
  if (sample.spo2 < 95 || sample.coreTempC >= 38.4) return 1;
  return 0;
}
