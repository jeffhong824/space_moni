/**
 * Demo clinical policy for SpaceMoni two-level health analysis.
 *
 * These thresholds are documented, consistent, and ISS-informed for a commercial
 * demo. They are NOT a NASA-certified medical protocol. Crew vitals in this
 * applet are simulated demonstration telemetry (see TELEMETRY_SOURCE).
 *
 * All health UI must go through interpretRecord / statusLabelZh — never a
 * per-component numeric band. User-facing status is only Normal / Caution / Critical.
 */

import type { DailyHealthRecord, HourlyVitalPoint } from '../types.ts';
import { translate } from '../i18n/index.ts';

export type ClinicalStatus = 'Normal' | 'Attention' | 'Critical';
export type MetricStatus = ClinicalStatus;
export type OverallStatus = ClinicalStatus;
export type StatusZh = string;

export interface ThresholdBand {
  id: string;
  labelZh: string;
  unit: string;
  normal: string;
  attention: string;
  critical: string;
}

export const TELEMETRY_SOURCE = {
  kind: 'simulated_demo' as const,
  labelZh: 'Simulated crew telemetry (demo)',
  noteZh: 'Not a live vehicle stream. Values come from the demo mission log for the ops desk and AURA.',
};

export const CABIN_ENV_SOURCE = {
  kind: 'simulated_eclss_demo' as const,
  labelZh: 'Cabin ECLSS demo readings',
  noteZh: 'O2, CO2, and pressure are demo cabin environment, not a NASA public API.',
};

export const STATUS_ZH: Record<ClinicalStatus, StatusZh> = {
  Normal: 'Normal',
  Attention: 'Caution',
  Critical: 'Critical',
};

const STATUS_RANK: Record<ClinicalStatus, number> = { Normal: 0, Attention: 1, Critical: 2 };

/** Numeric bands — single source of truth. UI must import these, not re-hardcode. */
export const BAND_NUMBERS = {
  restingHR: { criticalHigh: 100, attentionHigh: 90, attentionLow: 50, criticalLow: 45 },
  hrv: { criticalBelow: 20, attentionBelow: 25 },
  spo2: { criticalBelow: 94, attentionBelow: 96 },
  vo2Max: { criticalBelow: 16, attentionBelow: 20 },
  sleepMinutes: { criticalBelow: 360, attentionBelow: 420 },
  exerciseMinutes: { min: 90, max: 210 },
} as const;

/** Resting HR in microgravity: ISS crews often run higher than terrestrial rest. */
export const THRESHOLDS = {
  restingHR: {
    id: 'restingHR',
    labelZh: 'Resting heart rate',
    unit: 'bpm',
    normal: '50–90',
    attention: '91–100 or 45–49',
    critical: `>${BAND_NUMBERS.restingHR.criticalHigh} or <${BAND_NUMBERS.restingHR.criticalLow}`,
  },
  hrv: {
    id: 'hrv',
    labelZh: 'Heart-rate variability (HRV)',
    unit: 'ms',
    normal: `≥${BAND_NUMBERS.hrv.attentionBelow}`,
    attention: `${BAND_NUMBERS.hrv.criticalBelow}–${BAND_NUMBERS.hrv.attentionBelow - 1}`,
    critical: `<${BAND_NUMBERS.hrv.criticalBelow}`,
  },
  spo2: {
    id: 'spo2',
    labelZh: 'Oxygen saturation (SpO2)',
    unit: '%',
    normal: `≥${BAND_NUMBERS.spo2.attentionBelow}`,
    attention: `${BAND_NUMBERS.spo2.criticalBelow}–${BAND_NUMBERS.spo2.attentionBelow - 1}`,
    critical: `<${BAND_NUMBERS.spo2.criticalBelow}`,
  },
  vo2Max: {
    id: 'vo2Max',
    labelZh: 'VO2 max',
    unit: 'mL/kg/min',
    normal: `≥${BAND_NUMBERS.vo2Max.attentionBelow.toFixed(1)}`,
    attention: `${BAND_NUMBERS.vo2Max.criticalBelow.toFixed(1)}–${(BAND_NUMBERS.vo2Max.attentionBelow - 0.1).toFixed(1)}`,
    critical: `<${BAND_NUMBERS.vo2Max.criticalBelow.toFixed(1)}`,
  },
  sleepMinutes: {
    id: 'sleepMinutes',
    labelZh: 'Average sleep',
    unit: 'min',
    normal: `>=${BAND_NUMBERS.sleepMinutes.attentionBelow} (7 h)`,
    attention: `${BAND_NUMBERS.sleepMinutes.criticalBelow}–${BAND_NUMBERS.sleepMinutes.attentionBelow - 1}`,
    critical: `<${BAND_NUMBERS.sleepMinutes.criticalBelow}`,
  },
  exerciseMinutes: {
    id: 'exerciseMinutes',
    labelZh: 'Exercise countermeasure',
    unit: 'min',
    normal: `${BAND_NUMBERS.exerciseMinutes.min}–${BAND_NUMBERS.exerciseMinutes.max}`,
    attention: `<${BAND_NUMBERS.exerciseMinutes.min} or >${BAND_NUMBERS.exerciseMinutes.max}`,
    critical: '—',
  },
} as const satisfies Record<string, ThresholdBand>;

export function statusRestingHR(bpm: number): ClinicalStatus {
  const b = BAND_NUMBERS.restingHR;
  if (bpm > b.criticalHigh || bpm < b.criticalLow) return 'Critical';
  if (bpm > b.attentionHigh || bpm < b.attentionLow) return 'Attention';
  return 'Normal';
}

export function statusHrv(ms: number): ClinicalStatus {
  if (ms < BAND_NUMBERS.hrv.criticalBelow) return 'Critical';
  if (ms < BAND_NUMBERS.hrv.attentionBelow) return 'Attention';
  return 'Normal';
}

export function statusSpo2(pct: number): ClinicalStatus {
  if (pct < BAND_NUMBERS.spo2.criticalBelow) return 'Critical';
  if (pct < BAND_NUMBERS.spo2.attentionBelow) return 'Attention';
  return 'Normal';
}

export function statusVo2(value: number): ClinicalStatus {
  if (value < BAND_NUMBERS.vo2Max.criticalBelow) return 'Critical';
  if (value < BAND_NUMBERS.vo2Max.attentionBelow) return 'Attention';
  return 'Normal';
}

export function statusSleep(minutes: number): ClinicalStatus {
  if (minutes < BAND_NUMBERS.sleepMinutes.criticalBelow) return 'Critical';
  if (minutes < BAND_NUMBERS.sleepMinutes.attentionBelow) return 'Attention';
  return 'Normal';
}

export function statusExercise(minutes: number): ClinicalStatus {
  if (minutes < BAND_NUMBERS.exerciseMinutes.min || minutes > BAND_NUMBERS.exerciseMinutes.max) return 'Attention';
  return 'Normal';
}

export function normalizeClinicalStatus(status: string | null | undefined): ClinicalStatus {
  const s = (status || '').trim();
  const zhCrit = translate('zh-Hant-TW', 'status.critical');
  const zhCaution = translate('zh-Hant-TW', 'status.caution');
  const jaCrit = translate('ja', 'status.critical');
  const esCrit = translate('es', 'status.critical');
  const esCaution = translate('es', 'status.caution');
  if (s === 'Critical' || s === zhCrit || s === jaCrit || s === esCrit || s === 'Alert') return 'Critical';
  if (
    s === 'Attention' ||
    s === 'Attention Required' ||
    s === 'Elevated' ||
    s === zhCaution ||
    s === esCaution ||
    s === 'Elevated Stress' ||
    s === 'Fatigued' ||
    s === 'Mild Strain' ||
    s === 'Calorie Deficit'
  ) {
    return 'Attention';
  }
  if (s === 'Atrophy Risk' || s === 'Dehydration') return 'Critical';
  return 'Normal';
}

export function statusLabelZh(status: string | null | undefined): StatusZh {
  return STATUS_ZH[normalizeClinicalStatus(status)];
}

export function worseStatus(a: ClinicalStatus, b: ClinicalStatus): ClinicalStatus {
  return STATUS_RANK[a] >= STATUS_RANK[b] ? a : b;
}

export function rollupOverall(statuses: ClinicalStatus[]): ClinicalStatus {
  if (statuses.includes('Critical')) return 'Critical';
  if (statuses.includes('Attention')) return 'Attention';
  return 'Normal';
}

export function formatSleep(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export function interpretHourlyPoint(pt: HourlyVitalPoint): ClinicalStatus {
  const hr = statusRestingHR(pt.hr);
  const spo2 = statusSpo2(pt.spo2);
  const hrv = pt.hrv != null ? statusHrv(pt.hrv) : 'Normal';
  return worseStatus(hr, worseStatus(spo2, hrv));
}

export function hourlyAbnormal(pt: HourlyVitalPoint): boolean {
  return interpretHourlyPoint(pt) !== 'Normal';
}

export type SelfCheckMood = 'normal' | 'stressed' | 'fatigued';
export type SelfCheckPain = 'none' | 'mild' | 'moderate';

export interface SelfCheckEntry {
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  mood: SelfCheckMood;
  pain: SelfCheckPain;
  symptoms: string;
  at: string;
}

export type DataSourceKind = 'demo' | 'official' | 'ai';

export interface MetricInterpretation {
  id: keyof typeof THRESHOLDS | 'selfCheck';
  labelZh: string;
  valueLabel: string;
  numericValue: number;
  unit: string;
  status: ClinicalStatus;
  statusZh: StatusZh;
  thresholdBand: string;
  sourceKind: DataSourceKind;
  sourceLabelZh: string;
}

export interface VitalInterpretation {
  overall: ClinicalStatus;
  overallZh: StatusZh;
  reasonZh: string;
  metrics: MetricInterpretation[];
  sourceKind: DataSourceKind;
  sourceBadgeZh: string;
  lastUpdated: string;
}

function bandFor(id: keyof typeof THRESHOLDS, status: ClinicalStatus): string {
  const t = THRESHOLDS[id];
  if (status === 'Critical') return `Critical ${t.critical}`;
  if (status === 'Attention') return `Caution ${t.attention}`;
  return `Normal ${t.normal}`;
}

function metricOf(
  id: keyof typeof THRESHOLDS,
  numericValue: number,
  status: ClinicalStatus,
  valueLabel: string
): MetricInterpretation {
  const t = THRESHOLDS[id];
  return {
    id,
    labelZh: t.labelZh,
    valueLabel,
    numericValue,
    unit: t.unit,
    status,
    statusZh: STATUS_ZH[status],
    thresholdBand: bandFor(id, status),
    sourceKind: 'demo',
    sourceLabelZh: TELEMETRY_SOURCE.labelZh,
  };
}

function primaryReason(metrics: MetricInterpretation[], extras: string[]): string {
  const ordered = [...metrics].sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status]);
  const worst = ordered.find((m) => m.status !== 'Normal');
  if (worst) {
    return `${worst.labelZh} ${worst.valueLabel} (${worst.statusZh}, ${worst.thresholdBand})`;
  }
  if (extras.length) return extras[0];
  return 'All demo bands are in the normal range.';
}

/** Single interpreter for every health UI surface. */
export function interpretRecord(record: DailyHealthRecord, selfCheck?: SelfCheckEntry | null): VitalInterpretation {
  const metrics: MetricInterpretation[] = [
    metricOf('restingHR', record.restingHR, statusRestingHR(record.restingHR), `${record.restingHR} bpm`),
    metricOf('hrv', record.hrv, statusHrv(record.hrv), `${record.hrv} ms`),
    metricOf('spo2', record.spo2, statusSpo2(record.spo2), `${record.spo2}%`),
    metricOf('vo2Max', record.vo2Max, statusVo2(record.vo2Max), `${record.vo2Max.toFixed(1)} mL/kg/min`),
    metricOf('sleepMinutes', record.avgSleepMinutes, statusSleep(record.avgSleepMinutes), formatSleep(record.avgSleepMinutes)),
    metricOf(
      'exerciseMinutes',
      record.avgExerciseMinutes,
      statusExercise(record.avgExerciseMinutes),
      `${record.avgExerciseMinutes} min`
    ),
  ];

  const extras: string[] = [];
  if (selfCheck) {
    const sleepMetric = metrics.find((m) => m.id === 'sleepMinutes');
    if (sleepMetric && selfCheck.sleepQuality <= 2) {
      sleepMetric.status = worseStatus(sleepMetric.status, 'Attention');
      sleepMetric.statusZh = STATUS_ZH[sleepMetric.status];
      extras.push(`Self-check sleep quality ${selfCheck.sleepQuality}/5`);
    }
    if (selfCheck.mood !== 'normal') {
      const moodStatus: ClinicalStatus = selfCheck.mood === 'fatigued' ? 'Attention' : 'Attention';
      metrics.push({
        id: 'selfCheck',
        labelZh: 'Self-check mood',
        valueLabel: selfCheck.mood === 'stressed' ? 'elevated stress' : 'fatigue',
        numericValue: 0,
        unit: '',
        status: moodStatus,
        statusZh: STATUS_ZH[moodStatus],
        thresholdBand: 'Caution: self-report not normal',
        sourceKind: 'demo',
        sourceLabelZh: 'Crew self-check (demo)',
      });
    }
    if (selfCheck.pain === 'moderate') {
      metrics.push({
        id: 'selfCheck',
        labelZh: 'Self-check pain',
        valueLabel: 'moderate pain',
        numericValue: 0,
        unit: '',
        status: 'Attention',
        statusZh: STATUS_ZH.Attention,
        thresholdBand: 'Caution: self-reported moderate pain',
        sourceKind: 'demo',
        sourceLabelZh: 'Crew self-check (demo)',
      });
    } else if (selfCheck.pain === 'mild') {
      extras.push('Self-check: mild pain');
    }
    if (selfCheck.symptoms.trim()) {
      metrics.push({
        id: 'selfCheck',
        labelZh: 'Self-check symptoms',
        valueLabel: selfCheck.symptoms.trim().slice(0, 40),
        numericValue: 0,
        unit: '',
        status: 'Attention',
        statusZh: STATUS_ZH.Attention,
        thresholdBand: 'Caution: self-reported symptoms',
        sourceKind: 'demo',
        sourceLabelZh: 'Crew self-check (demo)',
      });
    }
  }

  const qualitative: ClinicalStatus[] = [
    normalizeClinicalStatus(record.mentalStatus),
    normalizeClinicalStatus(record.musculoskeletalStatus),
    normalizeClinicalStatus(record.nutritionStatus),
  ];

  const overall = rollupOverall([...metrics.map((m) => m.status), ...qualitative]);
  const reasonZh = primaryReason(metrics, extras);

  return {
    overall,
    overallZh: STATUS_ZH[overall],
    reasonZh,
    metrics,
    sourceKind: 'demo',
    sourceBadgeZh: TELEMETRY_SOURCE.labelZh,
    lastUpdated: record.date,
  };
}

export function qualitativeLabelZh(value: string): StatusZh {
  return statusLabelZh(value);
}
