/**
 * Habit streak: self-log + countermeasures + mood check-in + daily prompts.
 * Persisted per account. Guest overlay is hidden in UI.
 */
export type StreakKind = 'selfLog' | 'countermeasure' | 'checkin' | 'prompt';

export interface DayTicks {
  selfLog?: boolean;
  countermeasure?: boolean;
  checkin?: boolean;
  prompt?: boolean;
}

export function streakKey(account: string): string {
  return `spacemoni.streak.${account}`;
}

export interface StreakStore {
  days: Record<string, DayTicks>;
}

function read(account: string): StreakStore {
  try {
    const raw = localStorage.getItem(streakKey(account));
    if (!raw) return { days: {} };
    return JSON.parse(raw) as StreakStore;
  } catch {
    return { days: {} };
  }
}

function write(account: string, store: StreakStore) {
  try {
    localStorage.setItem(streakKey(account), JSON.stringify(store));
  } catch {
    /* quota */
  }
}

export function tickStreak(account: string, dayIso: string, kind: StreakKind) {
  const store = read(account);
  const day = store.days[dayIso] ?? {};
  day[kind] = true;
  store.days[dayIso] = day;
  write(account, store);
}

export function todayProgress(account: string, dayIso: string): { done: number; total: number; ticks: DayTicks } {
  const ticks = read(account).days[dayIso] ?? {};
  const done = (['selfLog', 'countermeasure', 'checkin', 'prompt'] as const).filter((k) => ticks[k]).length;
  return { done, total: 4, ticks };
}

function previousIso(dayIso: string): string {
  const [y, m, d] = dayIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

export function streakDays(account: string, dayIso: string): number {
  const store = read(account);
  let n = 0;
  let cursor = dayIso;
  for (let i = 0; i < 400; i++) {
    const ticks = store.days[cursor];
    const done = ticks ? (['selfLog', 'countermeasure', 'checkin', 'prompt'] as const).filter((k) => ticks[k]).length : 0;
    if (done === 0) break;
    n += 1;
    cursor = previousIso(cursor);
  }
  return n;
}
