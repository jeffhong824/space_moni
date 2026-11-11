import raw from './osdrInspiration4.json';

export const OSDR_I4 = raw as {
  osdCbc: { id: string; url: string; title: string };
  osdSerum: { id: string; url: string; title: string };
  mission: string;
  timepoints: string[];
  crew: Record<string, Array<Record<string, number | string | null>>>;
  mean: Array<Record<string, number | string | null>>;
};

export const OSDR_CREW_IDS = ['C001', 'C002', 'C003', 'C004'] as const;

/** Map a simulated crew id onto an anonymized I4 series for overlay — not identity. */
export function analogI4Crew(crewId: string): (typeof OSDR_CREW_IDS)[number] {
  let h = 0;
  for (const ch of crewId) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return OSDR_CREW_IDS[h % 4];
}
