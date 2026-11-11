import {
  combineRadiationRisk,
  flareFromGoesXray,
  fluxToGoesClass,
  goesClassToRScale,
  kpToGScale,
  protonToSScale,
  type DataSourceReport,
  type DonkiCme,
  type DonkiNotification,
  type DonkiSep,
  type DonkiStorm,
  type SourceStatus,
  type SpaceEnvironmentPayload,
  type SwpcAlert,
} from '../domain/spaceWeather.ts';
import { buildDonkiUrls, resolveNasaApiKey } from './envKeys.ts';

const CACHE_TTL_MS = 60_000;
let cache: { expiresAt: number; payload: SpaceEnvironmentPayload } | null = null;

interface FetchResult<T> {
  data: T | null;
  status: SourceStatus;
  latencyMs: number;
  observedAt: string | null;
  noteZh: string;
}

function firstInstrument(row: { instruments?: unknown }): string | null {
  const inst = row.instruments;
  if (Array.isArray(inst) && inst[0] && typeof inst[0] === 'object') {
    const name = (inst[0] as { displayName?: string }).displayName;
    return name ?? null;
  }
  return typeof inst === 'string' ? inst : null;
}

async function fetchJson<T>(url: string, timeoutMs: number): Promise<FetchResult<T>> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const latencyMs = Date.now() - started;
    if (!res.ok) {
      return {
        data: null,
        status: 'error',
        latencyMs,
        observedAt: null,
        noteZh: `HTTP ${res.status} ${res.statusText || ''}`.trim(),
      };
    }
    const data = (await res.json()) as T;
    const empty = Array.isArray(data) ? data.length === 0 : data == null;
    return {
      data,
      status: empty ? 'empty' : 'ok',
      latencyMs,
      observedAt: null,
      noteZh: empty ? '視窗內無事件或觀測（非填補資料）' : '已取得官方 JSON',
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - started;
    const name = err instanceof Error ? err.name : '';
    const message = err instanceof Error ? err.message : String(err);
    const timeout = name === 'TimeoutError' || name === 'AbortError' || /timeout/i.test(message);
    return {
      data: null,
      status: timeout ? 'timeout' : 'error',
      latencyMs,
      observedAt: null,
      noteZh: timeout ? `連線逾時（${timeoutMs} ms）` : message.slice(0, 180),
    };
  }
}

function lastOf<T>(arr: T[] | null | undefined): T | null {
  if (!arr || arr.length === 0) return null;
  return arr[arr.length - 1];
}

function alertHeadline(message: string): string {
  const line = message
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('Space Weather Message') && !l.startsWith('Serial') && !l.startsWith('Issue Time'));
  return (line || message).slice(0, 160);
}

export async function fetchSpaceEnvironment(forceRefresh = false): Promise<SpaceEnvironmentPayload> {
  if (!forceRefresh && cache && Date.now() < cache.expiresAt) {
    return { ...cache.payload, cache: { hit: true, ttlSeconds: Math.round((cache.expiresAt - Date.now()) / 1000) } };
  }

  const fetchedAt = new Date().toISOString();
  const windowEnd = fetchedAt.slice(0, 10);
  const windowStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { key, mode } = resolveNasaApiKey();
  const donki = buildDonkiUrls(windowStart, windowEnd, key);

  const kpUrl = 'https://services.swpc.noaa.gov/json/planetary_k_index_1m.json';
  const xrayUrl = 'https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json';
  const windUrl = 'https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json';
  const protonUrl = 'https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json';
  const alertUrl = 'https://services.swpc.noaa.gov/products/alerts.json';

  const [kpRes, xrayRes, windRes, protonRes, alertRes, gstRes, cmeRes, sepRes, notifRes] = await Promise.all([
    fetchJson<Array<{ time_tag: string; kp_index?: number; estimated_kp?: number }>>(kpUrl, 8000),
    fetchJson<Array<{ time_tag: string; satellite?: number; flux?: number; energy?: string }>>(xrayUrl, 8000),
    fetchJson<Array<{ proton_speed?: number; time_tag?: string }>>(windUrl, 8000),
    fetchJson<Array<{ time_tag: string; satellite?: number; flux?: number; energy?: string }>>(protonUrl, 8000),
    fetchJson<Array<{ product_id?: string; issue_datetime?: string; message?: string }>>(alertUrl, 8000),
    fetchJson<any[]>(donki.gst, 6000),
    fetchJson<any[]>(donki.cme, 6000),
    fetchJson<any[]>(donki.sep, 6000),
    fetchJson<any[]>(donki.notifications, 6000),
  ]);

  const kpLast = lastOf(kpRes.data);
  const longXray = (xrayRes.data || []).filter((row) => row.energy === '0.1-0.8nm');
  const xrayLast = lastOf(longXray.length ? longXray : xrayRes.data);
  const windLast = lastOf(windRes.data);
  const proton10 = (protonRes.data || []).filter((row) => (row.energy || '').includes('>=10 MeV'));
  const protonLast = lastOf(proton10.length ? proton10 : protonRes.data);

  const kpValue = kpLast?.estimated_kp ?? kpLast?.kp_index ?? null;
  const goesClass = xrayLast?.flux != null ? fluxToGoesClass(xrayLast.flux) : null;
  const pfu = protonLast?.flux ?? null;
  const scalesCombo = combineRadiationRisk(kpValue, goesClass, pfu);

  const sources: DataSourceReport[] = [
    {
      id: 'noaa-swpc-kp',
      name: 'NOAA SWPC Planetary K-index (1-min)',
      agency: 'NOAA',
      endpoint: kpUrl,
      docsUrl: 'https://www.swpc.noaa.gov/products/planetary-k-index',
      status: kpRes.status,
      observedAt: kpLast?.time_tag ?? null,
      fetchedAt,
      latencyMs: kpRes.latencyMs,
      noteZh: kpRes.noteZh,
    },
    {
      id: 'noaa-goes-xray',
      name: 'NOAA GOES Primary X-rays (0.1–0.8 nm)',
      agency: 'NOAA',
      endpoint: xrayUrl,
      docsUrl: 'https://www.swpc.noaa.gov/products/goes-x-ray-flux',
      status: xrayRes.status,
      observedAt: xrayLast?.time_tag ?? null,
      fetchedAt,
      latencyMs: xrayRes.latencyMs,
      noteZh: xrayRes.noteZh,
    },
    {
      id: 'noaa-solar-wind',
      name: 'NOAA SWPC Solar Wind Speed summary',
      agency: 'NOAA',
      endpoint: windUrl,
      docsUrl: 'https://www.swpc.noaa.gov/products/real-time-solar-wind',
      status: windRes.status,
      observedAt: windLast?.time_tag ?? null,
      fetchedAt,
      latencyMs: windRes.latencyMs,
      noteZh: windRes.noteZh,
    },
    {
      id: 'noaa-goes-protons',
      name: 'NOAA GOES Integral Protons (≥10 MeV)',
      agency: 'NOAA',
      endpoint: protonUrl,
      docsUrl: 'https://www.swpc.noaa.gov/products/goes-proton-flux',
      status: protonRes.status,
      observedAt: protonLast?.time_tag ?? null,
      fetchedAt,
      latencyMs: protonRes.latencyMs,
      noteZh: protonRes.noteZh,
    },
    {
      id: 'noaa-swpc-alerts',
      name: 'NOAA SWPC Space Weather Alerts',
      agency: 'NOAA',
      endpoint: alertUrl,
      docsUrl: 'https://www.swpc.noaa.gov/products/alerts-watches-and-warnings',
      status: alertRes.status,
      observedAt: lastOf(alertRes.data)?.issue_datetime ?? null,
      fetchedAt,
      latencyMs: alertRes.latencyMs,
      noteZh: alertRes.noteZh,
    },
    {
      id: 'nasa-donki-gst',
      name: 'NASA DONKI Geomagnetic Storms',
      agency: 'NASA',
      endpoint: 'https://api.nasa.gov/DONKI/GST',
      docsUrl: 'https://ccmc.gsfc.nasa.gov/donki/',
      status: gstRes.status,
      observedAt: gstRes.data?.[0]?.startTime ?? null,
      fetchedAt,
      latencyMs: gstRes.latencyMs,
      noteZh: gstRes.noteZh,
    },
    {
      id: 'nasa-donki-cme',
      name: 'NASA DONKI Coronal Mass Ejections',
      agency: 'NASA',
      endpoint: 'https://api.nasa.gov/DONKI/CME',
      docsUrl: 'https://ccmc.gsfc.nasa.gov/donki/',
      status: cmeRes.status,
      observedAt: cmeRes.data?.[0]?.startTime ?? null,
      fetchedAt,
      latencyMs: cmeRes.latencyMs,
      noteZh: cmeRes.noteZh,
    },
    {
      id: 'nasa-donki-sep',
      name: 'NASA DONKI Solar Energetic Particles',
      agency: 'NASA',
      endpoint: 'https://api.nasa.gov/DONKI/SEP',
      docsUrl: 'https://ccmc.gsfc.nasa.gov/donki/',
      status: sepRes.status,
      observedAt: sepRes.data?.[0]?.eventTime ?? sepRes.data?.[0]?.sepID ?? null,
      fetchedAt,
      latencyMs: sepRes.latencyMs,
      noteZh: sepRes.noteZh,
    },
    {
      id: 'nasa-donki-notifications',
      name: 'NASA DONKI Notifications',
      agency: 'NASA',
      endpoint: 'https://api.nasa.gov/DONKI/notifications',
      docsUrl: 'https://ccmc.gsfc.nasa.gov/donki/',
      status: notifRes.status,
      observedAt: notifRes.data?.[0]?.messageIssueTime ?? null,
      fetchedAt,
      latencyMs: notifRes.latencyMs,
      noteZh: notifRes.noteZh,
    },
  ];

  const geomagneticStorms: DonkiStorm[] = (gstRes.data || []).slice(0, 5).map((row) => ({
    gstID: String(row.gstID || ''),
    startTime: row.startTime ?? null,
    kpIndex: row.kpIndex ?? row.allKpIndex?.[0]?.kpIndex ?? null,
  }));

  const coronalMassEjections: DonkiCme[] = (cmeRes.data || []).slice(0, 5).map((row) => ({
    activityID: String(row.activityID || ''),
    startTime: row.startTime ?? null,
    note: row.note ?? null,
  }));

  const solarEnergeticParticles: DonkiSep[] = (sepRes.data || []).slice(0, 5).map((row) => ({
    sepID: String(row.sepID || ''),
    eventTime: row.eventTime ?? null,
    instruments: firstInstrument(row),
  }));

  const donkiNotifications: DonkiNotification[] = (notifRes.data || []).slice(0, 6).map((row) => ({
    messageID: String(row.messageID || row.messageId || ''),
    messageType: row.messageType ?? null,
    messageIssueTime: row.messageIssueTime ?? null,
    messageURL: row.messageURL ?? row.messageUrl ?? null,
  }));

  const swpcAlerts: SwpcAlert[] = (alertRes.data || []).slice(0, 4).map((row) => ({
    productId: String(row.product_id || ''),
    issueDatetime: String(row.issue_datetime || ''),
    headline: alertHeadline(String(row.message || '')),
  }));

  const liveOk = [kpRes, xrayRes, windRes, protonRes].filter((r) => r.status === 'ok' || r.status === 'empty').length;
  const donkiFail = [gstRes, cmeRes, sepRes, notifRes].some((r) => r.status === 'timeout' || r.status === 'error');
  const donkiEmpty =
    [gstRes, cmeRes, sepRes, notifRes].every((r) => r.status === 'empty' || r.status === 'ok') &&
    geomagneticStorms.length === 0 &&
    coronalMassEjections.length === 0 &&
    solarEnergeticParticles.length === 0 &&
    donkiNotifications.length === 0;
  const overallStatus: SpaceEnvironmentPayload['overallStatus'] =
    liveOk === 0 ? 'unavailable' : liveOk < 4 || donkiFail ? 'partial' : 'ok';

  const notices: string[] = [];
  if (mode === 'demo_key') {
    notices.push(
      'api.nasa.gov is using public DEMO_KEY (rate-limited). Set NASA_API_KEY for a registered key. NOAA SWPC/GOES do not use this key.'
    );
  }
  if (donkiFail) {
    notices.push(
      'NASA DONKI GST/CME/SEP/notifications timed out or failed. Live observations use NOAA SWPC/GOES. Events were not filled in. Flare class is from GOES X-ray, not DONKI FLR.'
    );
  }
  if (donkiEmpty && !donkiFail) {
    notices.push(
      `NASA DONKI window ${windowStart}–${windowEnd} has no GST/CME/SEP/notification records (real empty window, not simulated).`
    );
  }
  if (kpValue != null && kpValue < 5 && goesClass && goesClass.startsWith('C')) {
    notices.push(
      'Moderate-to-low solar activity: C-class X-ray flux is from NOAA GOES, not a NASA DONKI FLR record.'
    );
  }

  const g = kpValue != null ? kpToGScale(kpValue) : { code: 'G?', labelZh: '無 Kp 觀測' };
  const r = goesClass ? goesClassToRScale(goesClass) : { code: 'R?', labelZh: '無 X 射線觀測' };
  const s = pfu != null ? protonToSScale(pfu) : { code: 'S?', labelZh: '無質子通量觀測' };

  const goesXray =
    xrayLast?.flux != null
      ? {
          flux: xrayLast.flux,
          fluxUnit: 'W/m²' as const,
          energyBand: xrayLast.energy || '0.1-0.8nm',
          satellite: xrayLast.satellite != null ? `GOES-${xrayLast.satellite}` : 'GOES',
          goesClass: goesClass || fluxToGoesClass(xrayLast.flux),
          observedAt: xrayLast.time_tag,
          sourceId: 'noaa-goes-xray',
        }
      : null;
  const goesFlare = flareFromGoesXray(goesXray);
  const solarFlares = goesFlare ? [goesFlare] : [];

  const payload: SpaceEnvironmentPayload = {
    fetchedAt,
    windowStart,
    windowEnd,
    overallStatus,
    nasaKeyMode: mode,
    cache: { hit: false, ttlSeconds: Math.round(CACHE_TTL_MS / 1000) },
    sources,
    observations: {
      kp:
        kpValue != null && kpLast
          ? {
              value: Number(kpValue),
              estimated: kpLast.estimated_kp,
              unit: 'Kp',
              observedAt: kpLast.time_tag,
              sourceId: 'noaa-swpc-kp',
            }
          : null,
      goesXray,
      solarWind:
        windLast?.proton_speed != null
          ? {
              speed: windLast.proton_speed,
              unit: 'km/s',
              observedAt: windLast.time_tag || fetchedAt,
              sourceId: 'noaa-solar-wind',
            }
          : null,
      protons:
        pfu != null && protonLast
          ? {
              flux: pfu,
              unit: 'pfu',
              energy: protonLast.energy || '>=10 MeV',
              satellite: protonLast.satellite != null ? `GOES-${protonLast.satellite}` : 'GOES',
              observedAt: protonLast.time_tag,
              sourceId: 'noaa-goes-protons',
            }
          : null,
    },
    scales: {
      gScale: g.code,
      rScale: r.code,
      sScale: s.code,
      radiationRisk: scalesCombo.risk,
      basisZh: scalesCombo.basisZh,
    },
    events: {
      solarFlares,
      geomagneticStorms,
      coronalMassEjections,
      solarEnergeticParticles,
      donkiNotifications,
      swpcAlerts,
    },
    notices,
  };

  cache = { expiresAt: Date.now() + CACHE_TTL_MS, payload };
  return payload;
}
