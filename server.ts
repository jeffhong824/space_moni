import express, { type Request, type Response } from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { packHealthPayload, buildOfflineTwoLevelAnalysis, thresholdTableForPrompt } from './src/domain/healthPacking.ts';
import { fetchSpaceEnvironment } from './src/server/fetchSpaceEnvironment.ts';
import type { AstronautProfile, DailyHealthRecord, EnvironmentalMetrics } from './src/types.ts';

dotenv.config();

if (process.env.DISABLE_HMR === undefined) {
  process.env.DISABLE_HMR = 'true';
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

const getGeminiClient = () => {
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
};

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

  return packHealthPayload(profile, record, envMetrics, spaceEnvironment as never);
}

app.post('/api/ai-doctor', async (req: Request, res: Response) => {
  const message = String(req.body?.message || '請依打包後的生理與空間天氣資料進行健康檢核。');
  const packed = asPacked(req.body || {});
  const history = Array.isArray(req.body?.history) ? req.body.history.slice(-4) : [];
  const currentTasks = Array.isArray(req.body?.currentTasks) ? req.body.currentTasks.slice(0, 8) : [];

  try {
    const ai = getGeminiClient();

    if (!ai) {
      return res.json(buildOfflineTwoLevelAnalysis(message, packed));
    }

    const systemInstruction = `你是 AURA（Autonomous Utility & Resuscitation Assistant），軌道站 AI 飛行外科醫師。
所有對使用者可見的文字必須使用繁體中文（zh-Hant-TW）。

資料誠實性：
- 機組生理遙測為「模擬示範資料」，不得宣稱來自真實飛行硬體。
- 艙內 ECLSS 若標示為示範讀數，不得當成 NASA 公開 API。
- 空間天氣只能使用請求中提供的官方觀測；沒有的欄位寫「無資料」，禁止編造 Kp、閃焰、CME 或輻射數字。

示範臨床門檻（必須一致使用）：
${thresholdTableForPrompt()}

已打包的健康資料 JSON：
${JSON.stringify(packed)}

當前站務任務（摘要）：
${JSON.stringify(currentTasks)}

回應要求：
- replyText：2–4 句口語對話，先給整體評估再給下一步。
- healthAssessment 必須與打包後的 overall.status 一致，除非你有明確理由調整並在 summary 說明。
- detailedAnalysis.metrics 與 systems 必須覆蓋打包清單中的每一項，含單位與門檻解讀。
- 提供 2–3 個可點擊行動（ADD_TASK / LOG_ANOMALY 等），標籤繁中、短於 18 字。`;

    const prompt = `太空人訊息：「${message}」
近期對話：${JSON.stringify(history)}`;

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
              description: 'AURA spoken reply in Traditional Chinese',
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
    return res.json({
      ...offline,
      ...parsed,
      detailedAnalysis: parsed.detailedAnalysis || offline.detailedAnalysis,
      healthAssessment: parsed.healthAssessment || offline.healthAssessment,
      analysisMode: 'live_gemini',
      dataQuality: offline.dataQuality,
    });
  } catch (error: unknown) {
    console.error('Gemini AI doctor error:', error);
    return res.json(buildOfflineTwoLevelAnalysis(message, packed));
  }
});

app.get('/api/nasa/space-environment', async (req: Request, res: Response) => {
  try {
    const force = req.query.refresh === '1';
    const payload = await fetchSpaceEnvironment(force);
    return res.json(payload);
  } catch (error: unknown) {
    console.error('Space environment API error:', error);
    return res.status(503).json({
      fetchedAt: new Date().toISOString(),
      overallStatus: 'unavailable',
      notices: ['官方空間天氣饋送暫時無法使用。未填補任何 NASA／NOAA 數值。'],
      sources: [],
      observations: { kp: null, goesXray: null, solarWind: null, protons: null },
      events: { solarFlares: [], geomagneticStorms: [], coronalMassEjections: [], swpcAlerts: [] },
      error: error instanceof Error ? error.message : 'unavailable',
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProd) {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: false,
        hmr: isHmrDisabled
          ? false
          : {
              server: httpServer,
            },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`SpaceMoni server listening on port ${PORT}`);
  });
}

startServer();
