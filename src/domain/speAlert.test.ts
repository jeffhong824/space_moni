import { describe, expect, it } from 'vitest';
import {
  ARTEMIS_I_CITE,
  SPE_30DAY_MSV,
  STD3001_CAREER_MSV,
  assumedSpeExtraMsvPerHour,
  careerDoseMsv,
  speStageFromInputs,
} from './speAlert.ts';

describe('SPE two-stage alert', () => {
  it('WATCH from DONKI SEP without crossing S-scale', () => {
    const r = speStageFromInputs({
      pfu10: 3,
      pfu100: 0.01,
      donkiSepCount: 1,
      donkiSepNotifications: 0,
    });
    expect(r.stage).toBe('watch');
    expect(r.sScale).toBe('S0');
  });

  it('WATCH when GOES ≥10 MeV is rising toward S1', () => {
    const r = speStageFromInputs({
      pfu10: 4,
      prevPfu10: 1,
      pfu100: 0,
      donkiSepCount: 0,
      donkiSepNotifications: 0,
    });
    expect(r.stage).toBe('watch');
  });

  it('SHELTER when NOAA S-scale is crossed (≥10 pfu)', () => {
    const r = speStageFromInputs({
      pfu10: 120,
      pfu100: 0.2,
      donkiSepCount: 0,
      donkiSepNotifications: 0,
    });
    expect(r.stage).toBe('shelter');
    expect(r.sScale).toBe('S2');
  });

  it('SHELTER when ≥100 MeV flux is elevated even if S0', () => {
    const r = speStageFromInputs({
      pfu10: 1,
      pfu100: 2,
      donkiSepCount: 0,
      donkiSepNotifications: 0,
    });
    expect(r.stage).toBe('shelter');
  });

  it('career and 30-day SPE limits match cited PELs', () => {
    expect(STD3001_CAREER_MSV).toBe(600);
    expect(SPE_30DAY_MSV).toBe(250);
    expect(ARTEMIS_I_CITE.absorbedMgyHsu2).toBe(13.47);
    const dose = careerDoseMsv({ missionDays: 100, baselineMsvDay: 0.61, speExtraMsv: 20 });
    expect(dose.total).toBeCloseTo(81);
    expect(dose.source).toBe('simulation');
    expect(dose.pctCareer).toBeLessThan(100);
    expect(assumedSpeExtraMsvPerHour('S2')).toBe(0.2);
    expect(assumedSpeExtraMsvPerHour('S0')).toBe(0);
  });
});
