import { GoogleGenAI, Type } from '@google/genai';
import { packHealthPayload, buildOfflineTwoLevelAnalysis, thresholdTableForPrompt } from '../domain/healthPacking.ts';
import { DEFAULT_LANG, isLangId, translate } from '../i18n/index.ts';
import type { AstronautProfile, DailyHealthRecord, EnvironmentalMetrics } from '../types.ts';
import { applyRateLimitHeaders, consumeRateLimit } from './rateLimit.ts';
import { clientIp, type ApiRequest, type ApiResponse } from './http.ts';

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || !apiKey.trim()) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function asPacked(reqBody: Record<string, unknown>) {
  const astronaut = (reqBody.astronaut || {}) as AstronautProfile;
  const telemetry = (reqBody.telemetry || {}) as DailyHealthRecord;
  const envMetrics = (reqBody.envMetrics || null) as EnvironmentalMetrics | null;
  const spaceEnvironment = reqBody.spaceEnvironment ?? null;
  const packedIncoming = reqBody.packed as ReturnType<typeof packHealthPayload> | undefined;

  if (packedIncoming?.metrics?.length) {
    return packedIncoming;
  }

  const record: DailyHealthRecord = {
    date: telemetry.date || '—',
    restingHR: Number(telemetry.restingHR),
    restingHRStatus: telemetry.restingHRStatus || 'Normal',
    hrv: Number(telemetry.hrv),
    vo2Max: Number(telemetry.vo2Max),
    spo2: Number(telemetry.spo2),
    avgSleepMinutes: Number(telemetry.avgSleepMinutes),
    avgExerciseMinutes: Number(telemetry.avgExerciseMinutes),
    mentalStatus: telemetry.mentalStatus || 'Normal',
    musculoskeletalStatus: telemetry.musculoskeletalStatus || 'Normal',
    nutritionStatus: telemetry.nutritionStatus || 'Normal',
    dailyActivities: telemetry.dailyActivities || [],
    hourlyTimeline: telemetry.hourlyTimeline || [],
    clinicalObservations: telemetry.clinicalObservations,
  };

  const profile: AstronautProfile = {
    id: astronaut.id || 'unknown',
    name: astronaut.name || 'Crew',
    gender: astronaut.gender || 'Other',
    age: Number(astronaut.age) || 0,
    role: astronaut.role || 'Mission Specialist',
    missionStartDate: astronaut.missionStartDate || '',
    missionCurrentDate: astronaut.missionCurrentDate || '',
    missionDuration: astronaut.missionDuration || '',
    missionDaysElapsed: Number(astronaut.missionDaysElapsed) || 0,
    bloodType: astronaut.bloodType || '',
    assignedStation: astronaut.assignedStation || '',
    stationModule: astronaut.stationModule || '',
    avatarSeed: astronaut.avatarSeed || '',
  };

  const lang = isLangId(String(reqBody.lang || '')) ? String(reqBody.lang) : DEFAULT_LANG;
  return packHealthPayload(profile, record, envMetrics, spaceEnvironment as never, null, lang);
}

export async function handleAiDoctor(req: ApiRequest, res: ApiResponse) {
  if (req.method && req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const limit = consumeRateLimit(`ai-doctor:${clientIp(req)}`);
  applyRateLimitHeaders(res, limit);
  if (!limit.ok) {
    return res.status(429).json({
      error: 'rate_limited',
      message: translate(isLangId(String((req.body as { lang?: string } | undefined)?.lang || '')) ? String((req.body as { lang?: string }).lang) : DEFAULT_LANG, 'ai.rateLimited', { s: limit.retryAfterSec }),
      retryAfterSec: limit.retryAfterSec,
    });
  }

  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
  const lang = isLangId(String(body.lang || '')) ? String(body.lang) : DEFAULT_LANG;
  const message = String(body.message || translate(lang, 'astro.callAura'));
  const packed = asPacked(body);
  const history = Array.isArray(body.history) ? body.history.slice(-4) : [];
  const currentTasks = Array.isArray(body.currentTasks) ? body.currentTasks.slice(0, 8) : [];

  try {
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(200).json(buildOfflineTwoLevelAnalysis(message, packed, lang));
    }

    const langName =
      lang === 'zh-Hant-TW' ? 'Traditional Chinese (zh-Hant-TW)' : lang === 'es' ? 'Spanish' : lang === 'ja' ? 'Japanese' : 'English';

    const systemInstruction = `You are AURA (Autonomous Utility & Resuscitation Assistant), an orbital AI flight surgeon.
All user-visible text MUST be in ${langName} (locale ${lang}).
Status vocabulary MUST be only: English Normal/Caution/Critical; Traditional Chinese 正常/注意/危急; Spanish Normal/Precaución/Crítico; Japanese 正常/注意/危険.

Data honesty:
- Crew physiology is simulated demonstration telemetry. Never claim it is live flight hardware.
- Cabin ECLSS readings are simulated, not a NASA public API.
- Space weather may only use official observations in the request. Missing fields stay "no data". Never invent Kp, flares, CME, or radiation numbers.

Demo clinical bands (must be used consistently):
${thresholdTableForPrompt()}

Packed health JSON:
${JSON.stringify(packed)}

Current station tasks (summary):
${JSON.stringify(currentTasks)}

Response:
- replyText: 2–4 spoken sentences in ${langName}; overall assessment then next step.
- healthAssessment must match packed overall.status unless you explain a change.
- detailedAnalysis.metrics and systems must cover every packed item, with units and band interpretation.
- Provide 2–3 clickable actions (ADD_TASK / LOG_ANOMALY). Labels in ${langName}, under 18 characters.`;

    const prompt = `Crew message: "${message}"
Recent dialogue: ${JSON.stringify(history)}`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI generation timed out after 8s')), 8000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replyText: {
              type: Type.STRING,
              description: `AURA spoken reply in ${langName}`,
            },
            healthAssessment: {
              type: Type.OBJECT,
              properties: {
                status: {
                  type: Type.STRING,
                  enum: ['Nominal', 'Attention Required', 'Critical'],
                },
                summary: { type: Type.STRING },
              },
              required: ['status', 'summary'],
            },
            suggestedActions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  type: {
                    type: Type.STRING,
                    enum: ['ADD_TASK', 'LOG_ANOMALY', 'UPDATE_VITALS', 'NOTIFY_MISSION_CONTROL'],
                  },
                  payload: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      module: { type: Type.STRING },
                      priority: { type: Type.STRING },
                      category: { type: Type.STRING },
                      note: { type: Type.STRING },
                    },
                  },
                },
                required: ['id', 'label', 'type'],
              },
            },
            detailedAnalysis: {
              type: Type.OBJECT,
              properties: {
                metrics: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      metric: { type: Type.STRING },
                      value: { type: Type.STRING },
                      status: { type: Type.STRING, enum: ['Normal', 'Attention', 'Critical'] },
                      analysis: { type: Type.STRING },
                      recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['metric', 'value', 'status', 'analysis', 'recommendations'],
                  },
                },
                systems: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      system: {
                        type: Type.STRING,
                        enum: ['Cardiovascular', 'Respiratory', 'Sleep', 'Exercise', 'Mental', 'Musculoskeletal', 'Nutrition'],
                      },
                      status: { type: Type.STRING, enum: ['Normal', 'Attention', 'Critical'] },
                      summary: { type: Type.STRING },
                      concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
                      recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['system', 'status', 'summary', 'concerns', 'recommendations'],
                  },
                },
              },
              required: ['metrics', 'systems'],
            },
          },
          required: ['replyText', 'healthAssessment', 'suggestedActions', 'detailedAnalysis'],
        },
      },
    });

    const response = (await Promise.race([generatePromise, timeoutPromise])) as { text?: string };
    const parsed = JSON.parse(response.text || '{}');
    const offline = buildOfflineTwoLevelAnalysis(message, packed);
    return res.status(200).json({
      ...offline,
      ...parsed,
      detailedAnalysis: parsed.detailedAnalysis || offline.detailedAnalysis,
      healthAssessment: parsed.healthAssessment || offline.healthAssessment,
      analysisMode: 'live_gemini',
      dataQuality: offline.dataQuality,
    });
  } catch (error: unknown) {
    console.error('Gemini AI doctor error:', error);
    return res.status(200).json(buildOfflineTwoLevelAnalysis(message, packed, lang));
  }
}
