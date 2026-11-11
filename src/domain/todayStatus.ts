import type { ClinicalStatus } from './healthThresholds.ts';
import { BAND_NUMBERS, statusHrv, statusRestingHR, statusSpo2, THRESHOLDS } from './healthThresholds.ts';

export type VitalId = 'hr' | 'hrv' | 'spo2' | 'dose';
export type VitalFlag = 'elevated' | 'low';

export interface VitalTileModel {
  id: VitalId;
  labelKey: string;
  value: number;
  unit: string;
  status: ClinicalStatus;
  range: string;
  baseline: number;
  delta: number;
  flag: VitalFlag | null;
  series: number[];
}

export interface ScheduleItemModel {
  id: string;
  title: string;
  startMin: number;
  timeLabel: string;
  self?: boolean;
  activityId?: string;
}

const RANK: Record<ClinicalStatus, number> = { Normal: 0, Attention: 1, Critical: 2 };

export function statusDoseRate(msvDay: number, baseline: number): ClinicalStatus {
  if (baseline <= 0) return 'Normal';
  if (msvDay > baseline * 1.8) return 'Critical';
  if (msvDay > baseline * 1.35) return 'Attention';
  return 'Normal';
}

export function parseSlotStartMin(slot: string | undefined): number | null {
  if (!slot) return null;
  const m = slot.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function minutesInTaipei(t: number): number {
  const d = new Date(t + 8 * 3600 * 1000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

export function nextScheduleIndex(items: ScheduleItemModel[], nowMin: number): number {
  if (items.length === 0) return -1;
  const upcoming = items.findIndex((it) => it.startMin >= nowMin - 15);
  return upcoming === -1 ? 0 : upcoming;
}

export function minutesUntil(startMin: number, nowMin: number): number {
  let d = startMin - nowMin;
  if (d < -12 * 60) d += 24 * 60;
  return d;
}

export function vitalFlag(value: number, baseline: number, status: ClinicalStatus): VitalFlag | null {
  if (status === 'Normal') return null;
  return value < baseline ? 'low' : 'elevated';
}

export function sortVitals(tiles: VitalTileModel[]): VitalTileModel[] {
  return [...tiles].sort((a, b) => RANK[b.status] - RANK[a.status] || a.id.localeCompare(b.id));
}

export function buildVitalTiles(input: {
  hr: number;
  hrv: number;
  spo2: number;
  dose: number;
  baselineHr: number;
  baselineHrv: number;
  baselineSpo2: number;
  baselineDose: number;
  hrSeries: number[];
  hrvSeries: number[];
  spo2Series: number[];
  doseSeries: number[];
}): VitalTileModel[] {
  const hrSt = statusRestingHR(input.hr);
  const hrvSt = statusHrv(input.hrv);
  const spo2St = statusSpo2(input.spo2);
  const doseSt = statusDoseRate(input.dose, input.baselineDose);
  const tiles: VitalTileModel[] = [
    {
      id: 'hr',
      labelKey: 'wear.hr',
      value: input.hr,
      unit: 'bpm',
      status: hrSt,
      range: THRESHOLDS.restingHR.normal,
      baseline: input.baselineHr,
      delta: Number((input.hr - input.baselineHr).toFixed(1)),
      flag: vitalFlag(input.hr, input.baselineHr, hrSt),
      series: input.hrSeries,
    },
    {
      id: 'hrv',
      labelKey: 'wear.hrv',
      value: input.hrv,
      unit: 'ms',
      status: hrvSt,
      range: THRESHOLDS.hrv.normal,
      baseline: input.baselineHrv,
      delta: Number((input.hrv - input.baselineHrv).toFixed(1)),
      flag: vitalFlag(input.hrv, input.baselineHrv, hrvSt),
      series: input.hrvSeries,
    },
    {
      id: 'spo2',
      labelKey: 'wear.spo2',
      value: input.spo2,
      unit: '%',
      status: spo2St,
      range: THRESHOLDS.spo2.normal,
      baseline: input.baselineSpo2,
      delta: Number((input.spo2 - input.baselineSpo2).toFixed(1)),
      flag: vitalFlag(input.spo2, input.baselineSpo2, spo2St),
      series: input.spo2Series,
    },
    {
      id: 'dose',
      labelKey: 'wear.dose',
      value: Number(input.dose.toFixed(3)),
      unit: 'mSv',
      status: doseSt,
      range: String(input.baselineDose),
      baseline: input.baselineDose,
      delta: Number((input.dose - input.baselineDose).toFixed(3)),
      flag: vitalFlag(input.dose, input.baselineDose, doseSt),
      series: input.doseSeries,
    },
  ];
  return sortVitals(tiles);
}

export function overallFromTiles(tiles: VitalTileModel[]): ClinicalStatus {
  if (tiles.some((t) => t.status === 'Critical')) return 'Critical';
  if (tiles.some((t) => t.status === 'Attention')) return 'Attention';
  return 'Normal';
}

export type TodayAction = 'askAura' | 'logSelfCheck';

export function todayAction(tiles: VitalTileModel[]): TodayAction {
  return tiles.some((t) => t.status !== 'Normal') ? 'askAura' : 'logSelfCheck';
}

export function flaggedTiles(tiles: VitalTileModel[]): VitalTileModel[] {
  return tiles.filter((t) => t.flag);
}

export function hrNormalBand(): { lo: number; hi: number } {
  return { lo: BAND_NUMBERS.restingHR.attentionLow, hi: BAND_NUMBERS.restingHR.attentionHigh };
}

export function spo2NormalBand(): { lo: number; hi: number } {
  return { lo: BAND_NUMBERS.spo2.attentionBelow, hi: 100 };
}
