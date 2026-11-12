import { describe, expect, it } from 'vitest';
import { flattenKeys, translate } from './index';
import { LANGUAGES, LOCALE_TABLES } from './registry';

function flat(lang: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (node: unknown, path: string) => {
    if (typeof node === 'string') {
      out[path] = node;
      return;
    }
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        walk(v, path ? `${path}.${k}` : k);
      }
    }
  };
  walk(LOCALE_TABLES[lang], '');
  return out;
}

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
      expect(text.toLowerCase()).not.toMatch(/aura online|aura en l[ií]nea/i);
      expect(text.toLowerCase()).not.toContain('aura online');
      expect(text).toMatch(/offline|desconectad|\u96e2\u7dda|\u30aa\u30d5\u30e9\u30a4\u30f3/i);
    }
  });

  it('does not misspell electrolytes as electrolyts in any locale', () => {
    for (const lang of LANGUAGES) {
      const blob = JSON.stringify(LOCALE_TABLES[lang.id]);
      expect(blob, lang.id).not.toMatch(/electrolyts/i);
    }
  });

  it('uses natural professional phrasing for orthostatic and fluid metrics in zh/ja/es', () => {
    const zh = flat('zh-Hant-TW');
    const ja = flat('ja');
    expect(translate('zh-Hant-TW', 'panel.m.ortho')).toBe(zh['panel.m.ortho']);
    expect(translate('zh-Hant-TW', 'panel.ortho.flag')).toBe(zh['panel.ortho.flag']);
    expect(translate('zh-Hant-TW', 'panel.m.ortho')).not.toMatch(/flag/i);
    expect(translate('ja', 'panel.m.ortho')).toBe(ja['panel.m.ortho']);
    expect(translate('ja', 'panel.ortho.flag')).toBe(ja['panel.ortho.flag']);
    expect(translate('es', 'panel.m.ortho')).toMatch(/hipotensi[oó]n ortost[aá]tica/i);
    expect(translate('es', 'panel.m.fluidIn')).toBe('Ingesta h\u00eddrica');
    expect(translate('es', 'panel.m.fluidOut')).toBe('P\u00e9rdidas h\u00eddricas');
    expect(translate('zh-Hant-TW', 'today.partStatus', { label: zh['panel.m.ortho'], value: zh['panel.ortho.flag'] })).toBe(
      `${zh['panel.m.ortho']} \u00b7 ${zh['panel.ortho.flag']}`
    );
  });
});
