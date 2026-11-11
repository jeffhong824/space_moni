/**
 * 30-second mood / team check-in.
 * Indicators follow HRP BH-201 and Team-201 (semi-autonomous BHP monitoring).
 * Scores are crew-entered SIMULATION, not clinical psychometrics.
 */
export const BH_201 = {
  id: 'BH-201',
  doc: 'HRP Risk Approach Plans, June 2026 — Behavioral Health',
  text: 'Identify indicators, measures, and thresholds, to inform semi-autonomous behavioral health and performance monitoring. Item 3: Recommendations for semi-autonomous monitoring system.',
};

export const TEAM_201 = {
  id: 'Team-201',
  doc: 'HRP Risk Approach Plans, June 2026 — Team Cohesion',
  text: 'Define indicators, measures, and thresholds, to inform semi-autonomous monitoring of team functioning and performance.',
};

export interface MoodCheckin {
  at: string;
  crewId: string;
  mood: 1 | 2 | 3 | 4 | 5;
  stress: 1 | 2 | 3 | 4 | 5;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  cohesion: 1 | 2 | 3 | 4 | 5;
  conflict: 1 | 2 | 3 | 4 | 5;
}

export type MoodFlag = 'ok' | 'watch' | 'concern';

/** BH-201 demo thresholds (not a NASA clinical cut-score). */
export function scoreCheckin(entry: MoodCheckin): { flag: MoodFlag; reasons: string[] } {
  const reasons: string[] = [];
  if (entry.mood <= 2) reasons.push('mood ≤2');
  if (entry.stress >= 4) reasons.push('stress ≥4');
  if (entry.sleepQuality <= 2) reasons.push('sleep quality ≤2');
  if (entry.cohesion <= 2) reasons.push('team cohesion ≤2');
  if (entry.conflict >= 4) reasons.push('conflict ≥4');
  if (reasons.length >= 2) return { flag: 'concern', reasons };
  if (reasons.length === 1) return { flag: 'watch', reasons };
  return { flag: 'ok', reasons: [] };
}

export function aggregateTeam(entries: MoodCheckin[]): {
  n: number;
  meanMood: number;
  meanStress: number;
  meanCohesion: number;
  meanConflict: number;
  flag: MoodFlag;
} | null {
  if (!entries.length) return null;
  const avg = (k: keyof MoodCheckin) => entries.reduce((s, e) => s + Number(e[k]), 0) / entries.length;
  const meanMood = avg('mood');
  const meanStress = avg('stress');
  const meanCohesion = avg('cohesion');
  const meanConflict = avg('conflict');
  let flag: MoodFlag = 'ok';
  if (meanMood <= 2.5 || meanStress >= 3.5 || meanCohesion <= 2.5 || meanConflict >= 3.5) flag = 'watch';
  if (meanMood <= 2 || meanStress >= 4 || meanCohesion <= 2 || meanConflict >= 4) flag = 'concern';
  return { n: entries.length, meanMood, meanStress, meanCohesion, meanConflict, flag };
}
