/**
 * EVA / DCS / dust / immune self-checks. No numeric medical thresholds.
 * Moderate/severe illness → Notify CMO (not a diagnosis).
 */
export type Severity = 'none' | 'mild' | 'moderate' | 'severe';

export const EVA_PRE_ITEMS = [
  { id: 'prebreathe', labelKey: 'eva.prebreathe', cite: 'HRR DCS ?i=168' },
  { id: 'dcsBrief', labelKey: 'eva.dcsBrief', cite: 'HRR DCS ?i=168' },
  { id: 'suitFit', labelKey: 'eva.suitFit', cite: 'HRR EVA ?i=84' },
] as const;

export const EVA_POST_ITEMS = [
  { id: 'skinJoint', labelKey: 'eva.skinJoint', cite: 'HRR DCS ?i=168' },
  { id: 'eyeNasalThroat', labelKey: 'eva.eyeNasal', cite: 'HRR dust ?i=82' },
  { id: 'handShoulder', labelKey: 'eva.handShoulder', cite: 'HRR dynamic loads ?i=167' },
] as const;

export const ILLNESS_ITEMS = [
  { id: 'fever', labelKey: 'eva.fever', cite: 'HRR immune ?i=85' },
  { id: 'soreThroat', labelKey: 'eva.soreThroat', cite: 'HRR host-microorganism ?i=80' },
  { id: 'skinInfection', labelKey: 'eva.skinInfection', cite: 'HRR immune ?i=85' },
] as const;

export interface EvaIllnessLog {
  at: string;
  crewId: string;
  pre: Record<string, boolean>;
  post: Record<string, Severity>;
  illness: Record<string, Severity>;
}

export function notifyCmo(log: EvaIllnessLog): boolean {
  const sev = (s: Severity) => s === 'moderate' || s === 'severe';
  return Object.values(log.post).some(sev) || Object.values(log.illness).some(sev);
}

const KEY = 'spacemoni.evaIllness';

export function loadEvaIllness(): EvaIllnessLog[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EvaIllnessLog[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEvaIllness(entry: EvaIllnessLog) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...loadEvaIllness(), entry].slice(-200)));
  } catch {
    /* quota */
  }
}
