import { describe, expect, it } from 'vitest';
import { SCIENCE_ROWS } from './scienceTrace.ts';
import { analogI4Crew, OSDR_I4 } from '../data/osdrInspiration4.ts';

describe('science traceability', () => {
  it('covers the eight research-brief features plus SPE/OSDR provenance', () => {
    expect(SCIENCE_ROWS.length).toBeGreaterThanOrEqual(8);
    const features = SCIENCE_ROWS.map((r) => r.feature).join(' ');
    expect(features).toMatch(/EIHSO-202/);
    expect(features).toMatch(/SPE/);
    expect(features).toMatch(/Inspiration4|OSDR/i);
    expect(SCIENCE_ROWS.every((r) => ['LIVE', 'SOURCED-STATIC', 'SIMULATION', 'ASSUMPTION'].includes(r.provenance))).toBe(
      true
    );
  });
});

describe('OSDR Inspiration4 analog', () => {
  it('maps simulated crew onto anonymized C001–C004 and keeps timepoints', () => {
    expect(OSDR_I4.osdCbc.id).toBe('OSD-569');
    expect(OSDR_I4.osdSerum.id).toBe('OSD-575');
    expect(OSDR_I4.timepoints).toEqual(['L-92', 'L-44', 'L-3', 'R+1', 'R+45', 'R+82', 'R+194']);
    expect(analogI4Crew('astro-alice')).toMatch(/^C00[1-4]$/);
    expect(OSDR_I4.crew.C001.length).toBe(OSDR_I4.timepoints.length);
  });
});
