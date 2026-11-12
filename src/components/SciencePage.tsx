import React from 'react';
import { SCIENCE_ROWS } from '../domain/scienceTrace';
import { HRR_COVERAGE } from '../domain/hrrCoverage';
import { useI18n } from '../i18n/I18nProvider';
import { SourceTag } from './SourceTag';

export const SciencePage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { t } = useI18n();
  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 pt-3 sm-page-pad pb-24">
      <header className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">{t('hrp.scienceKicker')}</p>
        <h1 className="font-display text-2xl">{t('hrp.scienceTitle')}</h1>
        <p className="text-[13px] text-stone-600 mt-1 max-w-3xl leading-relaxed">{t('hrp.scienceLead')}</p>
        {onBack && (
          <button type="button" onClick={onBack} className="mt-2 text-[12px] font-semibold text-sky-800">
            {t('common.back')}
          </button>
        )}
      </header>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white/90">
        <table className="min-w-[720px] w-full text-[11px]">
          <thead className="bg-stone-50 text-left">
            <tr>
              <th className="p-2 font-semibold">{t('hrp.colFeature')}</th>
              <th className="p-2 font-semibold">{t('hrp.colHrp')}</th>
              <th className="p-2 font-semibold">{t('hrp.colStd')}</th>
              <th className="p-2 font-semibold">{t('hrp.colSource')}</th>
              <th className="p-2 font-semibold">{t('hrp.colProv')}</th>
            </tr>
          </thead>
          <tbody>
            {SCIENCE_ROWS.map((row) => (
              <tr key={row.feature} className="border-t border-stone-100 align-top">
                <td className="p-2 font-medium text-stone-900">{row.feature}</td>
                <td className="p-2 text-stone-600">{row.hrp}</td>
                <td className="p-2 text-stone-600">{row.std3001}</td>
                <td className="p-2 text-stone-600">{row.source}</td>
                <td className="p-2">
                  <SourceTag kind={row.provenance} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="font-display text-xl mt-8">{t('hrr.matrixTitle')}</h2>
      <p className="text-[12px] text-stone-600 mb-2">{t('hrr.matrixLead')}</p>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white/90">
        <table className="min-w-[720px] w-full text-[11px]">
          <thead className="bg-stone-50 text-left">
            <tr>
              <th className="p-2 font-semibold">{t('hrp.colFeature')}</th>
              <th className="p-2 font-semibold">{t('hrp.colHrp')}</th>
              <th className="p-2 font-semibold">{t('hrp.colStd')}</th>
              <th className="p-2 font-semibold">{t('hrp.colSource')}</th>
              <th className="p-2 font-semibold">{t('hrp.colProv')}</th>
            </tr>
          </thead>
          <tbody>
            {HRR_COVERAGE.map((row) => (
              <tr key={row.id} className="border-t border-stone-100 align-top">
                <td className="p-2 font-medium text-stone-900">{t(row.featureKey)}</td>
                <td className="p-2 text-stone-600">
                  <a className="text-sky-800 underline" href={row.url} target="_blank" rel="noreferrer">
                    {row.hrp}
                  </a>
                </td>
                <td className="p-2 text-stone-600">{row.std3001}</td>
                <td className="p-2 text-stone-600">{row.source}</td>
                <td className="p-2">
                  <SourceTag kind={row.provenance} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-stone-500 mt-3 max-w-3xl">{t('hrp.scienceFoot')}</p>
    </div>
  );
};
