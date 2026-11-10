import React from 'react';
import { ExternalLink } from 'lucide-react';
import { BAND_NUMBERS, THRESHOLDS } from '../domain/healthThresholds';
import { useI18n } from '../i18n/I18nProvider';
import type { SpaceEnvironmentPayload } from '../domain/spaceWeather';
import { SimChip } from '../ui/chrome';

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

export const DataSourcesPage: React.FC<{
  onBack: () => void;
  wx?: SpaceEnvironmentPayload | null;
}> = ({ onBack, wx = null }) => {
  const { t } = useI18n();
  const src = (id: string) => wx?.sources.find((s) => s.id === id || s.name.toLowerCase().includes(id.toLowerCase()));
  const noaa = src('kp') || src('swpc') || wx?.sources.find((s) => s.agency === 'NOAA');
  const goes = src('goes') || src('xray') || wx?.sources.find((s) => s.name.toLowerCase().includes('goes'));
  const donki = src('donki') || wx?.sources.find((s) => s.agency === 'NASA');

  const hr = BAND_NUMBERS.restingHR;
  const hrv = BAND_NUMBERS.hrv;
  const spo2 = BAND_NUMBERS.spo2;
  const sleepH = BAND_NUMBERS.sleepMinutes.attentionBelow / 60;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-4 sm-page-pad sm-orb-gutter">
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
          max={BAND_NUMBERS.exerciseMinutes.max}
          cautionAt={BAND_NUMBERS.exerciseMinutes.min}
          criticalAt={BAND_NUMBERS.exerciseMinutes.max}
        />
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
          <LiveBadge name="NASA DONKI" src={donki} />
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
                <td className="py-1.5 pr-2 font-mono">{row.normal}</td>
                <td className="py-1.5 pr-2 font-mono">{row.attention}</td>
                <td className="py-1.5 font-mono">{row.critical}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <button type="button" onClick={onBack} className="mt-8 h-10 px-4 rounded-full bg-white text-xs font-semibold">
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
  const when = src?.observedAt || src?.fetchedAt;
  return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-[var(--sm-shadow-soft)] text-[12px]">
      <span className={`w-2 h-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-stone-300'}`} />
      {name}
      {when && <span className="text-stone-400 text-[10px] font-mono">{new Date(when).toISOString().slice(11, 16)} UTC</span>}
      {ok ? <SimChip live className="!px-1.5 !py-0" /> : <span className="text-[10px] text-stone-400">{t('wx.fail')}</span>}
    </span>
  );
}
