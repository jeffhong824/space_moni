import { describe, expect, it } from 'vitest';
import {
  MOON_ONE_WAY_S,
  classifyAction,
  delayFromAu,
  earthDelayForKind,
  formatDelay,
  queueEtaMs,
} from './earthDelay.ts';

describe('earth delay', () => {
  it('LEO is ~0 s', () => {
    const d = earthDelayForKind('leo-station');
    expect(d.oneWaySec).toBe(0);
    expect(d.earthIndependent).toBe(false);
    expect(d.method).toBe('leo-negligible');
  });

  it('Moon south pole is ~1.28 s one-way', () => {
    const d = earthDelayForKind('lunar-south-pole');
    expect(d.oneWaySec).toBeCloseTo(1.282, 2);
    expect(d.oneWaySec).toBeCloseTo(MOON_ONE_WAY_S, 6);
    expect(d.earthIndependent).toBe(true);
    expect(d.method).toBe('moon-light-time');
  });

  it('Mars uses simulated AU clamped 4–22 min unless overridden', () => {
    const near = earthDelayForKind('mars-transit', 0.3);
    expect(near.oneWaySec).toBe(4 * 60);
    const far = earthDelayForKind('mars-transit', 3.0);
    expect(far.oneWaySec).toBe(22 * 60);
    const mid = earthDelayForKind('mars-transit', 1.5);
    expect(mid.oneWaySec).toBeCloseTo(delayFromAu(1.5), 0);
    expect(mid.method).toBe('mars-sim-au');
    const over = earthDelayForKind('mars-transit', 1.5, 500);
    expect(over.oneWaySec).toBe(500);
    expect(over.method).toBe('mars-override');
  });

  it('splits crew-autonomous vs ground sign-off', () => {
    expect(classifyAction('shelter')).toBe('crew_autonomous');
    expect(classifyAction('hydrate')).toBe('crew_autonomous');
    expect(classifyAction('eva_go')).toBe('needs_ground');
    expect(classifyAction('medevac')).toBe('needs_ground');
  });

  it('queues a countdown to ground delivery', () => {
    expect(queueEtaMs(10, 1_000, 6_000)).toBe(5_000);
    expect(queueEtaMs(10, 1_000, 20_000)).toBe(0);
    expect(formatDelay(1.28)).toContain('s');
  });
});
