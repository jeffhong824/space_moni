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

export function goesClassToRScale(goesClass: string): { code: string; labelZh: string } {
  const letter = (goesClass || 'A').charAt(0).toUpperCase();
  if (letter === 'X') return { code: 'R3+', labelZh: '強或以上無線電黑障（X 級閃焰通量）' };
  if (letter === 'M') return { code: 'R2', labelZh: '中等無線電黑障（M 級閃焰通量）' };
  if (letter === 'C') return { code: 'R1', labelZh: '輕微無線電黑障（C 級閃焰通量）' };
  return { code: 'R0', labelZh: '低於無線電黑障門檻' };
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

export function combineRadiationRisk(kp: number | null, goesClass: string | null, pfu: number | null): {
  risk: RadiationRisk;
  basisZh: string;
} {
  const g = kp != null ? kpToGScale(kp).code : 'G?';
  const r = goesClass ? goesClassToRScale(goesClass).code : 'R?';
  const s = pfu != null ? protonToSScale(pfu).code : 'S?';
  const gN = Number(g.slice(1)) || 0;
  const rN = r.startsWith('R3') ? 3 : Number(r.slice(1)) || 0;
  const sN = Number(s.slice(1)) || 0;
  const letter = (goesClass || 'A').charAt(0);

  let risk: RadiationRisk = 'Low';
  if (gN >= 3 || sN >= 2 || letter === 'X') risk = 'Severe';
  else if (gN >= 2 || sN >= 1 || letter === 'M') risk = 'High';
  else if (gN >= 1 || letter === 'C') risk = 'Moderate';

  return {
    risk,
    basisZh: `依 NOAA 尺度推估：地磁 ${g}、無線電 ${r}、太陽輻射 ${s}。以 GOES / SWPC 觀測為準，非推估填補。`,
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
