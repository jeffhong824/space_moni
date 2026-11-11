import { describe, expect, it } from 'vitest';
import { defaultSigma, personalZ } from './baselines.ts';
import { flagSans } from './sansCheck.ts';
import { scoreCheckin, aggregateTeam } from './moodCheckin.ts';
import { circadianDriftHours, pvtFromSleep, sleepDebtHours, solClockAt, SOL_MS } from './solClock.ts';
import { egressVerdict } from './egressReady.ts';
import { buildCmoRecommendations } from './cmoSupport.ts';

describe('personal baseline z-score', () => {
  it('bands |z|<1.5 inside, ≥1.5 caution, ≥2.5 off', () => {
    const sigma = defaultSigma(80);
    expect(personalZ(80, 80, sigma)?.band).toBe('inside');
    expect(personalZ(80 + 1.6 * sigma, 80, sigma)?.band).toBe('caution');
    expect(personalZ(80 + 3 * sigma, 80, sigma)?.band).toBe('off');
    expect(personalZ(Number.NaN, 80, sigma)).toBeNull();
  });
});

describe('SANS flag rules', () => {
  it('refers on severe Amsler or logMAR ≥0.5', () => {
    const r = flagSans({ at: '', crewId: 'x', amsler: 3, logMarOd: 0.1, logMarOs: 0.1 });
    expect(r.flag).toBe('refer');
  });
  it('watches a 0.2 logMAR jump', () => {
    const r = flagSans(
      { at: 'b', crewId: 'x', amsler: 0, logMarOd: 0.25, logMarOs: 0 },
      { at: 'a', crewId: 'x', amsler: 0, logMarOd: 0, logMarOs: 0 }
    );
    expect(r.flag).toBe('watch');
  });
});

describe('mood BH-201 thresholds', () => {
  it('flags concern when two indicators trip', () => {
    const r = scoreCheckin({
      at: '',
      crewId: 'a',
      mood: 2,
      stress: 4,
      sleepQuality: 4,
      cohesion: 4,
      conflict: 2,
    });
    expect(r.flag).toBe('concern');
  });
  it('aggregates team means', () => {
    const g = aggregateTeam([
      { at: '', crewId: 'a', mood: 5, stress: 1, sleepQuality: 4, cohesion: 5, conflict: 1 },
      { at: '', crewId: 'b', mood: 5, stress: 2, sleepQuality: 4, cohesion: 4, conflict: 2 },
    ]);
    expect(g?.flag).toBe('ok');
    expect(g?.n).toBe(2);
  });
});

describe('sol / sleep / PVT', () => {
  it('advances one sol after 24h39m35s', () => {
    const a = solClockAt(0, 0);
    const b = solClockAt(0, SOL_MS);
    expect(a.solNumber).toBe(1);
    expect(b.solNumber).toBe(2);
  });
  it('sleep debt and PVT worsen together', () => {
    expect(sleepDebtHours(300, 420)).toBeCloseTo(2);
    expect(pvtFromSleep(300)).toBeGreaterThan(pvtFromSleep(480));
    expect(circadianDriftHours(10)).toBeGreaterThan(6);
  });
});

describe('egress go/no-go', () => {
  it('no-go when orthostatic analog is poor', () => {
    const r = egressVerdict({ orthostatic: 40, balance: 80, grip: 80, vision: 80 });
    expect(r.overall).toBe('no-go');
    expect(r.tasks.find((t) => t.id === 'eva')?.verdict).toBe('no-go');
  });
  it('go when all scores are high', () => {
    expect(egressVerdict({ orthostatic: 90, balance: 88, grip: 85, vision: 92 }).overall).toBe('go');
  });
});

describe('CMO recs', () => {
  it('cites NASA IDs, marks not a diagnosis, and keeps shelter autonomous', () => {
    const recs = buildCmoRecommendations({
      hrStatus: 'Attention',
      sScale: 'S2',
      delaySec: 400,
    });
    expect(recs.every((r) => r.notADiagnosis)).toBe(true);
    expect(recs.some((r) => r.citeId.length > 0)).toBe(true);
    expect(recs.find((r) => r.id === 'cmo-spe')?.autonomy).toBe('crew_autonomous');
  });
});
