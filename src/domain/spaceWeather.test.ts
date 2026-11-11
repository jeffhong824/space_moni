import { describe, expect, it } from 'vitest';
import {
  GOES_FLARE_SOURCE_LABEL,
  combineRadiationRisk,
  flareFromGoesXray,
  fluxToGoesClass,
  goesClassToRScale,
  type GoesXrayObservation,
} from './spaceWeather';

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

describe('GOES-derived flare class (not DONKI FLR)', () => {
  it('labels NOAA GOES as the source', () => {
    const obs: GoesXrayObservation = {
      flux: 1.2e-4,
      fluxUnit: 'W/m²',
      energyBand: '0.1-0.8nm',
      satellite: 'GOES-18',
      goesClass: fluxToGoesClass(1.2e-4),
      observedAt: '2026-11-11T08:00:00Z',
      sourceId: 'noaa-goes-xray',
    };
    const flare = flareFromGoesXray(obs);
    expect(flare).not.toBeNull();
    expect(flare!.classType.startsWith('X')).toBe(true);
    expect(flare!.catalog).toBe('noaa-goes-xray');
    expect(flare!.sourceLocation).toBe(GOES_FLARE_SOURCE_LABEL);
    expect(flare!.sourceLocation).toContain('not NASA DONKI FLR');
  });

  it('returns null when GOES X-ray is missing', () => {
    expect(flareFromGoesXray(null)).toBeNull();
  });
});
