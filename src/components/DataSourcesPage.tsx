import React from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { BAND_NUMBERS, THRESHOLDS } from '../domain/healthThresholds';
import { useI18n } from '../i18n/I18nProvider';
import { aggregateDonki, type SpaceEnvironmentPayload } from '../domain/spaceWeather';
import { SimChip } from '../ui/chrome';
import { feedImpact } from './SpaceEnvironmentPanel';

const CITATIONS = [
  {
    title: 'NOAA Space Weather Scales',
    usedKey: 'sources.cite.noaa.used',
    noteKey: 'sources.cite.noaa.note',
    url: 'https://www.swpc.noaa.gov/noaa-scales-explanation',
  },
  {
    title: 'GOES X-Ray Flux (SWPC)',
    usedKey: 'sources.cite.xray.used',
    noteKey: 'sources.cite.xray.note',
    url: 'https://www.swpc.noaa.gov/products/goes-x-ray-flux',
  },
  {
    title: 'GOES Proton Flux (SWPC)',
    usedKey: 'sources.cite.proton.used',
    noteKey: 'sources.cite.proton.note',
    url: 'https://www.swpc.noaa.gov/products/goes-proton-flux',
  },
  {
    title: 'NASA DONKI',
    usedKey: 'sources.cite.donki.used',
    noteKey: 'sources.cite.donki.note',
    url: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/',
  },
  {
    title: 'NASA Open Science Data Repository (OSDR)',
    usedKey: 'sources.cite.osdr.used',
    noteKey: 'sources.cite.osdr.note',
    url: 'https://osdr.nasa.gov/bio/',
  },
  {
    title: 'NASA Technical Reports Server (NTRS)',
    usedKey: 'sources.cite.ntrs.used',
    noteKey: 'sources.cite.ntrs.note',
    url: 'https://ntrs.nasa.gov/',
  },
  {
    title: 'NASA Human Research Roadmap',
    usedKey: 'sources.cite.hrp.used',
    noteKey: 'sources.cite.hrp.note',
    url: 'https://humanresearchroadmap.nasa.gov/',
  },
  {
    title: 'Spaceflight Associated Neuro-ocular Syndrome (SANS)',
    usedKey: 'sources.cite.sans.used',
    noteKey: 'sources.cite.sans.note',
    url: 'https://www.nasa.gov/humans-in-space/spaceflight-associated-neuro-ocular-syndrome-sans/',
  },
  {
    title: 'NASA image AS09-20-3064 (Apollo 9)',
    usedKey: 'sources.cite.apollo9.used',
    noteKey: 'sources.cite.apollo9.note',
    url: 'https://images.nasa.gov/details/as09-20-3064',
  },
] as const;

function Track({
  label,
  unit,
  marker,
  min,
  max,
  cautionAt,
  criticalAt,
}: {
  label: string;
  unit: string;
  marker: number;
  min: number;
  max: number;
  cautionAt: number;
  criticalAt: number;
}) {
  const pct = Math.max(4, Math.min(96, ((marker - min) / (max - min)) * 100));
  return (
    <div className="grid grid-cols-[7.5rem_1fr_auto] gap-3 items-center">
      <p className="text-sm text-stone-600">{label}</p>
      <div className="relative h-4 rounded-full bg-gradient-to-r from-[#7ddfc3] via-[#f3b184] to-[#f08a80]">
        <span
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-[var(--sm-shadow-soft)] flex items-center justify-center text-[11px] font-semibold tabular-nums"
          style={{ left: `${pct}%` }}
        >
          {marker}
        </span>
      </div>
      <span className="text-[11px] text-stone-400 w-14">{unit}</span>
      <span className="sr-only">
        caution {cautionAt} critical {criticalAt}
      </span>
    </div>
  );
}

function localizeBand(text: string, t: (k: string, v?: Record<string, string | number>) => string): string {
  return text.replace(/\bor\b/g, t('sources.band.orWord')).replace('(7 h)', t('sources.band.hoursSuffix', { n: 7 }));
}

function fmtTime(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso.endsWith('Z') || iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
}

export const DataSourcesPage: React.FC<{
  onBack: () => void;
  wx?: SpaceEnvironmentPayload | null;
  loading?: boolean;
  error?: string | null;
  lastOk?: string | null;
  onRetry?: () => void;
}> = ({ onBack, wx = null, loading = false, error = null, lastOk = null, onRetry }) => {
  const { t } = useI18n();
  const src = (id: string) => wx?.sources.find((s) => s.id === id || s.name.toLowerCase().includes(id.toLowerCase()));
  const noaa = src('kp') || src('swpc') || wx?.sources.find((s) => s.agency === 'NOAA');
  const goes = src('goes') || src('xray') || wx?.sources.find((s) => s.name.toLowerCase().includes('goes'));
  const donkiAgg = aggregateDonki(wx?.sources ?? []);

  const hr = BAND_NUMBERS.restingHR;
  const hrv = BAND_NUMBERS.hrv;
  const spo2 = BAND_NUMBERS.spo2;
  const sleepH = BAND_NUMBERS.sleepMinutes.attentionBelow / 60;

  const degraded = Boolean(error) || wx?.overallStatus === 'partial' || wx?.overallStatus === 'unavailable';

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 pt-3 sm-page-pad sm-orb-gutter">
      {degraded && (
        <div className="mb-5 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 space-y-1.5 max-w-3xl">
          <p className="text-sm font-semibold text-amber-950">{feedImpact(wx, t)}</p>
          <p className="text-[11px] text-amber-800 font-mono">{t('wx.lastOk', { time: fmtTime(lastOk || wx?.fetchedAt) })}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={loading}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-white text-[11px] font-semibold text-amber-950 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} aria-hidden />
              {t('common.retry')}
            </button>
          )}
        </div>
      )}
      <p className="text-[11px] font-semibold tracking-wide text-stone-400 uppercase">{t('ui.sourcesKicker')}</p>
      <h1 className="font-display text-4xl sm:text-5xl mt-1">{t('ui.sourcesHeadline')}</h1>
      <p className="text-sm text-stone-500 mt-2">{t('sources.hint')}</p>

      <section className="mt-8 space-y-5 max-w-3xl">
        <h2 className="text-sm font-semibold">{t('ui.judgeReading')}</h2>
        <Track
          label={t('metric.restingHR')}
          unit={THRESHOLDS.restingHR.unit}
          marker={hr.attentionHigh}
          min={hr.criticalLow}
          max={hr.criticalHigh + 20}
          cautionAt={hr.attentionHigh}
          criticalAt={hr.criticalHigh}
        />
        <Track
          label={t('metric.spo2')}
          unit={THRESHOLDS.spo2.unit}
          marker={spo2.attentionBelow}
          min={90}
          max={100}
          cautionAt={spo2.attentionBelow}
          criticalAt={spo2.criticalBelow}
        />
        <Track
          label={t('metric.hrv')}
          unit={THRESHOLDS.hrv.unit}
          marker={hrv.attentionBelow}
          min={10}
          max={50}
          cautionAt={hrv.attentionBelow}
          criticalAt={hrv.criticalBelow}
        />
        <Track
          label={t('metric.exerciseMinutes')}
          unit={THRESHOLDS.exerciseMinutes.unit}
          marker={BAND_NUMBERS.exerciseMinutes.min}
          min={0}
          max={BAND_NUMBERS.exerciseMinutes.max + 30}
          cautionAt={BAND_NUMBERS.exerciseMinutes.min}
          criticalAt={BAND_NUMBERS.exerciseMinutes.max + 999}
        />
        <p className="text-[11px] text-stone-500">
          {t('sources.exerciseCopy', {
            min: BAND_NUMBERS.exerciseMinutes.min,
            max: BAND_NUMBERS.exerciseMinutes.max,
          })}
        </p>
        <Track
          label={t('metric.sleepMinutes')}
          unit="h"
          marker={sleepH}
          min={4}
          max={10}
          cautionAt={BAND_NUMBERS.sleepMinutes.attentionBelow / 60}
          criticalAt={BAND_NUMBERS.sleepMinutes.criticalBelow / 60}
        />
      </section>

      <section className="mt-10">
        <p className="text-[11px] text-stone-400 mb-3">{t('ui.live')}</p>
        <div className="flex flex-wrap gap-2">
          <LiveBadge name="NOAA SWPC" src={noaa} />
          <LiveBadge name="GOES" src={goes} />
          <DonkiBadge agg={donkiAgg} />
        </div>
      </section>

      <p className="mt-6 inline-flex items-center px-4 py-2 rounded-full bg-violet-50 text-[12px] text-violet-800">
        {t('ui.crewSimulated')}
      </p>

      <section className="mt-10 max-w-3xl">
        <h2 className="text-sm font-semibold">{t('sources.official')}</h2>
        <ul className="mt-3 space-y-2">
          {CITATIONS.map((c) => (
            <li key={c.title} className="rounded-[24px] bg-white/80 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{c.title}</p>
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[var(--sm-cobalt)] shrink-0"
                  >
                    {t('sources.open')} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-stone-400">{t('ui.noUrl')}</span>
                )}
              </div>
              <p className="text-xs text-stone-600 mt-1">{t(c.usedKey)}</p>
              <p className="text-[11px] text-stone-400 mt-1">{t(c.noteKey)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 max-w-3xl">
        <h2 className="text-sm font-semibold">{t('sources.simArt')}</h2>
        <ul className="mt-3 space-y-2">
          <li className="rounded-[24px] bg-white/80 px-4 py-3">
            <p className="text-sm font-semibold">tgstation / Space Station 13</p>
            <p className="text-xs mt-1">{t('sources.cite.tgstation.used')}</p>
            <p className="text-[11px] text-stone-400 mt-1">{t('sources.cite.tgstation.note')}</p>
          </li>
          <li className="rounded-[24px] bg-white/80 px-4 py-3">
            <p className="text-sm font-semibold">AI-generated (SpaceMoni)</p>
            <p className="text-xs mt-1">{t('sources.cite.simAi.used')}</p>
            <p className="text-[11px] text-stone-400 mt-1">{t('sources.cite.simAi.note')}</p>
          </li>
          <li className="rounded-[24px] bg-white/80 px-4 py-3">
            <p className="text-sm font-semibold">Holographic body map (AI-generated, non-commercial demo)</p>
            <p className="text-xs mt-1">{t('sources.cite.anatomy.used')}</p>
            <p className="text-[11px] text-stone-400 mt-1">{t('sources.cite.anatomy.note')}</p>
          </li>
        </ul>
      </section>

      <section className="mt-8 max-w-3xl">
        <h2 className="text-sm font-semibold">{t('sources.thresholds')}</h2>
        <p className="text-[11px] text-stone-400 mt-1">{t('sources.thresholdsHint')}</p>
        <table className="mt-3 w-full text-xs">
          <thead>
            <tr className="text-left text-stone-400">
              <th className="py-1.5 pr-2">{t('sources.colMetric')}</th>
              <th className="py-1.5 pr-2">{t('sources.colNormal')}</th>
              <th className="py-1.5 pr-2">{t('sources.colCaution')}</th>
              <th className="py-1.5">{t('sources.colCritical')}</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(THRESHOLDS).map((row) => (
              <tr key={row.id}>
                <td className="py-1.5 pr-2 font-medium">
                  {t(`metric.${row.id}`)}
                  <span className="block text-[10px] font-mono text-stone-400">{row.unit}</span>
                </td>
                <td className="py-1.5 pr-2 font-mono">{localizeBand(row.normal, t)}</td>
                <td className="py-1.5 pr-2 font-mono">{localizeBand(row.attention, t)}</td>
                <td className="py-1.5 font-mono">{localizeBand(row.critical, t)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-10 max-w-3xl rounded-[24px] bg-white/80 px-4 py-4 space-y-2">
        <h2 className="text-sm font-semibold">{t('sources.aboutTitle')}</h2>
        <p className="text-[12px] text-stone-600 leading-relaxed">{t('sources.aboutBody')}</p>
        <p className="text-[11px] font-mono">
          <a className="text-sky-800 underline" href="https://github.com/jeffhong824/space_moni" target="_blank" rel="noreferrer">
            https://github.com/jeffhong824/space_moni
          </a>
        </p>
        <p className="text-[11px] text-stone-500">{t('sources.mitNote')}</p>
        <p className="text-[11px] text-amber-900 font-semibold">{t('notice.notDevice')}</p>
      </section>

      <button type="button" onClick={onBack} className="mt-8 mb-24 h-10 px-4 rounded-full bg-white text-xs font-semibold">
        {t('sources.back')}
      </button>
    </div>
  );
};

function LiveBadge({
  name,
  src,
}: {
  name: string;
  src?: { status: string; fetchedAt: string; observedAt: string | null } | null;
}) {
  const { t } = useI18n();
  const ok = src?.status === 'ok';
  const empty = src?.status === 'empty';
  const when = src?.observedAt || src?.fetchedAt;
  return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-[var(--sm-shadow-soft)] text-[12px]">
      <span className={`w-2 h-2 rounded-full ${ok ? 'bg-emerald-400' : empty ? 'bg-stone-400' : 'bg-rose-300'}`} />
      {name}
      {when && <span className="text-stone-400 text-[10px] font-mono">{new Date(when).toISOString().slice(11, 16)} UTC</span>}
      {ok ? (
        <SimChip live className="!px-1.5 !py-0" />
      ) : empty ? (
        <span className="text-[10px] text-stone-500">{t('wx.emptyWindow')}</span>
      ) : (
        <span className="text-[10px] text-stone-400">{t('wx.fail')}</span>
      )}
    </span>
  );
}

function DonkiBadge({
  agg,
}: {
  agg: ReturnType<typeof aggregateDonki>;
}) {
  const { t } = useI18n();
  const tone =
    agg.status === 'ok' ? 'bg-emerald-400' : agg.status === 'empty' ? 'bg-stone-400' : agg.status === 'degraded' ? 'bg-amber-400' : 'bg-rose-300';
  const label =
    agg.status === 'ok'
      ? null
      : agg.status === 'empty'
        ? t('wx.emptyWindow')
        : agg.status === 'degraded'
          ? t('wx.partial')
          : t('wx.fail');
  return (
    <span className="inline-flex flex-col gap-1 px-4 py-2 rounded-[20px] bg-white shadow-[var(--sm-shadow-soft)] text-[12px]">
      <span className="inline-flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${tone}`} />
        NASA DONKI
        {agg.observedAt && (
          <span className="text-stone-400 text-[10px] font-mono">{new Date(agg.observedAt).toISOString().slice(11, 16)} UTC</span>
        )}
        {agg.status === 'ok' ? <SimChip live className="!px-1.5 !py-0" /> : <span className="text-[10px] text-stone-500">{label}</span>}
      </span>
      <span className="flex flex-wrap gap-1 text-[10px] font-mono text-stone-500">
        {agg.endpoints.map((e) => (
          <span key={e.id}>
            {e.short}: {e.status}
          </span>
        ))}
      </span>
    </span>
  );
}
