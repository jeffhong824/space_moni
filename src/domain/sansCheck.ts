/**
 * Weekly SANS vision self-check (Amsler-style + logMAR).
 * Risk: HRP SANS-101 / SANS-404. Values are crew-entered SIMULATION, not OCT.
 */
export const SANS_CITE = {
  id: 'SANS-101',
  doc: 'HRP Risk Approach Plans, June 2026 — SANS',
  text: 'SANS-101: Characterize the temporal profile and magnitude of ocular and brain manifestations. SANS-404: Develop and test candidate monitoring technologies for SANS. IRP-47065 §4.3.9.',
};

export interface SansEntry {
  at: string;
  crewId: string;
  /** Distortion / scotoma on Amsler analog: 0 none … 3 severe. */
  amsler: 0 | 1 | 2 | 3;
  logMarOd: number;
  logMarOs: number;
  notes?: string;
}

export type SansFlag = 'ok' | 'watch' | 'refer';

export function flagSans(entry: SansEntry, prior?: SansEntry | null): { flag: SansFlag; reasons: string[] } {
  const reasons: string[] = [];
  if (entry.amsler >= 2) reasons.push('Amsler analog ≥2 (distortion/scotoma)');
  const worse = Math.max(entry.logMarOd, entry.logMarOs);
  if (worse >= 0.3) reasons.push('logMAR ≥0.3 in either eye');
  if (prior) {
    const dOd = entry.logMarOd - prior.logMarOd;
    const dOs = entry.logMarOs - prior.logMarOs;
    if (dOd >= 0.2 || dOs >= 0.2) reasons.push('logMAR worsened ≥0.2 vs last check');
  }
  if (entry.amsler >= 3 || worse >= 0.5) return { flag: 'refer', reasons };
  if (reasons.length) return { flag: 'watch', reasons };
  return { flag: 'ok', reasons: [] };
}
