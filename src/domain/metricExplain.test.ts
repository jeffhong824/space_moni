import { describe, expect, it } from 'vitest';
import { flattenKeys } from '../i18n/index.ts';
import { LANGUAGES, LOCALE_TABLES } from '../i18n/registry.ts';
import { METRIC_IDS } from './crewSystems.ts';
import { HRR_COVERAGE } from './hrrCoverage.ts';
import { explainKeys, hrrUrlForMetric } from './metricExplain.ts';

describe('metric How/Why/When keys', () => {
  it('every crew-systems metric has how/why/when in all 4 locales', () => {
    const missing: string[] = [];
    for (const lang of LANGUAGES) {
      const have = new Set(flattenKeys(LOCALE_TABLES[lang.id]));
      for (const id of METRIC_IDS) {
        const keys = explainKeys(id);
        for (const k of Object.values(keys)) {
          if (!have.has(k)) missing.push(`${lang.id}: ${k}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('every metric maps to a 2026-11-11 HRR URL', () => {
    for (const id of METRIC_IDS) {
      const url = hrrUrlForMetric(id);
      expect(url, id).toMatch(/^https:\/\/humanresearchroadmap\.nasa\.gov/);
    }
  });

  it('HRR coverage matrix has 22 rows including inactive disc', () => {
    expect(HRR_COVERAGE).toHaveLength(22);
    expect(HRR_COVERAGE.some((r) => r.id === 'disc')).toBe(true);
    expect(HRR_COVERAGE.find((r) => r.id === 'dcs')?.url).toContain('i=168');
    expect(HRR_COVERAGE.find((r) => r.id === 'dust')?.url).toContain('i=82');
    expect(HRR_COVERAGE.find((r) => r.id === 'eva')?.url).toContain('i=84');
  });
});
