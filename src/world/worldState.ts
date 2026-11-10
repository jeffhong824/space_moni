/**
 * Shared deterministic mission world.
 * Epoch: 2026-11-10 00:00 Asia/Taipei (UTC+8) = 2026-11-09T16:00:00Z.
 * worldStateAt(t) is a pure function of wall-clock t (+ optional official weather).
 * Every visitor sees the same live state; it advances with real time.
 */

import type { DailyHealthRecord, EnvironmentalMetrics, HourlyVitalPoint, StationTask } from '../types.ts';
import { hourlyAbnormal, statusRestingHR, statusHrv, statusSpo2 } from '../domain/healthThresholds.ts';
import { scaleNumber, type SpaceEnvironmentPayload } from '../domain/spaceWeather.ts';
import { CREW, SHIPS, type CrewDef, type ShipDef } from './catalog.ts';
import { hash32, mulberry32, randInt, randRange } from './rng.ts';
import { wearableAt, wearableRank, type WearableSample } from './wearable.ts';

export const WORLD_EPOCH_MS = Date.parse('2026-11-09T16:00:00.000Z');
export const TAIPEI_OFFSET_MS = 8 * 3600 * 1000;
const DAY_MS = 86_400_000;
const C_KM_S = 299_792.458;
const AU_KM = 149_597_870.7;

export type ActivityKey =
  | 'act.sleep'
  | 'act.wake'
  | 'act.breakfast'
  | 'act.science'
  | 'act.maintenance'
  | 'act.lunch'
  | 'act.exercise'
  | 'act.eva'
  | 'act.comms'
  | 'act.dinner'
  | 'act.personal'
  | 'act.preSleep';

export type ScriptedEvent = 'event.illness' | 'event.co2' | 'event.evaFatigue' | 'event.sleepDeficit' | null;

export interface CrewLive {
  def: CrewDef;
  activityKey: ActivityKey;
  prevActivityKey: ActivityKey;
  activityStartedAt: number;
  nextActivityKey: ActivityKey;
  nextActivityAt: number;
  vitals: {
    restingHR: number;
    hrv: number;
    spo2: number;
    vo2Max: number;
    avgSleepMinutes: number;
    avgExerciseMinutes: number;
  };
  wearable: WearableSample;
  event: ScriptedEvent;
}

export interface ShipLive {
  def: ShipDef;
  location: { phaseDeg: number; auFromEarth: number; sunElevDeg: number; lat: number; lon: number };
  commLatencySec: number;
  cabin: EnvironmentalMetrics;
  radiationMsvDay: number;
  sScaleUsed: string | null;
  crew: CrewLive[];
  nextEventKey: ActivityKey;
  nextEventAt: number;
}

export interface WorldState {
  t: number;
  missionDay: number;
  taipeiIsoDate: string;
  ships: ShipLive[];
}

export function missionDayAt(t: number): number {
  return Math.floor(Math.max(0, t - WORLD_EPOCH_MS) / DAY_MS);
}

export function taipeiDateString(t: number): string {
  const d = new Date(t + TAIPEI_OFFSET_MS);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

export function taipeiHour(t: number): number {
  return new Date(t + TAIPEI_OFFSET_MS).getUTCHours() + new Date(t + TAIPEI_OFFSET_MS).getUTCMinutes() / 60;
}

export function activityAtHour(hour: number, shipKind: ShipDef['kind'], day: number, crewId: string): ActivityKey {
  const slot = Math.floor(hour) % 24;
  const evaDay = hash32(shipKind, day, 'eva') % 7 === 2;
  const evaCrew = hash32(crewId, day, 'evaSlot') % 4 < 2;
  if (slot < 6) return 'act.sleep';
  if (slot < 7) return 'act.wake';
  if (slot < 8) return 'act.breakfast';
  if (slot < 12) return hash32(crewId, day, slot) % 2 === 0 ? 'act.science' : 'act.maintenance';
  if (slot < 13) return 'act.lunch';
  if (slot < 15) return 'act.exercise';
  if (slot < 17) {
    if (
      evaDay &&
      evaCrew &&
      (shipKind === 'leo-station' || shipKind === 'lunar-habitat' || shipKind === 'lunar-gateway')
    ) {
      return 'act.eva';
    }
    return 'act.science';
  }
  if (slot < 18) return 'act.comms';
  if (slot < 19) return 'act.dinner';
  if (slot < 21) return 'act.personal';
  if (slot < 22) return 'act.preSleep';
  return 'act.sleep';
}

function nextBoundary(t: number): number {
  const hour = taipeiHour(t);
  const frac = hour % 1;
  const msToNextHour = (1 - frac) * 3600 * 1000;
  return t + msToNextHour;
}

function scriptedEvent(shipId: string, crewId: string, day: number): ScriptedEvent {
  if (crewId === 'astro-alice' && day % 11 === 3) return 'event.illness';
  if (shipId === 'ship-harmony' && day % 17 === 5) return 'event.co2';
  if (crewId === 'astro-samira' && day % 9 === 2) return 'event.evaFatigue';
  if (crewId === 'astro-ines' && day % 13 === 4) return 'event.illness';
  if (crewId === 'astro-diego' && day % 7 === 1) return 'event.sleepDeficit';
  return null;
}

function shipLocation(ship: ShipDef, t: number): ShipLive['location'] {
  const elapsed = Math.max(0, t - WORLD_EPOCH_MS);
  if (ship.kind === 'leo-station') {
    const period = 92.68 * 60 * 1000;
    const phase = ((elapsed % period) / period) * 360;
    return { phaseDeg: phase, auFromEarth: 0.0000028, sunElevDeg: 0, lat: 0, lon: 0 };
  }
  if (ship.kind === 'lunar-gateway') {
    const period = 6.5 * 3600 * 1000;
    const phase = ((elapsed % period) / period) * 360;
    return { phaseDeg: phase, auFromEarth: 0.00257, sunElevDeg: 0, lat: 0, lon: 0 };
  }
  if (ship.kind === 'mars-transit') {
    const day = missionDayAt(t);
    const au = 1.05 + 0.55 * (0.5 + 0.5 * Math.sin((day / 90) * Math.PI));
    const phase = ((elapsed / (24 * 3600 * 1000)) * 13.2) % 360;
    return { phaseDeg: phase, auFromEarth: au, sunElevDeg: 0, lat: 0, lon: 0 };
  }
  const lunarDay = 29.53 * DAY_MS;
  const sun = Math.sin((2 * Math.PI * (elapsed % lunarDay)) / lunarDay) * 90;
  return { phaseDeg: 0, auFromEarth: 0.00257, sunElevDeg: sun, lat: 18.5, lon: 23.2 };
}

function latencySec(loc: ShipLive['location'], kind: ShipDef['kind']): number {
  if (kind === 'leo-station') return 0;
  const seconds = (loc.auFromEarth * AU_KM) / C_KM_S;
  return Math.max(kind === 'mars-transit' ? 180 : 1.28, seconds);
}

function modeledRadiation(ship: ShipDef, wx: SpaceEnvironmentPayload | null): { msv: number; sScale: string | null } {
  const sCode = wx?.scales.sScale ?? null;
  const sN = sCode ? scaleNumber(sCode, 'S') : null;
  const extra = sN != null ? sN * 0.09 * (1 - ship.shielding) : 0;
  return { msv: ship.baselineMsvDay + extra, sScale: sCode };
}

function cabinFor(ship: ShipDef, day: number, event: ScriptedEvent, radiation: number): EnvironmentalMetrics {
  const rng = mulberry32(hash32(ship.id, day, 'cabin'));
  let co2 = randRange(rng, 0.32, 0.40);
  if (event === 'event.co2') co2 = 0.56;
  return {
    oxygenPercent: randRange(rng, 20.6, 21.2),
    carbonDioxidePercent: Number(co2.toFixed(2)),
    cabinPressureKpa: Number(randRange(rng, 100.8, 101.6).toFixed(1)),
    cabinTempCelsius: Number(randRange(rng, 20.8, 22.4).toFixed(1)),
    ambientRadiationMsvDay: Number(radiation.toFixed(3)),
    humidityPercent: Number(randRange(rng, 42, 48).toFixed(1)),
    airScrubberState: event === 'event.co2' ? 'Scrubbing' : 'Active Regeneration',
  };
}

function vitalsFor(crew: CrewDef, t: number, event: ScriptedEvent): CrewLive['vitals'] {
  const day = missionDayAt(t);
  const rng = mulberry32(hash32(crew.id, day, 'vitals'));
  let hr = crew.baselineHr + randRange(rng, -3, 4);
  let hrv = crew.baselineHrv + randRange(rng, -2, 3);
  let spo2 = crew.baselineSpo2 + randRange(rng, -0.4, 0.4);
  let sleep = 430 + randInt(rng, -20, 25);
  let exercise = 140 + randInt(rng, -15, 30);
  if (event === 'event.illness') {
    hr += 22;
    hrv -= 10;
    sleep = 305;
    spo2 -= 1.5;
  }
  if (event === 'event.evaFatigue') {
    hr += 8;
    hrv -= 8;
    exercise = 195;
  }
  if (event === 'event.co2') {
    spo2 -= 2;
    hr += 6;
  }
  if (event === 'event.sleepDeficit') {
    sleep = 340;
    hrv -= 6;
    hr += 6;
  }
  return {
    restingHR: Math.round(hr),
    hrv: Math.round(hrv),
    spo2: Math.round(spo2 * 10) / 10,
    vo2Max: Number((crew.baselineVo2 + randRange(rng, -0.3, 0.3)).toFixed(1)),
    avgSleepMinutes: sleep,
    avgExerciseMinutes: exercise,
  };
}

function hourlyTimeline(crew: CrewDef, t: number, event: ScriptedEvent): HourlyVitalPoint[] {
  const dayStart = WORLD_EPOCH_MS + missionDayAt(t) * DAY_MS;
  const points: HourlyVitalPoint[] = [];
  for (let h = 0; h < 24; h += 2) {
    const tt = dayStart + h * 3600 * 1000;
    const ship = SHIPS.find((s) => s.id === crew.shipId)!;
    const act = activityAtHour(h, ship.kind, missionDayAt(t), crew.id);
    const v = vitalsFor(crew, tt, event);
    const liveHr =
      act === 'act.exercise' ? v.restingHR + 48 : act === 'act.eva' ? v.restingHR + 32 : act === 'act.sleep' ? v.restingHR - 12 : v.restingHR;
    const pt: HourlyVitalPoint = {
      hour: `${String(h).padStart(2, '0')}:00`,
      hr: liveHr,
      spo2: Math.round(v.spo2),
      hrv: v.hrv,
      activityNote: act,
    };
    pt.isAbnormal = hourlyAbnormal(pt);
    points.push(pt);
  }
  return points;
}

export function recordForCrew(crew: CrewDef, t: number, live: CrewLive): DailyHealthRecord {
  const date = taipeiDateString(t);
  const hrStatus = statusRestingHR(live.vitals.restingHR);
  return {
    date,
    isToday: true,
    restingHR: live.vitals.restingHR,
    restingHRStatus: hrStatus === 'Critical' ? 'Critical' : hrStatus === 'Attention' ? 'Elevated' : 'Normal',
    hrv: live.vitals.hrv,
    vo2Max: live.vitals.vo2Max,
    spo2: live.vitals.spo2,
    avgSleepMinutes: live.vitals.avgSleepMinutes,
    avgExerciseMinutes: live.vitals.avgExerciseMinutes,
    mentalStatus: live.event === 'event.illness' ? 'Fatigued' : 'Normal',
    musculoskeletalStatus: live.event === 'event.evaFatigue' ? 'Mild Strain' : 'Normal',
    nutritionStatus: 'Normal',
    clinicalObservations: live.event || undefined,
    dailyActivities: [
      { id: `${crew.id}-cm-1`, title: 'act.exercise', completed: live.activityKey !== 'act.exercise', timeSlot: '13:00-15:00', category: 'Health Countermeasure' },
      { id: `${crew.id}-cm-2`, title: 'act.science', completed: false, timeSlot: '08:00-12:00', category: 'Research' },
    ],
    hourlyTimeline: hourlyTimeline(crew, t, live.event),
  };
}

export function historyRecords(crew: CrewDef, t: number, wx: SpaceEnvironmentPayload | null, days = 3): DailyHealthRecord[] {
  const out: DailyHealthRecord[] = [];
  for (let i = 0; i < days; i++) {
    const tt = t - i * DAY_MS;
    const world = worldStateAt(tt, wx);
    const ship = world.ships.find((s) => s.def.id === crew.shipId);
    const live = ship?.crew.find((c) => c.def.id === crew.id);
    if (!live) continue;
    const rec = recordForCrew(crew, tt, live);
    rec.isToday = i === 0;
    rec.date = taipeiDateString(tt);
    out.push(rec);
  }
  return out;
}

export function tasksForShip(ship: ShipLive, t: number): StationTask[] {
  const day = missionDayAt(t);
  const commander = ship.crew.find((c) => c.def.roleOnShip === 'commander');
  const eva = ship.crew.find((c) => c.activityKey === 'act.eva') || ship.crew[0];
  return [
    {
      id: `${ship.def.id}-eva-${day}`,
      title: 'act.eva',
      module: 'mod.exterior',
      priority: 'High',
      status: ship.crew.some((c) => c.activityKey === 'act.eva') ? 'In Progress' : 'Scheduled',
      progress: ship.crew.some((c) => c.activityKey === 'act.eva') ? 40 : 10,
      assignedCrew: [{ name: eva.def.name, role: eva.def.occupationKey, avatarBg: 'bg-slate-700' }],
      deadline: new Date(ship.nextEventAt).toISOString(),
      description: 'act.eva',
    },
    {
      id: `${ship.def.id}-ex-${day}`,
      title: 'act.exercise',
      module: 'mod.tranquility',
      priority: 'Medium',
      status: ship.crew.some((c) => c.activityKey === 'act.exercise') ? 'In Progress' : 'Scheduled',
      progress: 25,
      assignedCrew: [{ name: commander?.def.name || ship.crew[0].def.name, role: 'occ.commander', avatarBg: 'bg-cyan-600' }],
      deadline: new Date(t + 4 * 3600 * 1000).toISOString(),
      description: 'act.exercise',
    },
  ];
}

export function worldStateAt(t: number, wx: SpaceEnvironmentPayload | null = null): WorldState {
  const day = missionDayAt(t);
  const hour = taipeiHour(t);
  const ships: ShipLive[] = SHIPS.map((def) => {
    const loc = shipLocation(def, t);
    const rad = modeledRadiation(def, wx);
    const crew: CrewLive[] = CREW.filter((c) => c.shipId === def.id).map((cDef) => {
      const event = scriptedEvent(def.id, cDef.id, day);
      const activityKey = activityAtHour(hour, def.kind, day, cDef.id);
      const nextAt = nextBoundary(t);
      const startedAt = nextAt - 3600 * 1000;
      const prevHour = taipeiHour(startedAt - 1000);
      const nextHour = taipeiHour(nextAt + 1000);
      const wearable = wearableAt(t, {
        crew: cDef,
        ship: def,
        activity: activityKey,
        event,
        cabinMsvDay: rad.msv,
        wx,
      });
      return {
        def: cDef,
        activityKey,
        prevActivityKey: activityAtHour(prevHour, def.kind, missionDayAt(startedAt - 1000), cDef.id),
        activityStartedAt: startedAt,
        nextActivityKey: activityAtHour(nextHour, def.kind, missionDayAt(nextAt), cDef.id),
        nextActivityAt: nextAt,
        vitals: vitalsFor(cDef, t, event),
        wearable,
        event,
      };
    });
    const shipEvent = crew.find((c) => c.event)?.event ?? null;
    const nextCrew = crew.reduce((a, b) => (a.nextActivityAt < b.nextActivityAt ? a : b));
    return {
      def,
      location: loc,
      commLatencySec: latencySec(loc, def.kind),
      cabin: cabinFor(def, day, shipEvent, rad.msv),
      radiationMsvDay: rad.msv,
      sScaleUsed: rad.sScale,
      crew,
      nextEventKey: nextCrew.nextActivityKey,
      nextEventAt: nextCrew.nextActivityAt,
    };
  });
  return {
    t,
    missionDay: day,
    taipeiIsoDate: taipeiDateString(t),
    ships,
  };
}

export interface CrewSnapshot {
  def: CrewDef;
  ship: ShipDef;
  activityKey: ActivityKey;
  event: ScriptedEvent;
  vitals: CrewLive['vitals'];
  wearable: WearableSample;
  radiationMsvDay: number;
}

/** One crew member at t — cheaper than worldStateAt when sampling trends. */
export function snapshotCrewAt(crew: CrewDef, t: number, wx: SpaceEnvironmentPayload | null = null): CrewSnapshot {
  const ship = SHIPS.find((s) => s.id === crew.shipId)!;
  const day = missionDayAt(t);
  const hour = taipeiHour(t);
  const event = scriptedEvent(ship.id, crew.id, day);
  const activityKey = activityAtHour(hour, ship.kind, day, crew.id);
  const rad = modeledRadiation(ship, wx);
  return {
    def: crew,
    ship,
    activityKey,
    event,
    vitals: vitalsFor(crew, t, event),
    wearable: wearableAt(t, {
      crew,
      ship,
      activity: activityKey,
      event,
      cabinMsvDay: rad.msv,
      wx,
    }),
    radiationMsvDay: rad.msv,
  };
}

export interface ScheduleBlock {
  startHour: number;
  endHour: number;
  activityKey: ActivityKey;
  done: boolean;
  current: boolean;
  upcoming: boolean;
}

export function daySchedule(crew: CrewDef, t: number): ScheduleBlock[] {
  const ship = SHIPS.find((s) => s.id === crew.shipId)!;
  const day = missionDayAt(t);
  const hourNow = taipeiHour(t);
  const blocks: ScheduleBlock[] = [];
  let start = 0;
  let cur = activityAtHour(0, ship.kind, day, crew.id);
  for (let h = 1; h <= 24; h++) {
    const next = h === 24 ? null : activityAtHour(h, ship.kind, day, crew.id);
    if (next !== cur) {
      blocks.push({
        startHour: start,
        endHour: h,
        activityKey: cur,
        done: h <= hourNow,
        current: hourNow >= start && hourNow < h,
        upcoming: start > hourNow,
      });
      start = h;
      if (next) cur = next;
    }
  }
  return blocks;
}

export type ExerciseDevice = 't2' | 'cevis' | 'ared';

export function exerciseLog(_crew: CrewDef, t: number): { device: ExerciseDevice; startHour: number; endHour: number; done: boolean; current: boolean }[] {
  const hourNow = taipeiHour(t);
  const blocks: { device: ExerciseDevice; startHour: number; endHour: number }[] = [
    { device: 't2', startHour: 13, endHour: 13.7 },
    { device: 'cevis', startHour: 13.7, endHour: 14.3 },
    { device: 'ared', startHour: 14.3, endHour: 15 },
  ];
  return blocks.map((b) => ({
    ...b,
    done: b.endHour <= hourNow,
    current: hourNow >= b.startHour && hourNow < b.endHour,
  }));
}

export function findCrewLive(world: WorldState, crewId: string): { ship: ShipLive; crew: CrewLive } | null {
  for (const ship of world.ships) {
    const crew = ship.crew.find((c) => c.def.id === crewId);
    if (crew) return { ship, crew };
  }
  return null;
}

export function overallRankFromVitals(v: CrewLive['vitals']): 0 | 1 | 2 {
  const hr = statusRestingHR(v.restingHR);
  const hrv = statusHrv(v.hrv);
  const spo2 = statusSpo2(v.spo2);
  if (hr === 'Critical' || hrv === 'Critical' || spo2 === 'Critical') return 2;
  if (hr === 'Attention' || hrv === 'Attention' || spo2 === 'Attention') return 1;
  return 0;
}

export function overallRank(crew: CrewLive): 0 | 1 | 2 {
  const fromWear = wearableRank(crew.wearable, crew.activityKey, crew.event);
  const fromRest = overallRankFromVitals(crew.vitals);
  return fromWear > fromRest ? fromWear : fromRest;
}
