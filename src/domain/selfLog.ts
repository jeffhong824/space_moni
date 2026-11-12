/**
 * Crew self-measurement log (glucose, body temp, BP, HR).
 * Glucose band 65–99 mg/dL is sourced from OSD-575 CMP CSV glucose_range_min/max.
 * Temperature has no clinical band here — compare to personal baseline only.
 */
export const SELF_LOG_METRICS = ['glucose', 'temp', 'bpSys', 'bpDia', 'hr'] as const;
export type SelfLogMetric = (typeof SELF_LOG_METRICS)[number];

export const OSD575_GLUCOSE = {
  study: 'OSD-575',
  url: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-575/',
  min: 65,
  max: 99,
  unit: 'mg/dL',
  source: 'OSD-575 CMP CSV glucose_range_min / glucose_range_max (verified 65, 99)',
} as const;

export const SELF_LOG_LIMITS = {
  glucose: { min: 10, max: 600, unit: 'mg/dL' },
  temp: { min: 30, max: 45, unit: '°C' },
  bpSys: { min: 60, max: 260, unit: 'mmHg' },
  bpDia: { min: 30, max: 160, unit: 'mmHg' },
  hr: { min: 25, max: 250, unit: 'bpm' },
} as const;

export interface SelfLogEntry {
  id: string;
  metric: SelfLogMetric;
  value: number;
  unit: string;
  takenAt: string;
  source: 'self';
}

export function selfLogKey(account: string): string {
  return `spacemoni.selfLog.${account}`;
}

export function taipeiIsoNow(now = Date.now()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(now));
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}:${g('second')}+08:00`;
}

export function loadSelfLog(account: string): SelfLogEntry[] {
  try {
    const raw = localStorage.getItem(selfLogKey(account));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SelfLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSelfLog(account: string, entries: SelfLogEntry[]) {
  try {
    localStorage.setItem(selfLogKey(account), JSON.stringify(entries.slice(-400)));
  } catch {
    /* quota */
  }
}

export function validateSelfLog(metric: SelfLogMetric, value: number): { ok: true } | { ok: false; reason: string } {
  if (!Number.isFinite(value)) return { ok: false, reason: 'not-finite' };
  const lim = SELF_LOG_LIMITS[metric];
  if (value < lim.min || value > lim.max) return { ok: false, reason: 'out-of-range' };
  return { ok: true };
}

export function addSelfLog(account: string, metric: SelfLogMetric, value: number, now = Date.now()): SelfLogEntry | null {
  const check = validateSelfLog(metric, value);
  if (!check.ok) return null;
  const entry: SelfLogEntry = {
    id: `self-${now}-${metric}`,
    metric,
    value,
    unit: SELF_LOG_LIMITS[metric].unit,
    takenAt: taipeiIsoNow(now),
    source: 'self',
  };
  saveSelfLog(account, [...loadSelfLog(account), entry]);
  return entry;
}

export function glucoseBand(value: number): 'normal' | 'caution' {
  if (value >= OSD575_GLUCOSE.min && value <= OSD575_GLUCOSE.max) return 'normal';
  return 'caution';
}

export function sparkFor(entries: SelfLogEntry[], metric: SelfLogMetric, n = 7): number[] {
  return entries
    .filter((e) => e.metric === metric)
    .slice(-n)
    .map((e) => e.value);
}
