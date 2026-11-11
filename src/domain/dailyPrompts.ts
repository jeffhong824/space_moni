/**
 * In-app measurement prompts (no push / email).
 * Morning vitals 07:30, pre-exercise BP/HR, evening log 21:00.
 */
export type PromptId = 'morning' | 'preExercise' | 'evening';
export type PromptState = 'due' | 'done' | 'missed';

export interface DailyPrompt {
  id: PromptId;
  dueMin: number;
  labelKey: string;
}

export const DAILY_PROMPTS: DailyPrompt[] = [
  { id: 'morning', dueMin: 7 * 60 + 30, labelKey: 'prompt.morning' },
  { id: 'preExercise', dueMin: 16 * 60, labelKey: 'prompt.preExercise' },
  { id: 'evening', dueMin: 21 * 60, labelKey: 'prompt.evening' },
];

export const SNOOZE_MS = 30 * 60 * 1000;

export function promptsKey(account: string, dayIso: string): string {
  return `spacemoni.prompts.${account}.${dayIso}`;
}

export interface PromptStore {
  done: Partial<Record<PromptId, string>>;
  snoozeUntil: Partial<Record<PromptId, number>>;
}

function readStore(account: string, dayIso: string): PromptStore {
  try {
    const raw = localStorage.getItem(promptsKey(account, dayIso));
    if (!raw) return { done: {}, snoozeUntil: {} };
    return JSON.parse(raw) as PromptStore;
  } catch {
    return { done: {}, snoozeUntil: {} };
  }
}

function writeStore(account: string, dayIso: string, store: PromptStore) {
  try {
    localStorage.setItem(promptsKey(account, dayIso), JSON.stringify(store));
  } catch {
    /* quota */
  }
}

export function promptState(
  account: string,
  dayIso: string,
  id: PromptId,
  nowMin: number,
  nowMs = Date.now()
): PromptState {
  const store = readStore(account, dayIso);
  if (store.done[id]) return 'done';
  const def = DAILY_PROMPTS.find((p) => p.id === id)!;
  if (nowMin < def.dueMin) return 'due';
  const snooze = store.snoozeUntil[id] ?? 0;
  if (nowMs < snooze) return 'due';
  if (nowMin > def.dueMin + 90) return 'missed';
  return 'due';
}

export function duePrompts(account: string, dayIso: string, nowMin: number, nowMs = Date.now()): DailyPrompt[] {
  return DAILY_PROMPTS.filter((p) => {
    if (nowMin < p.dueMin) return false;
    const state = promptState(account, dayIso, p.id, nowMin, nowMs);
    if (state !== 'due') return false;
    const store = readStore(account, dayIso);
    const snooze = store.snoozeUntil[p.id] ?? 0;
    return nowMs >= snooze;
  });
}

export function markPromptDone(account: string, dayIso: string, id: PromptId, atIso: string) {
  const store = readStore(account, dayIso);
  store.done[id] = atIso;
  writeStore(account, dayIso, store);
}

export function snoozePrompt(account: string, dayIso: string, id: PromptId, nowMs = Date.now()) {
  const store = readStore(account, dayIso);
  store.snoozeUntil[id] = nowMs + SNOOZE_MS;
  writeStore(account, dayIso, store);
}
