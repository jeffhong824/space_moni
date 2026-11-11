/**
 * Post-landing orthostatic / sensorimotor readiness (Moon or Mars).
 * [V2 7042] orthostatic intolerance countermeasures.
 * SM-106 / SM-206: postural control after G transitions, egress guidelines.
 * Scores are SIMULATION stand-test analogs.
 */
export const EGRESS_CITE = {
  id: 'V2 7042',
  doc: 'NASA-STD-3001 Volume 2 Rev F §7.4.3',
  text: 'The system shall provide countermeasures to mitigate the effects of orthostatic intolerance when transitioning from weightlessness to gravity environments.',
};

export const SM_106 = {
  id: 'SM-106',
  doc: 'HRP Risk Approach Plans, June 2026 — Sensorimotor',
  text: 'Characterize effects of spaceflight on postural control and locomotion after G transitions that impact egress and early IVA/EVA.',
};

export interface EgressScores {
  orthostatic: number;
  balance: number;
  grip: number;
  vision: number;
}

export type GoNoGo = 'go' | 'conditional' | 'no-go';

export interface EgressTask {
  id: string;
  label: string;
  verdict: GoNoGo;
}

export function simulatedEgressScores(opts: {
  hr: number;
  baselineHr: number;
  spo2: number;
  missionDays: number;
}): EgressScores {
  const ortho = Math.max(18, Math.min(98, 92 - Math.max(0, opts.hr - opts.baselineHr) * 1.8 - opts.missionDays * 0.04));
  const balance = Math.max(20, Math.min(96, 88 - opts.missionDays * 0.05));
  const grip = Math.max(25, Math.min(96, 90 - opts.missionDays * 0.03));
  const vision = Math.max(30, Math.min(97, opts.spo2 - 8));
  return { orthostatic: ortho, balance, grip, vision };
}

export type EgressMode = 'landing' | 'return';

export function egressVerdict(
  scores: EgressScores,
  mode: EgressMode = 'landing'
): { overall: GoNoGo; tasks: EgressTask[]; reasons: string[]; mode: EgressMode } {
  const reasons: string[] = [];
  const band = (n: number): GoNoGo => (n >= 70 ? 'go' : n >= 50 ? 'conditional' : 'no-go');
  const tasks: EgressTask[] = [
    { id: 'stand', label: 'Unassisted stand / walk to airlock', verdict: band(Math.min(scores.orthostatic, scores.balance)) },
    { id: 'hatch', label: 'Hatch / suit donning (grip + vision)', verdict: band(Math.min(scores.grip, scores.vision)) },
  ];
  if (mode === 'landing') {
    tasks.push({
      id: 'eva',
      label: 'Early surface EVA',
      verdict: band(Math.min(scores.orthostatic, scores.balance, scores.grip, scores.vision)),
    });
  } else {
    tasks.push({
      id: 'earth',
      label: 'Return-to-Earth egress',
      verdict: band(Math.min(scores.orthostatic, scores.balance, scores.grip)),
    });
  }
  if (scores.orthostatic < 50) reasons.push('orthostatic analog below 50');
  if (scores.balance < 50) reasons.push('balance analog below 50');
  if (scores.vision < 50) reasons.push('vision analog below 50');
  const worst = tasks.some((t) => t.verdict === 'no-go')
    ? 'no-go'
    : tasks.some((t) => t.verdict === 'conditional')
      ? 'conditional'
      : 'go';
  return { overall: worst, tasks, reasons, mode };
}

export function egressModeForKind(kind: string): EgressMode {
  if (kind === 'lunar-south-pole' || kind === 'lunar-habitat' || kind === 'mars-transit') return 'landing';
  return 'return';
}
