/**
 * Demo clinical policy for SpaceMoni two-level health analysis.
 *
 * These thresholds are documented, consistent, and ISS-informed for a commercial
 * demo. They are NOT a NASA-certified medical protocol. Crew vitals in this
 * applet are simulated demonstration telemetry (see TELEMETRY_SOURCE).
 */

export type MetricStatus = 'Normal' | 'Attention' | 'Critical';
export type OverallStatus = 'Nominal' | 'Attention Required' | 'Critical';

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
  labelZh: '模擬機組遙測（示範資料）',
  noteZh: '非即時飛行硬體串流。數值來自示範任務日誌，供作業台與 AURA 分析使用。',
};

export const CABIN_ENV_SOURCE = {
  kind: 'simulated_eclss_demo' as const,
  labelZh: '艙內 ECLSS 示範讀數',
  noteZh: '氧氣、二氧化碳、氣壓等為示範艙內環境，非 NASA 公開 API。',
};

/** Resting HR in microgravity: ISS crews often run higher than terrestrial rest. */
export const THRESHOLDS = {
  restingHR: {
    id: 'restingHR',
    labelZh: '靜息心率',
    unit: 'bpm',
    normal: '50–90',
    attention: '91–100 或 45–49',
    critical: '>100 或 <45',
  },
  hrv: {
    id: 'hrv',
    labelZh: '心率變異性 (HRV)',
    unit: 'ms',
    normal: '≥25',
    attention: '20–24',
    critical: '<20',
  },
  spo2: {
    id: 'spo2',
    labelZh: '血氧飽和度 (SpO₂)',
    unit: '%',
    normal: '≥96',
    attention: '94–95',
    critical: '<94',
  },
  vo2Max: {
    id: 'vo2Max',
    labelZh: '最大攝氧量 (VO₂ max)',
    unit: 'mL/kg/min',
    normal: '≥20.0',
    attention: '16.0–19.9',
    critical: '<16.0',
  },
  sleepMinutes: {
    id: 'sleepMinutes',
    labelZh: '平均睡眠時間',
    unit: 'min',
    normal: '≥420（7 小時）',
    attention: '360–419',
    critical: '<360',
  },
  exerciseMinutes: {
    id: 'exerciseMinutes',
    labelZh: '運動對策時數',
    unit: 'min',
    normal: '90–210',
    attention: '<90 或 >210',
    critical: '—',
  },
} as const satisfies Record<string, ThresholdBand>;

export function statusRestingHR(bpm: number): MetricStatus {
  if (bpm > 100 || bpm < 45) return 'Critical';
  if (bpm > 90 || bpm < 50) return 'Attention';
  return 'Normal';
}

export function statusHrv(ms: number): MetricStatus {
  if (ms < 20) return 'Critical';
  if (ms < 25) return 'Attention';
  return 'Normal';
}

export function statusSpo2(pct: number): MetricStatus {
  if (pct < 94) return 'Critical';
  if (pct < 96) return 'Attention';
  return 'Normal';
}

export function statusVo2(value: number): MetricStatus {
  if (value < 16) return 'Critical';
  if (value < 20) return 'Attention';
  return 'Normal';
}

export function statusSleep(minutes: number): MetricStatus {
  if (minutes < 360) return 'Critical';
  if (minutes < 420) return 'Attention';
  return 'Normal';
}

export function statusExercise(minutes: number): MetricStatus {
  if (minutes < 90 || minutes > 210) return 'Attention';
  return 'Normal';
}

export function rollupOverall(statuses: MetricStatus[]): OverallStatus {
  if (statuses.includes('Critical')) return 'Critical';
  if (statuses.includes('Attention')) return 'Attention Required';
  return 'Nominal';
}

export function worseStatus(a: MetricStatus, b: MetricStatus): MetricStatus {
  const rank = { Normal: 0, Attention: 1, Critical: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export function formatSleep(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}
