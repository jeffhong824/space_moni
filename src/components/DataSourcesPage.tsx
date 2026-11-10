import React from 'react';
import { ExternalLink } from 'lucide-react';
import { THRESHOLDS } from '../domain/healthThresholds';
import { useI18n } from '../i18n/I18nProvider';

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

export const DataSourcesPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useI18n();
  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-slate-50/80">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{t('sources.title')}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{t('sources.hint')}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white"
        >
          {t('sources.back')}
        </button>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold">{t('sources.official')}</h2>
        <ul className="mt-3 space-y-3">
          {CITATIONS.map((c) => (
            <li key={c.title} className="rounded-xl border border-slate-200 px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{c.title}</p>
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-sky-700 shrink-0"
                  >
                    {t('sources.open')} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400">{t('ui.noUrl')}</span>
                )}
              </div>
              <p className="text-xs text-slate-700 mt-1">{t(c.usedKey)}</p>
              <p className="text-[11px] text-slate-500 mt-1">{t(c.noteKey)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold">{t('sources.simArt')}</h2>
        <ul className="mt-3 space-y-3">
          <li className="rounded-xl border border-slate-200 px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">tgstation / Space Station 13</p>
              <a
                href="https://github.com/tgstation/tgstation"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-sky-700 shrink-0"
              >
                {t('sources.open')} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-slate-700 mt-1">{t('sources.cite.tgstation.used')}</p>
            <p className="text-[11px] text-slate-500 mt-1">{t('sources.cite.tgstation.note')}</p>
          </li>
          <li className="rounded-xl border border-slate-200 px-3 py-2.5">
            <p className="text-sm font-semibold text-slate-900">AI-generated (SpaceMoni)</p>
            <p className="text-xs text-slate-700 mt-1">{t('sources.cite.simAi.used')}</p>
            <p className="text-[11px] text-slate-500 mt-1">{t('sources.cite.simAi.note')}</p>
          </li>
          <li className="rounded-xl border border-slate-200 px-3 py-2.5">
            <p className="text-sm font-semibold text-slate-900">Clinical body map (SpaceMoni vector)</p>
            <p className="text-xs text-slate-700 mt-1">{t('sources.cite.anatomy.used')}</p>
            <p className="text-[11px] text-slate-500 mt-1">{t('sources.cite.anatomy.note')}</p>
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold">{t('sources.thresholds')}</h2>
        <p className="text-[11px] text-slate-500 mt-1">{t('sources.thresholdsHint')}</p>
        <table className="mt-3 w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-1.5 pr-2">{t('sources.colMetric')}</th>
              <th className="py-1.5 pr-2">{t('sources.colNormal')}</th>
              <th className="py-1.5 pr-2">{t('sources.colCaution')}</th>
              <th className="py-1.5">{t('sources.colCritical')}</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(THRESHOLDS).map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="py-1.5 pr-2 font-medium">
                  {t(`metric.${row.id}`)}
                  <span className="block text-[10px] font-mono text-slate-400">{row.unit}</span>
                </td>
                <td className="py-1.5 pr-2 font-mono">{row.normal}</td>
                <td className="py-1.5 pr-2 font-mono">{row.attention}</td>
                <td className="py-1.5 font-mono">{row.critical}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};
