import type { MoodCheckin } from '../domain/moodCheckin.ts';
import type { SansEntry } from '../domain/sansCheck.ts';

const MOOD_KEY = 'spacemoni.moodCheckins';
const SANS_KEY = 'spacemoni.sansChecks';
const CMO_KEY = 'spacemoni.cmoDecisions';
const MARS_DELAY_KEY = 'spacemoni.marsDelaySec';
const SHELTER_KEY = 'spacemoni.shelterTicks';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export function loadMoods(): MoodCheckin[] {
  return read(MOOD_KEY, [] as MoodCheckin[]);
}

export function saveMood(entry: MoodCheckin) {
  write(MOOD_KEY, [...loadMoods().filter((m) => !(m.crewId === entry.crewId && m.at === entry.at)), entry].slice(-400));
}

export function latestMood(crewId: string): MoodCheckin | undefined {
  return [...loadMoods()].reverse().find((m) => m.crewId === crewId);
}

export function moodsForShip(crewIds: string[], sinceIso?: string): MoodCheckin[] {
  const latestByCrew = new Map<string, MoodCheckin>();
  for (const m of loadMoods()) {
    if (!crewIds.includes(m.crewId)) continue;
    if (sinceIso && m.at < sinceIso) continue;
    const prev = latestByCrew.get(m.crewId);
    if (!prev || m.at > prev.at) latestByCrew.set(m.crewId, m);
  }
  return [...latestByCrew.values()];
}

export function loadSans(): SansEntry[] {
  return read(SANS_KEY, [] as SansEntry[]);
}

export function saveSans(entry: SansEntry) {
  write(SANS_KEY, [...loadSans(), entry].slice(-200));
}

export function sansHistory(crewId: string): SansEntry[] {
  return loadSans().filter((s) => s.crewId === crewId);
}

export type CmoDecision = 'confirmed' | 'dismissed';

export function cmoDecisions(): Record<string, CmoDecision> {
  return read(CMO_KEY, {} as Record<string, CmoDecision>);
}

export function setCmoDecision(id: string, d: CmoDecision) {
  write(CMO_KEY, { ...cmoDecisions(), [id]: d });
}

export function marsDelayOverride(): number | null {
  const n = read<number | null>(MARS_DELAY_KEY, null);
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

export function setMarsDelayOverride(sec: number | null) {
  if (sec == null) {
    try {
      localStorage.removeItem(MARS_DELAY_KEY);
    } catch {
      /* */
    }
    return;
  }
  write(MARS_DELAY_KEY, sec);
}

export function shelterTicks(): Record<string, boolean> {
  return read(SHELTER_KEY, {} as Record<string, boolean>);
}

export function toggleShelterTick(id: string) {
  const cur = shelterTicks();
  write(SHELTER_KEY, { ...cur, [id]: !cur[id] });
}
