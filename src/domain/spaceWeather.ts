/**
 * Official space-environment types and classification.
 * Observations come from NOAA SWPC / GOES (live) and NASA DONKI (event catalog).
 * Empty catalogs and failed fetches must remain empty — never fabricate events.
 */

export type SourceStatus = 'ok' | 'empty' | 'timeout' | 'error' | 'skipped' | 'degraded';
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
  /** GOES-derived class is not a DONKI FLR record. */
  catalog?: 'noaa-goes-xray' | 'nasa-donki-flr';
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

export interface DonkiSep {
  sepID: string;
  eventTime: string | null;
  instruments: string | null;
}

export interface DonkiNotification {
  messageID: string;
  messageType: string | null;
  messageIssueTime: string | null;
  messageURL: string | null;
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
    /** GOES ≥100 MeV integral protons when the feed provides that energy band. */
    protons100?: ProtonObservation | null;
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
    solarEnergeticParticles?: DonkiSep[];
    donkiNotifications?: DonkiNotification[];
    swpcAlerts: SwpcAlert[];
  };
  notices: string[];
}

/** NOAA G-scale from planetary Kp (https://www.swpc.noaa.gov/noaa-scales-explanation). */
export function kpToGScale(kp: number): { code: string; labelKey: string } {
  if (kp >= 9) return { code: 'G5', labelKey: 'wx.g5' };
  if (kp >= 8) return { code: 'G4', labelKey: 'wx.g4' };
  if (kp >= 7) return { code: 'G3', labelKey: 'wx.g3' };
  if (kp >= 6) return { code: 'G2', labelKey: 'wx.g2' };
  if (kp >= 5) return { code: 'G1', labelKey: 'wx.g1' };
  return { code: 'G0', labelKey: 'wx.g0' };
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

/** Accurate source label: class comes from NOAA GOES, not NASA DONKI FLR. */
export const GOES_FLARE_SOURCE_LABEL =
  'NOAA GOES X-ray flux (0.1–0.8 nm); not NASA DONKI FLR';

/** Derive a flare-class row from live GOES X-ray. Does not invent a DONKI FLR event. */
export function flareFromGoesXray(obs: GoesXrayObservation | null): DonkiFlare | null {
  if (!obs || !Number.isFinite(obs.flux)) return null;
  return {
    flrID: `goes-xray-${obs.observedAt}`,
    beginTime: obs.observedAt,
    peakTime: obs.observedAt,
    classType: obs.goesClass || fluxToGoesClass(obs.flux),
    sourceLocation: GOES_FLARE_SOURCE_LABEL,
    catalog: 'noaa-goes-xray',
  };
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
export function goesClassToRScale(goesClass: string | null | undefined): { code: string; labelKey: string } {
  if (goesClass == null || String(goesClass).trim() === '') {
    return { code: 'R?', labelKey: 'wx.rUnknown' };
  }
  const parsed = parseGoesClass(goesClass);
  if (!parsed) {
    return { code: 'R?', labelKey: 'wx.rParse' };
  }
  const { letter, magnitude } = parsed;
  if (letter === 'X') {
    if (magnitude >= 20) return { code: 'R5', labelKey: 'wx.r5' };
    if (magnitude >= 10) return { code: 'R4', labelKey: 'wx.r4' };
    return { code: 'R3', labelKey: 'wx.r3' };
  }
  if (letter === 'M') {
    if (magnitude >= 5) return { code: 'R2', labelKey: 'wx.r2' };
    return { code: 'R1', labelKey: 'wx.r1' };
  }
  return { code: 'R0', labelKey: 'wx.r0' };
}

/** NOAA S-scale from ≥10 MeV proton flux (pfu). */
export function protonToSScale(pfu: number): { code: string; labelKey: string } {
  if (pfu >= 100000) return { code: 'S5', labelKey: 'wx.s5' };
  if (pfu >= 10000) return { code: 'S4', labelKey: 'wx.s4' };
  if (pfu >= 1000) return { code: 'S3', labelKey: 'wx.s3' };
  if (pfu >= 100) return { code: 'S2', labelKey: 'wx.s2' };
  if (pfu >= 10) return { code: 'S1', labelKey: 'wx.s1' };
  return { code: 'S0', labelKey: 'wx.s0' };
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
    basisZh: `NOAA scales from GOES/SWPC: geomagnetic ${g}, radio ${r}, solar radiation ${s}. Observed, not interpolated.`,
  };
}

export type DonkiAggregate = {
  status: 'ok' | 'empty' | 'degraded' | 'error';
  observedAt: string | null;
  endpoints: Array<{ id: string; short: string; status: SourceStatus }>;
};

const DONKI_SHORT: Record<string, string> = {
  'nasa-donki-gst': 'GST',
  'nasa-donki-cme': 'CME',
  'nasa-donki-sep': 'SEP',
  'nasa-donki-notifications': 'notifications',
};

export function aggregateDonki(sources: DataSourceReport[]): DonkiAggregate {
  const endpoints = sources
    .filter((s) => s.id.startsWith('nasa-donki-'))
    .map((s) => ({
      id: s.id,
      short: DONKI_SHORT[s.id] ?? s.id.replace('nasa-donki-', ''),
      status: s.status,
    }));
  if (!endpoints.length) {
    return { status: 'error', observedAt: null, endpoints };
  }
  const ok = endpoints.filter((e) => e.status === 'ok');
  const empty = endpoints.filter((e) => e.status === 'empty');
  const bad = endpoints.filter((e) => e.status === 'timeout' || e.status === 'error');
  const observedAt =
    sources
      .filter((s) => s.id.startsWith('nasa-donki-') && s.status === 'ok')
      .map((s) => s.observedAt || s.fetchedAt)
      .sort()
      .at(-1) ?? null;
  if (ok.length > 0 && bad.length === 0) return { status: 'ok', observedAt, endpoints };
  if (ok.length > 0 && bad.length > 0) return { status: 'degraded', observedAt, endpoints };
  if (empty.length === endpoints.length) return { status: 'empty', observedAt: null, endpoints };
  if (ok.length === 0 && empty.length > 0 && bad.length > 0) return { status: 'degraded', observedAt: null, endpoints };
  return { status: 'error', observedAt: null, endpoints };
}

export const DEMO_SPE_NOTICE =
  'Demo solar-proton overlay: ≥10 MeV flux is a labeled scenario, not a live NOAA reading. Kp / X-ray remain official when present.';

const DEMO_SPE_PFU = 120; // S2 (>=100 pfu) — labeled demo, not a live NOAA number

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
      basisZh: 'Official feed not loaded.',
    },
    events: { solarFlares: [], geomagneticStorms: [], coronalMassEjections: [], swpcAlerts: [] },
    notices: [],
  };
}

/** Overlay a labeled demo SPE. Does not invent NOAA Kp / X-ray numbers. */
export function overlayDemoSpe(payload: SpaceEnvironmentPayload | null): SpaceEnvironmentPayload {
  const now = new Date().toISOString();
  const base = payload ?? emptyDemoPayload(now);
  const demoProtons: ProtonObservation = {
    flux: DEMO_SPE_PFU,
    unit: 'pfu',
    energy: '>=10 MeV',
    satellite: 'demo SPE',
    observedAt: now,
    sourceId: 'demo-spe-scenario',
  };
  const s = protonToSScale(DEMO_SPE_PFU);
  const g = base.observations.kp ? kpToGScale(base.observations.kp.value) : { code: 'G?', labelKey: 'wx.gUnknown' };
  const r = base.observations.goesXray
    ? goesClassToRScale(base.observations.goesXray.goesClass)
    : { code: 'R?', labelKey: 'wx.rUnknown' };
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
