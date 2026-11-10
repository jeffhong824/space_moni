import { describe, expect, it } from 'vitest';
import { flattenKeys, translate } from './index';
import { LANGUAGES, LOCALE_TABLES } from './registry';

describe('i18n locale tables', () => {
  it('registry has a row for every JSON table and vice versa', () => {
    const ids = LANGUAGES.map((l) => l.id).sort();
    expect(ids).toEqual(Object.keys(LOCALE_TABLES).sort());
  });

  it('every locale has every English key', () => {
    const enKeys = flattenKeys(LOCALE_TABLES.en).sort();
    expect(enKeys.length).toBeGreaterThan(50);
    const missing: string[] = [];
    for (const lang of LANGUAGES) {
      if (lang.id === 'en') continue;
      const have = new Set(flattenKeys(LOCALE_TABLES[lang.id]));
      for (const key of enKeys) {
        if (!have.has(key)) missing.push(`${lang.id}: ${key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('offline AURA greeting does not claim the model is online', () => {
    for (const lang of LANGUAGES) {
      const text = translate(lang.id, 'ai.greetingOffline', {
        name: 'Ada',
        day: 2,
        summary: 'ok.',
        hr: 80,
        hrv: 30,
      });
      expect(text.toLowerCase()).not.toMatch(/aura online|aura en línea|aura 上線|aura オンライン/);
      expect(text).toMatch(/offline|desconectad|離線|オフライン/i);
    }
  });

  it('does not misspell electrolytes as electrolyts in any locale', () => {
    for (const lang of LANGUAGES) {
      const blob = JSON.stringify(LOCALE_TABLES[lang.id]);
      expect(blob, lang.id).not.toMatch(/electrolyts/i);
    }
  });
});
