import { describe, expect, it } from 'vitest';
import {
  buildVitalTiles,
  minutesUntil,
  nextScheduleIndex,
  overallFromTiles,
  parseSlotStartMin,
  sortVitals,
  statusDoseRate,
  todayAction,
  vitalFlag,
} from './todayStatus.ts';

describe('today status hierarchy', () => {
  it('flags elevated HR and low HRV and asks AURA', () => {
    const tiles = buildVitalTiles({
      hr: 115,
      hrv: 15,
      spo2: 96,
      dose: 0.4,
      baselineHr: 72,
      baselineHrv: 32,
      baselineSpo2: 97,
      baselineDose: 0.42,
      hrSeries: [80, 90, 115],
      hrvSeries: [30, 22, 15],
      spo2Series: [97, 96, 96],
      doseSeries: [0.4, 0.4, 0.4],
    });
    expect(tiles[0].id).toBe('hr');
    expect(tiles[0].flag).toBe('elevated');
    expect(tiles.find((t) => t.id === 'hrv')?.flag).toBe('low');
    expect(overallFromTiles(tiles)).not.toBe('Normal');
    expect(todayAction(tiles)).toBe('askAura');
  });

  it('is all-in-range when live values sit in band', () => {
    const tiles = buildVitalTiles({
      hr: 72,
      hrv: 32,
      spo2: 97,
      dose: 0.42,
      baselineHr: 70,
      baselineHrv: 30,
      baselineSpo2: 97,
      baselineDose: 0.42,
      hrSeries: [70, 72],
      hrvSeries: [30, 32],
      spo2Series: [97, 97],
      doseSeries: [0.42, 0.42],
    });
    expect(overallFromTiles(tiles)).toBe('Normal');
    expect(todayAction(tiles)).toBe('logSelfCheck');
    expect(tiles.every((t) => t.flag == null)).toBe(true);
  });

  it('picks the next schedule item from Taipei minutes', () => {
    expect(parseSlotStartMin('13:00-15:00')).toBe(13 * 60);
    const items = [
      { id: 'a', title: 'Overall', startMin: 8 * 60, timeLabel: '08:00' },
      { id: 'b', title: 'Exercise', startMin: 13 * 60, timeLabel: '13:00' },
      { id: 'c', title: 'Check', startMin: 18 * 60, timeLabel: '18:00' },
    ];
    expect(nextScheduleIndex(items, 12 * 60 + 20)).toBe(1);
    expect(minutesUntil(13 * 60, 12 * 60 + 20)).toBe(40);
  });

  it('sorts abnormal vitals first', () => {
    const sorted = sortVitals([
      { id: 'spo2', status: 'Normal', labelKey: '', value: 97, unit: '%', range: '', baseline: 97, delta: 0, flag: null, series: [] },
      { id: 'hr', status: 'Attention', labelKey: '', value: 95, unit: 'bpm', range: '', baseline: 70, delta: 25, flag: 'elevated', series: [] },
    ] as ReturnType<typeof sortVitals>);
    expect(sorted[0].id).toBe('hr');
  });

  it('does not treat a small dose bump as critical', () => {
    expect(statusDoseRate(0.5, 0.42)).toBe('Normal');
    expect(statusDoseRate(0.7, 0.42)).toBe('Attention');
    expect(vitalFlag(115, 72, 'Attention')).toBe('elevated');
    expect(vitalFlag(15, 32, 'Attention')).toBe('low');
  });
});
