import React from 'react';
import { useI18n } from '../i18n/I18nProvider';

export const SimBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider border border-amber-400 bg-amber-50 text-amber-950 ${className}`}
    >
      {t('common.simulation')}
    </span>
  );
};
