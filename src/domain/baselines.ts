/**
 * Personal baseline z-score / band. Crew values are SIMULATION;
 * comparison uses that person's own pre-mission baseline, not a population table.
 */
export type BaselineBand = 'inside' | 'caution' | 'off';

export interface BaselineCompare {
  value: number;
  baseline: number;
  sigma: number;
  z: number;
  band: BaselineBand;
  /** |z| thresholds: caution ≥1.5, off ≥2.5 — demo policy, not a NASA table. */
  policy: 'demo-z-1.5-2.5';
}

export function personalZ(value: number, baseline: number, sigma: number): BaselineCompare | null {
  if (!Number.isFinite(value) || !Number.isFinite(baseline) || !Number.isFinite(sigma) || sigma <= 0) {
    return null;
  }
  const z = (value - baseline) / sigma;
  const az = Math.abs(z);
  const band: BaselineBand = az >= 2.5 ? 'off' : az >= 1.5 ? 'caution' : 'inside';
  return { value, baseline, sigma, z, band, policy: 'demo-z-1.5-2.5' };
}

/** Default sigma as a fraction of baseline when no personal SD is recorded (SIMULATION). */
export function defaultSigma(baseline: number, fraction = 0.08): number {
  return Math.max(1e-6, Math.abs(baseline) * fraction);
}
