import React from 'react';
import { LANGUAGES } from '../i18n/registry';
import { useI18n } from '../i18n/I18nProvider';

export const LanguageSwitcher: React.FC<{ variant?: 'light' | 'dark' }> = ({ variant = 'light' }) => {
  const { lang, setLang, t } = useI18n();
  const dark = variant === 'dark';
  return (
    <label className="inline-flex items-center gap-1.5 shrink-0">
      <span className={`text-[10px] font-semibold ${dark ? 'text-white/70' : 'text-slate-500'}`}>{t('lang.label')}</span>
      <select
        aria-label={t('lang.label')}
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className={`text-xs font-semibold rounded-lg border px-2 py-1.5 cursor-pointer ${
          dark ? 'bg-black/60 text-white border-white/30' : 'bg-white text-slate-800 border-slate-200'
        }`}
      >
        {LANGUAGES.map((l) => (
          <option key={l.id} value={l.id}>
            {l.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
};
