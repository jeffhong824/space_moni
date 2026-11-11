import en from './locales/en.json' with { type: 'json' };
import zhHantTW from './locales/zh-Hant-TW.json' with { type: 'json' };
import es from './locales/es.json' with { type: 'json' };
import ja from './locales/ja.json' with { type: 'json' };

export const STORAGE_KEY = 'spacemoni.lang';
export const DEFAULT_LANG = 'en';

export interface LanguageDef {
  id: string;
  nativeName: string;
  htmlLang: string;
}

/**
 * Extensible language registry. Adding a language = one JSON file in
 * `src/i18n/locales/` plus one row here.
 */
export const LANGUAGES: LanguageDef[] = [
  { id: 'en', nativeName: 'English', htmlLang: 'en' },
  { id: 'zh-Hant-TW', nativeName: 'Chinese (Taiwan)', htmlLang: 'zh-Hant-TW' },
  { id: 'es', nativeName: 'Espanol', htmlLang: 'es' },
  { id: 'ja', nativeName: 'Japanese', htmlLang: 'ja' },
];

export const LOCALE_TABLES: Record<string, unknown> = {
  en,
  'zh-Hant-TW': zhHantTW,
  es,
  ja,
};

export function isLangId(id: string): boolean {
  return LANGUAGES.some((l) => l.id === id);
}
