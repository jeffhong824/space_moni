import { describe, expect, it } from 'vitest';
import { flattenKeys, translate } from '../i18n/index.ts';
import { LANGUAGES, LOCALE_TABLES } from '../i18n/registry.ts';
import { earthDelayForKind } from './earthDelay.ts';
import { SCIENCE_ROWS } from './scienceTrace.ts';
import { egressModeForKind, egressVerdict } from './egressReady.ts';
import { THRESHOLDS } from './healthThresholds.ts';

describe('QA fixes from production check 1573626', () => {
  it('science source cell has no leftover Gateway wording', () => {
    const moon = SCIENCE_ROWS.find((r) => /Moon Base/i.test(r.feature));
    expect(moon).toBeTruthy();
    expect(moon!.source).toMatch(/Hypothetical lunar south-pole surface base, per NASA Moon Base direction, Mar 2026/);
    expect(moon!.source).not.toMatch(/Gateway/i);
  });

  it('delay.labelKey is i18n, not a hardcoded English-only UI string', () => {
    const leo = earthDelayForKind('leo-station');
    const moon = earthDelayForKind('lunar-south-pole');
    const mars = earthDelayForKind('mars-transit', 1.5);
    expect(leo.labelKey).toBe('hrp.delayLeo');
    expect(moon.labelKey).toBe('hrp.delayMoon');
    expect(mars.labelKey).toBe('hrp.delayMarsAu');
    for (const lang of LANGUAGES) {
      expect(translate(lang.id, leo.labelKey).length).toBeGreaterThan(8);
      expect(translate(lang.id, moon.labelKey, moon.labelVars).length).toBeGreaterThan(8);
    }
    expect(translate('zh-Hant-TW', leo.labelKey)).not.toMatch(/LEO light-time/);
  });

  it('science kicker is localized on zh', () => {
    const zh = translate('zh-Hant-TW', 'hrp.scienceKicker');
    expect(zh).not.toMatch(/BEST USE OF SCIENCE/i);
    expect(zh).not.toBe(translate('en', 'hrp.scienceKicker'));
  });

  it('SANS eye labels keep logMAR as a term and translate OD/OS', () => {
    expect(translate('en', 'hrp.logMarOd')).toMatch(/logMAR/);
    expect(translate('zh-Hant-TW', 'hrp.logMarOd')).toMatch(/logMAR/);
    expect(translate('zh-Hant-TW', 'hrp.logMarOd')).not.toBe('logMAR OD');
    expect(translate('ja', 'hrp.logMarOs')).toMatch(/logMAR/);
  });

  it('Harmony uses return-to-Earth egress; Moon/Mars use landing', () => {
    expect(egressModeForKind('leo-station')).toBe('return');
    expect(egressModeForKind('lunar-south-pole')).toBe('landing');
    expect(egressModeForKind('mars-transit')).toBe('landing');
    const earth = egressVerdict({ orthostatic: 90, balance: 88, grip: 85, vision: 92 }, 'return');
    expect(earth.tasks.some((t) => t.id === 'earth')).toBe(true);
    expect(earth.tasks.some((t) => t.id === 'eva')).toBe(false);
  });

  it('exercise band copy is caution-only (no critical)', () => {
    expect(THRESHOLDS.exerciseMinutes.critical).toMatch(/^—$|^-$|^–$/);
    expect(THRESHOLDS.exerciseMinutes.attention).toMatch(/or|90|210/);
    expect(THRESHOLDS.exerciseMinutes.attention).not.toMatch(/\u6216/);
  });
});

describe('locale CJK / Han scan', () => {
  it('en and es locale values have no Han characters', () => {
    const han = /[\u3400-\u9fff]/;
    for (const lang of ['en', 'es'] as const) {
      const hits: string[] = [];
      const walk = (node: unknown, path: string) => {
        if (typeof node === 'string') {
          if (han.test(node)) hits.push(`${path}: ${node}`);
          return;
        }
        if (node && typeof node === 'object') {
          for (const [k, v] of Object.entries(node as Record<string, unknown>)) walk(v, path ? `${path}.${k}` : k);
        }
      };
      walk(LOCALE_TABLES[lang], '');
      expect(hits, lang).toEqual([]);
    }
  });
});
