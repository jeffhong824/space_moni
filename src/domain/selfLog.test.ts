import { describe, expect, it } from 'vitest';
import {
  OSD575_GLUCOSE,
  SELF_LOG_LIMITS,
  glucoseBand,
  taipeiIsoNow,
  validateSelfLog,
} from './selfLog.ts';

describe('self-measurement log', () => {
  it('uses OSD-575 CMP glucose 65–99 mg/dL (not invented)', () => {
    expect(OSD575_GLUCOSE.min).toBe(65);
    expect(OSD575_GLUCOSE.max).toBe(99);
    expect(OSD575_GLUCOSE.study).toBe('OSD-575');
    expect(glucoseBand(80)).toBe('normal');
    expect(glucoseBand(64)).toBe('caution');
    expect(glucoseBand(100)).toBe('caution');
  });

  it('rejects out-of-range values', () => {
    expect(validateSelfLog('glucose', 9).ok).toBe(false);
    expect(validateSelfLog('glucose', 601).ok).toBe(false);
    expect(validateSelfLog('temp', 29.9).ok).toBe(false);
    expect(validateSelfLog('temp', 45.1).ok).toBe(false);
    expect(validateSelfLog('bpSys', 59).ok).toBe(false);
    expect(validateSelfLog('bpDia', 161).ok).toBe(false);
    expect(validateSelfLog('hr', 24).ok).toBe(false);
    expect(validateSelfLog('hr', 120).ok).toBe(true);
    expect(SELF_LOG_LIMITS.hr.max).toBe(250);
  });

  it('stamps takenAt in Asia/Taipei ISO', () => {
    const iso = taipeiIsoNow(Date.parse('2026-11-10T16:00:00Z'));
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/);
    expect(iso.startsWith('2026-11-11T00:00:00')).toBe(true);
  });
});
