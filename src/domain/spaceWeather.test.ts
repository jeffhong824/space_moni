import { describe, expect, it } from 'vitest';
import { combineRadiationRisk, goesClassToRScale } from './spaceWeather';

describe('NOAA R-scale from GOES X-ray peak', () => {
  const cases: Array<[string | null, string]> = [
    ['C9.9', 'R0'],
    ['M1.0', 'R1'],
    ['M4.9', 'R1'],
    ['M5.0', 'R2'],
    ['X1.0', 'R3'],
    ['X9.9', 'R3'],
    ['X10', 'R4'],
    ['X20', 'R5'],
    ['', 'R?'],
    [null, 'R?'],
  ];

  it.each(cases)('%s → %s', (input, expected) => {
    expect(goesClassToRScale(input).code).toBe(expected);
  });

  it('does not treat C-class as Moderate radiation risk', () => {
    const { risk } = combineRadiationRisk(2, 'C9.9', 0.1);
    expect(risk).toBe('Low');
  });
});
