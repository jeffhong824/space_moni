import React from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { Provenance } from '../domain/scienceTrace';

export const SourceTag: React.FC<{ kind: Provenance; title?: string }> = ({ kind, title }) => {
  const { t } = useI18n();
  const label =
    kind === 'LIVE'
      ? t('hrp.tagLive')
      : kind === 'SOURCED-STATIC'
        ? t('hrp.tagSourced')
        : kind === 'ASSUMPTION'
          ? t('hrp.tagAssumption')
          : t('hrp.tagSim');
  const cls =
    kind === 'LIVE'
      ? 'bg-sky-100 text-sky-800'
      : kind === 'SOURCED-STATIC'
        ? 'bg-indigo-100 text-indigo-800'
        : kind === 'ASSUMPTION'
          ? 'bg-amber-100 text-amber-900'
          : 'bg-stone-200 text-stone-700';
  return (
    <span title={title} className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide ${cls}`}>
      {label}
    </span>
  );
};
