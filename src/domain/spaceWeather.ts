/**
 * Official space-environment types and classification.
 * Observations come from NOAA SWPC / GOES (live) and NASA DONKI (event catalog).
 * Empty catalogs and failed fetches must remain empty — never fabricate events.
 */

export type SourceStatus = 'ok' | 'empty' | 'timeout' | 'error' | 'skipped';
export type RadiationRisk = 'Low' | 'Moderate' | 'High' | 'Severe' | 'Unknown';
export type FeedOverall = 'ok' | 'partial' | 'unavailable';
export type NasaKeyMode = 'nasa_api_key' | 'demo_key';

export interface DataSourceReport {
  id: string;
  name: string;
  agency: 'NOAA' | 'NASA';
  endpoint: string;
  docsUrl: string;
  status: SourceStatus;
  observedAt: string | null;
  fetchedAt: string;
  latencyMs: number;
  noteZh: string;
}

export interface KpObservation {
  value: number;
  estimated?: number;
  unit: 'Kp';
  observedAt: string;
  sourceId: string;
}

export interface GoesXrayObservation {
  flux: number;
  fluxUnit: 'W/m²';
  energyBand: string;
  satellite: string;
  goesClass: string;
  observedAt: string;
  sourceId: string;
}

export interface SolarWindObservation {
  speed: number;
  unit: 'km/s';
  observedAt: string;
  sourceId: string;
}

export interface ProtonObservation {
  flux: number;
  unit: 'pfu';
  energy: string;
  satellite: string;
  observedAt: string;
  sourceId: string;
}

export interface DonkiFlare {
  flrID: string;
  beginTime: string | null;
  peakTime: string | null;
  classType: string;
  sourceLocation: string | null;
}

export interface DonkiStorm {
  gstID: string;
  startTime: string | null;
  kpIndex: number | null;
}

export interface DonkiCme {
  activityID: string;
  startTime: string | null;
  note: string | null;
}

export interface SwpcAlert {
  productId: string;
  issueDatetime: string;
  headline: string;
}

export interface SpaceEnvironmentPayload {
  fetchedAt: string;
  windowStart: string;
  windowEnd: string;
  overallStatus: FeedOverall;
  nasaKeyMode: NasaKeyMode;
  cache: { hit: boolean; ttlSeconds: number };
  sources: DataSourceReport[];
  observations: {
    kp: KpObservation | null;
    goesXray: GoesXrayObservation | null;
    solarWind: SolarWindObservation | null;
    protons: ProtonObservation | null;
  };
  scales: {
    gScale: string;
    rScale: string;
    sScale: string;
    radiationRisk: RadiationRisk;
    basisZh: string;
  };
  events: {
    solarFlares: DonkiFlare[];
    geomagneticStorms: DonkiStorm[];
    coronalMassEjections: DonkiCme[];
    swpcAlerts: SwpcAlert[];
  };
  notices: string[];
}

/** NOAA G-scale from planetary Kp (https://www.swpc.noaa.gov/noaa-scales-explanation). */
export function kpToGScale(kp: number): { code: string; labelZh: string } {
  if (kp >= 9) return { code: 'G5', labelZh: '極端地磁暴' };
  if (kp >= 8) return { code: 'G4', labelZh: '強烈地磁暴' };
  if (kp >= 7) return { code: 'G3', labelZh: '強地磁暴' };
  if (kp >= 6) return { code: 'G2', labelZh: '中等地磁暴' };
  if (kp >= 5) return { code: 'G1', labelZh: '輕微地磁暴' };
  return { code: 'G0', labelZh: '低於地磁暴門檻' };
}

/** GOES long-channel X-ray class from 0.1–0.8 nm flux (W/m²). */
export function fluxToGoesClass(flux: number): string {
  if (!Number.isFinite(flux) || flux <= 0) return 'N/A';
  const bands: Array<[string, number]> = [
    ['X', 1e-4],
    ['M', 1e-5],
    ['C', 1e-6],
    ['B', 1e-7],
    ['A', 1e-8],
  ];
  for (const [letter, base] of bands) {
    if (flux >= base) {
      const scale = flux / base;
      return `${letter}${scale >= 9.95 ? scale.toFixed(0) : scale.toFixed(1)}`;
    }
  }
  return 'A0.0';
}

export function parseGoesClass(goesClass: string | null | undefined): { letter: string; magnitude: number } | null {
  if (goesClass == null) return null;
  const trimmed = String(goesClass).trim();
  if (!trimmed) return null;
  const match = trimmed.toUpperCase().match(/^([ABCMX])\s*([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return null;
  return { letter: match[1], magnitude: Number(match[2]) };
}

/**
 * NOAA R-scale from GOES X-ray peak class
 * (https://www.swpc.noaa.gov/noaa-scales-explanation):
 * M1 = R1, M5 = R2, X1 = R3, X10 = R4, X20 = R5.
 * C-class and weaker is below R1 → R0. Empty input → R?.
 */
export function goesClassToRScale(goesClass: string | null | undefined): { code: string; labelZh: string } {
  if (goesClass == null || String(goesClass).trim() === '') {
    return { code: 'R?', labelZh: '無 GOES X 射線峰值，無法判定 R 尺度' };
  }
  const parsed = parseGoesClass(goesClass);
  if (!parsed) {
    return { code: 'R?', labelZh: '無法解析 GOES 等級' };
  }
  const { letter, magnitude } = parsed;
  if (letter === 'X') {
    if (magnitude >= 20) return { code: 'R5', labelZh: '極端無線電黑障（X20 級以上）' };
    if (magnitude >= 10) return { code: 'R4', labelZh: '強烈無線電黑障（X10 級以上）' };
    return { code: 'R3', labelZh: '強無線電黑障（X1 級以上）' };
  }
  if (letter === 'M') {
    if (magnitude >= 5) return { code: 'R2', labelZh: '中等無線電黑障（M5 級以上）' };
    return { code: 'R1', labelZh: '輕微無線電黑障（M1 級以上）' };
  }
  return { code: 'R0', labelZh: '低於無線電黑障門檻（C 級或更弱）' };
}

/** NOAA S-scale from ≥10 MeV proton flux (pfu). */
export function protonToSScale(pfu: number): { code: string; labelZh: string } {
  if (pfu >= 100000) return { code: 'S5', labelZh: '極端太陽輻射暴' };
  if (pfu >= 10000) return { code: 'S4', labelZh: '強烈太陽輻射暴' };
  if (pfu >= 1000) return { code: 'S3', labelZh: '強太陽輻射暴' };
  if (pfu >= 100) return { code: 'S2', labelZh: '中等太陽輻射暴' };
  if (pfu >= 10) return { code: 'S1', labelZh: '輕微太陽輻射暴' };
  return { code: 'S0', labelZh: '低於太陽輻射暴門檻' };
}

export function scaleNumber(code: string | null | undefined, prefix: 'G' | 'R' | 'S'): number | null {
  if (!code || code.endsWith('?')) return null;
  const match = new RegExp(`^${prefix}(\\d)`).exec(code);
  if (!match) return null;
  return Number(match[1]);
}

export function sScaleElevated(code: string | null | undefined): boolean {
  const n = scaleNumber(code, 'S');
  return n != null && n >= 1;
}

export function combineRadiationRisk(kp: number | null, goesClass: string | null, pfu: number | null): {
  risk: RadiationRisk;
  basisZh: string;
} {
  const g = kp != null ? kpToGScale(kp).code : 'G?';
  const r = goesClass ? goesClassToRScale(goesClass).code : 'R?';
  const s = pfu != null ? protonToSScale(pfu).code : 'S?';
  const gN = scaleNumber(g, 'G') ?? 0;
  const rN = scaleNumber(r, 'R') ?? 0;
  const sN = scaleNumber(s, 'S') ?? 0;

  let risk: RadiationRisk = 'Low';
  if (gN >= 3 || sN >= 2 || rN >= 3) risk = 'Severe';
  else if (gN >= 2 || sN >= 1 || rN >= 2) risk = 'High';
  else if (gN >= 1 || rN >= 1) risk = 'Moderate';

  return {
    risk,
    basisZh: `依 NOAA 尺度推估：地磁 ${g}、無線電 ${r}、太陽輻射 ${s}。以 GOES / SWPC 觀測為準，非推估填補。`,
  };
}

export const DEMO_SPE_NOTICE =
  '示範太陽質子事件（SPE）情境：≥10 MeV 質子通量為示範疊加，不是 NOAA 即時觀測。Kp／X 射線若存在仍為官方讀數。';

const DEMO_SPE_PFU = 120; // S2 (≥100 pfu) — labeled 示範, not a live NOAA number

function emptyDemoPayload(now: string): SpaceEnvironmentPayload {
  return {
    fetchedAt: now,
    windowStart: now,
    windowEnd: now,
    overallStatus: 'unavailable',
    nasaKeyMode: 'demo_key',
    cache: { hit: false, ttlSeconds: 0 },
    sources: [],
    observations: { kp: null, goesXray: null, solarWind: null, protons: null },
    scales: {
      gScale: 'G?',
      rScale: 'R?',
      sScale: 'S?',
      radiationRisk: 'Unknown',
      basisZh: '官方饋送尚未載入。',
    },
    events: { solarFlares: [], geomagneticStorms: [], coronalMassEjections: [], swpcAlerts: [] },
    notices: [],
  };
}

/** Overlay a labeled 示範 SPE. Does not invent NOAA Kp / X-ray numbers. */
export function overlayDemoSpe(payload: SpaceEnvironmentPayload | null): SpaceEnvironmentPayload {
  const now = new Date().toISOString();
  const base = payload ?? emptyDemoPayload(now);
  const demoProtons: ProtonObservation = {
    flux: DEMO_SPE_PFU,
    unit: 'pfu',
    energy: '≥10 MeV',
    satellite: '示範 SPE',
    observedAt: now,
    sourceId: 'demo-spe-scenario',
  };
  const s = protonToSScale(DEMO_SPE_PFU);
  const g = base.observations.kp ? kpToGScale(base.observations.kp.value) : { code: 'G?', labelZh: '無 Kp' };
  const r = base.observations.goesXray
    ? goesClassToRScale(base.observations.goesXray.goesClass)
    : { code: 'R?', labelZh: '無 X 射線' };
  const combined = combineRadiationRisk(
    base.observations.kp?.value ?? null,
    base.observations.goesXray?.goesClass ?? null,
    DEMO_SPE_PFU
  );
  return {
    ...base,
    observations: { ...base.observations, protons: demoProtons },
    scales: {
      gScale: g.code,
      rScale: r.code,
      sScale: s.code,
      radiationRisk: combined.risk,
      basisZh: `${DEMO_SPE_NOTICE} ${combined.basisZh}`,
    },
    notices: [DEMO_SPE_NOTICE, ...base.notices.filter((n) => n !== DEMO_SPE_NOTICE)],
  };
}

export function snapshotForAi(payload: SpaceEnvironmentPayload | null) {
  if (!payload) return null;
  return {
    fetchedAt: payload.fetchedAt,
    overallStatus: payload.overallStatus,
    kp: payload.observations.kp,
    goesXray: payload.observations.goesXray,
    solarWind: payload.observations.solarWind,
    protons: payload.observations.protons,
    radiationRisk: payload.scales.radiationRisk,
    scales: payload.scales,
    donkiAvailable: payload.sources.some((s) => s.id.startsWith('nasa-donki') && s.status === 'ok'),
    notices: payload.notices,
  };
}
