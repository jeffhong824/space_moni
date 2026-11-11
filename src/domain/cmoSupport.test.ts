import { describe, expect, it } from 'vitest';
import { evaluateCmoSupport } from './cmoSupport.ts';

describe('AURA CMO decision support', () => {
  it('fires a cited HRV rec when HRV is caution (alice analog)', () => {
    const review = evaluateCmoSupport({
      hrvStatus: 'Attention',
      nowIso: '2026-11-11T00:00:00+08:00',
    });
    const rec = review.recs.find((r) => r.id === 'cmo-hrv');
    expect(rec).toBeTruthy();
    expect(rec!.citeId).toBe('V2 7042');
    expect(rec!.notADiagnosis).toBe(true);
  });

  it('fires a baseline-z rec on caution |z|', () => {
    const review = evaluateCmoSupport({ baselineZBand: 'caution' });
    expect(review.recs.some((r) => r.id === 'cmo-z')).toBe(true);
  });

  it('returns passed cited checks when nothing is off', () => {
    const review = evaluateCmoSupport({
      hrStatus: 'Normal',
      hrvStatus: 'Normal',
      spo2Status: 'Normal',
      sleepMin: 430,
      sScale: 'S0',
      sansFlag: 'ok',
      moodFlag: 'ok',
      delaySec: 0,
      baselineZBand: 'inside',
      nowIso: '2026-11-11T08:00:00+08:00',
    });
    expect(review.recs).toEqual([]);
    expect(review.passed.length).toBeGreaterThan(4);
    expect(review.passed.every((p) => p.citeId.length > 0)).toBe(true);
    expect(review.reviewedAt).toBe('2026-11-11T08:00:00+08:00');
  });
});
