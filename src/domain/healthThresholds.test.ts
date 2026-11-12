import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  BAND_NUMBERS,
  interpretRecord,
  statusHrv,
  statusLabelZh,
  statusRestingHR,
} from './healthThresholds';
import type { DailyHealthRecord } from '../types';

const sample = (over: Partial<DailyHealthRecord> = {}): DailyHealthRecord => ({
  date: '2026/11/22',
  isToday: true,
  restingHR: 70,
  restingHRStatus: 'Normal',
  hrv: 30,
  vo2Max: 22,
  spo2: 98,
  avgSleepMinutes: 430,
  avgExerciseMinutes: 120,
  mentalStatus: 'Normal',
  musculoskeletalStatus: 'Normal',
  nutritionStatus: 'Normal',
  dailyActivities: [],
  hourlyTimeline: [],
  ...over,
});

describe('shared healthThresholds interpreter', () => {
  it('uses BAND_NUMBERS so HR 100 is Attention and 101 is Critical', () => {
    expect(statusRestingHR(BAND_NUMBERS.restingHR.criticalHigh)).toBe('Attention');
    expect(statusRestingHR(BAND_NUMBERS.restingHR.criticalHigh + 1)).toBe('Critical');
    expect(statusHrv(BAND_NUMBERS.hrv.criticalBelow)).toBe('Attention');
    expect(statusHrv(BAND_NUMBERS.hrv.criticalBelow - 1)).toBe('Critical');
  });

  it('outputs only Normal / Caution / Critical internals', () => {
    const interp = interpretRecord(sample({ restingHR: 103, hrv: 14, avgSleepMinutes: 305, spo2: 95 }));
    expect(interp.overall).toBe('Critical');
    expect(['Normal', 'Caution', 'Critical']).toContain(interp.overallZh);
    for (const m of interp.metrics) {
      expect(['Normal', 'Caution', 'Critical']).toContain(m.statusZh);
    }
  });

  it('maps Gemini/legacy enums through statusLabelZh', () => {
    expect(statusLabelZh('Nominal')).toBe('Normal');
    expect(statusLabelZh('Attention Required')).toBe('Caution');
    expect(statusLabelZh('Critical')).toBe('Critical');
    expect(statusLabelZh('Optimal')).toBe('Normal');
  });
});

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

describe('no per-component hardcoded bands', () => {
  it('components do not compare restingHR > 100 or hrv < 20', () => {
    const root = join(dirname(fileURLToPath(import.meta.url)), '../components');
    const files = walk(root).filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'));
    const hits: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      if (/restingHR\s*>\s*100/.test(src) || /hrv\s*<\s*20/.test(src)) hits.push(file);
    }
    expect(hits).toEqual([]);
  });
});
