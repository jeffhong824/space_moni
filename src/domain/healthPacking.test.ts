import { afterEach, describe, expect, it } from 'vitest';
import type { AstronautProfile, DailyHealthRecord } from '../types.ts';
import { LANGUAGES } from '../i18n/registry.ts';
import { translate } from '../i18n/index.ts';
import type { ApiRequest, ApiResponse } from '../server/http.ts';
import { handleAiDoctor } from '../server/aiDoctorHandler.ts';
import { buildOfflineTwoLevelAnalysis, packHealthPayload } from './healthPacking.ts';
import { CREW } from '../world/catalog.ts';
import { WORLD_EPOCH_MS, worldStateAt } from '../world/worldState.ts';
import { crewPanelAt } from './crewSystems.ts';

const profile: AstronautProfile = {
  id: 'unknown',
  name: 'Crew',
  gender: 'Other',
  age: 0,
  role: 'Mission Specialist',
  missionStartDate: '',
  missionCurrentDate: '',
  missionDuration: '',
  missionDaysElapsed: 0,
  bloodType: '',
  assignedStation: '',
  stationModule: '',
  avatarSeed: '',
};

/** Same Number() coercion as asPacked() when the POST body has no telemetry. */
function missingTelemetry(): DailyHealthRecord {
  return {
    date: '—',
    restingHR: Number(undefined),
    restingHRStatus: 'Normal',
    hrv: Number(undefined),
    vo2Max: Number(undefined),
    spo2: Number(undefined),
    avgSleepMinutes: Number(undefined),
    avgExerciseMinutes: Number(undefined),
    mentalStatus: 'Normal',
    musculoskeletalStatus: 'Normal',
    nutritionStatus: 'Normal',
    dailyActivities: [],
    hourlyTimeline: [],
  };
}

function providedTelemetry(): DailyHealthRecord {
  return {
    date: '2026/11/10',
    restingHR: 72,
    restingHRStatus: 'Normal',
    hrv: 30,
    vo2Max: 22,
    spo2: 98,
    avgSleepMinutes: 430,
    avgExerciseMinutes: 120,
    mentalStatus: 'Normal',
    musculoskeletalStatus: 'Normal',
    nutritionStatus: 'Normal',
    dailyActivities: [],
    hourlyTimeline: [],
  };
}

function mockRes() {
  const captured: { status: number; body: unknown } = { status: 0, body: null };
  const res: ApiResponse = {
    status(code) {
      captured.status = code;
      return res;
    },
    json(body) {
      captured.body = body;
      return body;
    },
    setHeader() {
      return undefined;
    },
  };
  return { res, captured };
}

describe('offline AURA reply without vitals', () => {
  const prevKey = process.env.GEMINI_API_KEY;

  afterEach(() => {
    if (prevKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = prevKey;
  });

  it('POST /api/ai-doctor status check with no vitals never prints NaN', async () => {
    delete process.env.GEMINI_API_KEY;
    const { res, captured } = mockRes();
    const req: ApiRequest = {
      method: 'POST',
      body: { lang: 'en', message: 'status check' },
      headers: {},
    };
    await handleAiDoctor(req, res);
    expect(captured.status).toBe(200);
    const body = captured.body as { replyText: string; detailedAnalysis: { metrics: Array<{ value: string; numericValue: number }> } };
    expect(body.replyText).not.toMatch(/NaN/i);
    expect(body.replyText).toContain(translate('en', 'ai.notProvided'));
    expect(body.replyText).not.toMatch(/Resting HR NaN/i);
    for (const m of body.detailedAnalysis.metrics) {
      expect(m.value).not.toMatch(/NaN/i);
      expect(Number.isFinite(m.numericValue)).toBe(true);
    }
  });

  it('says not provided in every locale when vitals are missing or non-finite', () => {
    const packed = packHealthPayload(profile, missingTelemetry(), null, null, null, 'en');
    expect(packed.metrics.find((m) => m.id === 'restingHR')).toBeUndefined();
    expect(packed.metrics.find((m) => m.id === 'spo2')).toBeUndefined();
    for (const lang of LANGUAGES.map((l) => l.id)) {
      const localePacked = packHealthPayload(profile, missingTelemetry(), null, null, null, lang);
      const out = buildOfflineTwoLevelAnalysis('status check', localePacked, lang);
      expect(out.replyText, lang).not.toMatch(/NaN/i);
      expect(out.replyText, lang).toContain(translate(lang, 'ai.notProvided'));
    }
    const inf = missingTelemetry();
    inf.restingHR = Number.POSITIVE_INFINITY;
    inf.spo2 = Number.NaN;
    const infPacked = packHealthPayload(profile, inf, null, null, null, 'en');
    const infOut = buildOfflineTwoLevelAnalysis('status check', infPacked, 'en');
    expect(infOut.replyText).not.toMatch(/NaN|Infinity/i);
    expect(infOut.replyText).toContain(translate('en', 'ai.notProvided'));
  });

  it('still prints finite vitals when they are provided', () => {
    const packed = packHealthPayload(profile, providedTelemetry(), null, null, null, 'en');
    const out = buildOfflineTwoLevelAnalysis('status check', packed, 'en');
    expect(out.replyText).toContain('72 bpm');
    expect(out.replyText).toContain('98%');
    expect(out.replyText).not.toContain(translate('en', 'ai.notProvided'));
  });

  it('packs HRP-grouped simulated metrics for AURA when a crew panel is supplied', () => {
    const alice = CREW.find((c) => c.id === 'astro-alice')!;
    const t = WORLD_EPOCH_MS + 2 * 86400000;
    const world = worldStateAt(t, null);
    const ship = world.ships.find((s) => s.def.id === alice.shipId) ?? null;
    const panel = crewPanelAt(alice, t, null, ship);
    const packed = packHealthPayload(profile, providedTelemetry(), null, null, null, 'en', panel);
    expect(packed.metrics.some((m) => m.id === 'bpSys')).toBe(true);
    expect(packed.metrics.some((m) => m.id === 'ppco2')).toBe(true);
    expect(packed.metrics.some((m) => m.id === 'pvt')).toBe(true);
    expect(packed.metrics.some((m) => m.id === 'ared')).toBe(true);
    expect(packed.systems.some((s) => s.system.includes('Neuro-ocular') || s.system.includes('SANS'))).toBe(true);
    expect(packed.metrics.every((m) => Number.isFinite(m.numericValue))).toBe(true);
    expect(packed.metrics.find((m) => m.id === 'ppco2')?.source).toBe(translate('en', 'badge.simTelemetry'));
  });
});
