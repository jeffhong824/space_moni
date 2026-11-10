import {
  DEFAULT_LANG,
  isLangId,
  LANGUAGES,
  LOCALE_TABLES,
  STORAGE_KEY,
  type LanguageDef,
} from './registry';

export { DEFAULT_LANG, LANGUAGES, STORAGE_KEY, isLangId };
export type { LanguageDef };

export type Vars = Record<string, string | number>;

function lookup(table: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let cur: unknown = table;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

export function translate(lang: string, key: string, vars?: Vars): string {
  const table = LOCALE_TABLES[lang] ?? LOCALE_TABLES[DEFAULT_LANG];
  const raw = lookup(table, key) ?? lookup(LOCALE_TABLES[DEFAULT_LANG], key) ?? key;
  return interpolate(raw, vars);
}

/** Translate a stored i18n key (e.g. occ.botanist); pass through unknown text. */
export function localizeKey(lang: string, maybeKey: string, vars?: Vars): string {
  if (!maybeKey || !maybeKey.includes('.')) return maybeKey;
  const table = LOCALE_TABLES[lang] ?? LOCALE_TABLES[DEFAULT_LANG];
  if (lookup(table, maybeKey) || lookup(LOCALE_TABLES[DEFAULT_LANG], maybeKey)) {
    return translate(lang, maybeKey, vars);
  }
  return maybeKey;
}

export function flattenKeys(table: unknown, prefix = ''): string[] {
  if (table == null || typeof table !== 'object') return [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(table as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out.push(path);
    else out.push(...flattenKeys(v, path));
  }
  return out;
}

export function statusI18nKey(status: string | null | undefined): 'status.normal' | 'status.caution' | 'status.critical' {
  const s = (status || '').trim();
  if (
    s === 'Critical' ||
    s === '危急' ||
    s === '危険' ||
    s === 'Crítico' ||
    s === 'Alert'
  ) {
    return 'status.critical';
  }
  if (
    s === 'Attention' ||
    s === 'Attention Required' ||
    s === 'Caution' ||
    s === 'Elevated' ||
    s === '注意' ||
    s === 'Precaución' ||
    s === 'Elevated Stress' ||
    s === 'Fatigued' ||
    s === 'Mild Strain' ||
    s === 'Calorie Deficit'
  ) {
    return 'status.caution';
  }
  if (s === 'Atrophy Risk' || s === 'Dehydration') return 'status.critical';
  return 'status.normal';
}

export function statusLabel(lang: string, status: string | null | undefined): string {
  return translate(lang, statusI18nKey(status));
}

export function readStoredLang(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isLangId(raw)) return raw;
  } catch {
    /* SSR / private mode */
  }
  return DEFAULT_LANG;
}

export function persistLang(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function applyHtmlLang(id: string) {
  const def = LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
  if (typeof document !== 'undefined') {
    document.documentElement.lang = def.htmlLang;
    document.title = translate(id, 'app.htmlTitle');
  }
}
