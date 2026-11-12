/**
 * Conditioning telemetry (simulation). User-facing copy lives in locale tables as cond.hw.*.
 */

export type ConditioningCategory = 'sleep' | 'exercise' | 'mental' | 'musculoskeletal' | 'nutrition';

export interface ConditioningDetail {
  id: ConditioningCategory;
  title: string;
  shortLabel: string;
  hardwareSource: string;
  sourceDescription: string;
  statusBadge: string;
  statusColor: 'emerald' | 'sky' | 'indigo' | 'amber' | 'rose';
  primaryMetric: {
    label: string;
    value: string;
    benchmark: string;
    subtext: string;
  };
  pastDaysData: {
    date: string;
    displayDate: string;
    value: number;
    formattedValue: string;
    status: 'Nominal' | 'Optimal' | 'Alert' | 'Elevated';
    note: string;
  }[];
  hardwareSensors: {
    label: string;
    value: string;
    status: 'Nominal' | 'Active' | 'Synced' | 'Calibrated';
  }[];
  detailedBreakdown: {
    category: string;
    items: { name: string; val: string; desc?: string }[];
  };
  aiInsight: string;
}

type HwCat = 'sleep' | 'exercise' | 'mental' | 'msk' | 'nutrition';

function hw(cat: HwCat) {
  const p = `cond.hw.${cat}`;
  return {
    title: `${p}.title`,
    shortLabel: `${p}.short`,
    hardwareSource: `${p}.source`,
    sourceDescription: `${p}.desc`,
    statusBadge: `${p}.badge`,
    metric: `${p}.metric`,
    bench: `${p}.bench`,
    sub: `${p}.sub`,
    insight: `${p}.insight`,
    s: [`${p}.s0`, `${p}.s1`, `${p}.s2`, `${p}.s3`] as const,
    cat: `${p}.cat`,
    items: [
      { name: `${p}.i0n`, desc: `${p}.i0d` },
      { name: `${p}.i1n`, desc: `${p}.i1d` },
      { name: `${p}.i2n`, desc: `${p}.i2d` },
      { name: `${p}.i3n`, desc: `${p}.i3d` },
    ],
  };
}

const sleep = hw('sleep');
const exercise = hw('exercise');
const mental = hw('mental');
const msk = hw('msk');
const nutrition = hw('nutrition');

export const CONDITIONING_DETAILS: Record<ConditioningCategory, ConditioningDetail> = {
  sleep: {
    id: 'sleep',
    title: sleep.title,
    shortLabel: sleep.shortLabel,
    hardwareSource: sleep.hardwareSource,
    sourceDescription: sleep.sourceDescription,
    statusBadge: sleep.statusBadge,
    statusColor: 'indigo',
    primaryMetric: {
      label: sleep.metric,
      value: '305 min (5.1 hrs)',
      benchmark: sleep.bench,
      subtext: sleep.sub,
    },
    pastDaysData: [
      { date: '2026/11/22', displayDate: '11/22', value: 305, formattedValue: '5h 05m', status: 'Alert', note: 'cond.note.sleep.n0' },
      { date: '2026/11/21', displayDate: '11/21', value: 380, formattedValue: '6h 20m', status: 'Nominal', note: 'cond.note.sleep.n1' },
      { date: '2026/11/20', displayDate: '11/20', value: 425, formattedValue: '7h 05m', status: 'Optimal', note: 'cond.note.sleep.n2' },
      { date: '2026/11/19', displayDate: '11/19', value: 395, formattedValue: '6h 35m', status: 'Nominal', note: 'cond.note.sleep.n3' },
      { date: '2026/11/18', displayDate: '11/18', value: 340, formattedValue: '5h 40m', status: 'Alert', note: 'cond.note.sleep.n4' },
    ],
    hardwareSensors: [
      { label: sleep.s[0], value: '38.4 dB', status: 'Nominal' },
      { label: sleep.s[1], value: '450nm', status: 'Active' },
      { label: sleep.s[2], value: '19.4 °C', status: 'Nominal' },
      { label: sleep.s[3], value: '99.2%', status: 'Synced' },
    ],
    detailedBreakdown: {
      category: sleep.cat,
      items: [
        { name: sleep.items[0].name, val: '92 min', desc: sleep.items[0].desc },
        { name: sleep.items[1].name, val: '84 min', desc: sleep.items[1].desc },
        { name: sleep.items[2].name, val: '129 min', desc: sleep.items[2].desc },
        { name: sleep.items[3].name, val: '3', desc: sleep.items[3].desc },
      ],
    },
    aiInsight: sleep.insight,
  },

  exercise: {
    id: 'exercise',
    title: exercise.title,
    shortLabel: exercise.shortLabel,
    hardwareSource: exercise.hardwareSource,
    sourceDescription: exercise.sourceDescription,
    statusBadge: exercise.statusBadge,
    statusColor: 'emerald',
    primaryMetric: {
      label: exercise.metric,
      value: '175 min (2.9 hrs)',
      benchmark: exercise.bench,
      subtext: exercise.sub,
    },
    pastDaysData: [
      { date: '2026/11/22', displayDate: '11/22', value: 175, formattedValue: '175 min', status: 'Optimal', note: 'cond.note.exercise.n0' },
      { date: '2026/11/21', displayDate: '11/21', value: 150, formattedValue: '150 min', status: 'Nominal', note: 'cond.note.exercise.n1' },
      { date: '2026/11/20', displayDate: '11/20', value: 140, formattedValue: '140 min', status: 'Nominal', note: 'cond.note.exercise.n2' },
      { date: '2026/11/19', displayDate: '11/19', value: 165, formattedValue: '165 min', status: 'Nominal', note: 'cond.note.exercise.n3' },
      { date: '2026/11/18', displayDate: '11/18', value: 180, formattedValue: '180 min', status: 'Optimal', note: 'cond.note.exercise.n4' },
    ],
    hardwareSensors: [
      { label: exercise.s[0], value: '240 kg', status: 'Calibrated' },
      { label: exercise.s[1], value: '0.002 G', status: 'Nominal' },
      { label: exercise.s[2], value: '210 W', status: 'Active' },
      { label: exercise.s[3], value: '68%', status: 'Synced' },
    ],
    detailedBreakdown: {
      category: exercise.cat,
      items: [
        { name: exercise.items[0].name, val: '65 min', desc: exercise.items[0].desc },
        { name: exercise.items[1].name, val: '60 min', desc: exercise.items[1].desc },
        { name: exercise.items[2].name, val: '50 min', desc: exercise.items[2].desc },
        { name: exercise.items[3].name, val: '845 kcal', desc: exercise.items[3].desc },
      ],
    },
    aiInsight: exercise.insight,
  },

  mental: {
    id: 'mental',
    title: mental.title,
    shortLabel: mental.shortLabel,
    hardwareSource: mental.hardwareSource,
    sourceDescription: mental.sourceDescription,
    statusBadge: mental.statusBadge,
    statusColor: 'sky',
    primaryMetric: {
      label: mental.metric,
      value: '88/100',
      benchmark: mental.bench,
      subtext: mental.sub,
    },
    pastDaysData: [
      { date: '2026/11/22', displayDate: '11/22', value: 88, formattedValue: '88/100', status: 'Nominal', note: 'cond.note.mental.n0' },
      { date: '2026/11/21', displayDate: '11/21', value: 92, formattedValue: '92/100', status: 'Optimal', note: 'cond.note.mental.n1' },
      { date: '2026/11/20', displayDate: '11/20', value: 95, formattedValue: '95/100', status: 'Optimal', note: 'cond.note.mental.n2' },
      { date: '2026/11/19', displayDate: '11/19', value: 90, formattedValue: '90/100', status: 'Nominal', note: 'cond.note.mental.n3' },
      { date: '2026/11/18', displayDate: '11/18', value: 85, formattedValue: '85/100', status: 'Nominal', note: 'cond.note.mental.n4' },
    ],
    hardwareSensors: [
      { label: mental.s[0], value: '11%', status: 'Nominal' },
      { label: mental.s[1], value: '215 ms', status: 'Synced' },
      { label: mental.s[2], value: '99.4%', status: 'Nominal' },
      { label: mental.s[3], value: '4', status: 'Active' },
    ],
    detailedBreakdown: {
      category: mental.cat,
      items: [
        { name: mental.items[0].name, val: '11%', desc: mental.items[0].desc },
        { name: mental.items[1].name, val: '142 wpm', desc: mental.items[1].desc },
        { name: mental.items[2].name, val: '198 ms', desc: mental.items[2].desc },
        { name: mental.items[3].name, val: '—', desc: mental.items[3].desc },
      ],
    },
    aiInsight: mental.insight,
  },

  musculoskeletal: {
    id: 'musculoskeletal',
    title: msk.title,
    shortLabel: msk.shortLabel,
    hardwareSource: msk.hardwareSource,
    sourceDescription: msk.sourceDescription,
    statusBadge: msk.statusBadge,
    statusColor: 'amber',
    primaryMetric: {
      label: msk.metric,
      value: '96.2%',
      benchmark: msk.bench,
      subtext: msk.sub,
    },
    pastDaysData: [
      { date: '2026/11/22', displayDate: '11/22', value: 96, formattedValue: '96.2%', status: 'Nominal', note: 'cond.note.msk.n0' },
      { date: '2026/11/21', displayDate: '11/21', value: 96, formattedValue: '96.4%', status: 'Nominal', note: 'cond.note.msk.n1' },
      { date: '2026/11/20', displayDate: '11/20', value: 97, formattedValue: '96.8%', status: 'Optimal', note: 'cond.note.msk.n2' },
      { date: '2026/11/19', displayDate: '11/19', value: 96, formattedValue: '96.3%', status: 'Nominal', note: 'cond.note.msk.n3' },
      { date: '2026/11/18', displayDate: '11/18', value: 96, formattedValue: '96.0%', status: 'Nominal', note: 'cond.note.msk.n4' },
    ],
    hardwareSensors: [
      { label: msk.s[0], value: '1,840 N', status: 'Calibrated' },
      { label: msk.s[1], value: '—', status: 'Active' },
      { label: msk.s[2], value: '+2.1 cm', status: 'Nominal' },
      { label: msk.s[3], value: '-0.04%/mo', status: 'Synced' },
    ],
    detailedBreakdown: {
      category: msk.cat,
      items: [
        { name: msk.items[0].name, val: '1,840 N', desc: msk.items[0].desc },
        { name: msk.items[1].name, val: '-1.2 mm', desc: msk.items[1].desc },
        { name: msk.items[2].name, val: '98.8%', desc: msk.items[2].desc },
        { name: msk.items[3].name, val: '1', desc: msk.items[3].desc },
      ],
    },
    aiInsight: msk.insight,
  },

  nutrition: {
    id: 'nutrition',
    title: nutrition.title,
    shortLabel: nutrition.shortLabel,
    hardwareSource: nutrition.hardwareSource,
    sourceDescription: nutrition.sourceDescription,
    statusBadge: nutrition.statusBadge,
    statusColor: 'rose',
    primaryMetric: {
      label: nutrition.metric,
      value: '2,740 kcal',
      benchmark: nutrition.bench,
      subtext: nutrition.sub,
    },
    pastDaysData: [
      { date: '2026/11/22', displayDate: '11/22', value: 2740, formattedValue: '2,740 kcal', status: 'Nominal', note: 'cond.note.nutrition.n0' },
      { date: '2026/11/21', displayDate: '11/21', value: 2810, formattedValue: '2,810 kcal', status: 'Optimal', note: 'cond.note.nutrition.n1' },
      { date: '2026/11/20', displayDate: '11/20', value: 2680, formattedValue: '2,680 kcal', status: 'Nominal', note: 'cond.note.nutrition.n2' },
      { date: '2026/11/19', displayDate: '11/19', value: 2790, formattedValue: '2,790 kcal', status: 'Nominal', note: 'cond.note.nutrition.n3' },
      { date: '2026/11/18', displayDate: '11/18', value: 2840, formattedValue: '2,840 kcal', status: 'Optimal', note: 'cond.note.nutrition.n4' },
    ],
    hardwareSensors: [
      { label: nutrition.s[0], value: '4', status: 'Active' },
      { label: nutrition.s[1], value: '2,450 mL', status: 'Nominal' },
      { label: nutrition.s[2], value: '—', status: 'Synced' },
      { label: nutrition.s[3], value: '±2%', status: 'Calibrated' },
    ],
    detailedBreakdown: {
      category: nutrition.cat,
      items: [
        { name: nutrition.items[0].name, val: '112 g', desc: nutrition.items[0].desc },
        { name: nutrition.items[1].name, val: '2,450 mL', desc: nutrition.items[1].desc },
        { name: nutrition.items[2].name, val: '2,850 mg', desc: nutrition.items[2].desc },
        { name: nutrition.items[3].name, val: '1,000 IU', desc: nutrition.items[3].desc },
      ],
    },
    aiInsight: nutrition.insight,
  },
};
