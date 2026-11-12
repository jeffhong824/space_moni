import type { AstronautProfile, DailyHealthRecord } from '../types.ts';
import {
  interpretRecord,
  type ClinicalStatus,
  type DataSourceKind,
  type SelfCheckEntry,
  type StatusZh,
} from './healthThresholds.ts';

export type CaseState = 'open' | 'reviewing' | 'acted' | 'closed';

export const CASE_STATE_ZH: Record<CaseState, string> = {
  open: 'open',
  reviewing: 'reviewing',
  acted: 'acted',
  closed: 'closed',
};

export const CASE_STATE_ORDER: CaseState[] = ['open', 'reviewing', 'acted', 'closed'];

export interface PhysicianNote {
  at: string;
  author: string;
  text: string;
}

export interface ClinicalCase {
  id: string;
  astronautId: string;
  astronautName: string;
  metricId: string;
  metricLabelZh: string;
  valueLabel: string;
  thresholdBand: string;
  status: ClinicalStatus;
  statusZh: StatusZh;
  observedAt: string;
  sourceKind: DataSourceKind;
  sourceLabelZh: string;
  state: CaseState;
  physicianNotes: PhysicianNote[];
}

export interface CaseMeta {
  state: CaseState;
  physicianNotes: PhysicianNote[];
}

const STATUS_RANK: Record<ClinicalStatus, number> = { Critical: 2, Attention: 1, Normal: 0 };

export function deriveClinicalCases(
  astronauts: AstronautProfile[],
  recordsByAstronaut: Record<string, DailyHealthRecord[]>,
  selfChecks: Record<string, SelfCheckEntry | undefined>
): ClinicalCase[] {
  const cases: ClinicalCase[] = [];
  for (const astro of astronauts) {
    const records = recordsByAstronaut[astro.id] || [];
    const today = records.find((r) => r.isToday) || records[0];
    if (!today) continue;
    const interp = interpretRecord(today, selfChecks[astro.id] ?? null);
    for (const metric of interp.metrics) {
      if (metric.status === 'Normal') continue;
      cases.push({
        id: `${astro.id}-${metric.id}-${today.date}-${metric.labelZh}`,
        astronautId: astro.id,
        astronautName: astro.name,
        metricId: String(metric.id),
        metricLabelZh: metric.labelZh,
        valueLabel: metric.valueLabel,
        thresholdBand: metric.thresholdBand,
        status: metric.status,
        statusZh: metric.statusZh,
        observedAt: today.date,
        sourceKind: metric.sourceKind,
        sourceLabelZh: metric.sourceLabelZh,
        state: 'open',
        physicianNotes: [],
      });
    }
  }
  return cases.sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status] || a.astronautName.localeCompare(b.astronautName));
}

export function mergeCaseMeta(cases: ClinicalCase[], meta: Record<string, CaseMeta>): ClinicalCase[] {
  return cases.map((c) => {
    const extra = meta[c.id];
    if (!extra) return c;
    return { ...c, state: extra.state, physicianNotes: extra.physicianNotes };
  });
}

export function sourceKindZh(kind: DataSourceKind): string {
  if (kind === 'official') return 'official';
  if (kind === 'ai') return 'AI';
  return 'demo';
}
