import express, { type Request, type Response } from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

// Ensure HMR is disabled in AI Studio preview to prevent WebSocket proxy disconnect errors
if (process.env.DISABLE_HMR === undefined) {
  process.env.DISABLE_HMR = 'true';
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent header as required
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

// Server-side AI Doctor & Operations Endpoint with detailed analysis
app.post('/api/ai-doctor', async (req: Request, res: Response) => {
  try {
    const { message, astronaut, telemetry, currentTasks, history } = req.body;

    const ai = getGeminiClient();

    if (!ai) {
      // Offline fallback with detailed analysis
      return res.json(generateOfflineFallback(message, astronaut, telemetry));
    }

    const systemInstruction = `
You are AURA (Autonomous Utility & Resuscitation Assistant), the certified onboard AI Medical Officer & Flight Operations Specialist on the International Space Station / Orbital Habitat.
Current astronaut interacting with you:
- Name: ${astronaut?.name || 'Alice Smith'}
- Gender & Age: ${astronaut?.gender || 'Female'}, ${astronaut?.age || 46}
- Specialty: ${astronaut?.role || 'Botanist'}
- Mission Day: ${astronaut?.missionDuration || '10 month 2 days'} (Started ${astronaut?.missionStartDate || '2026/01/21'})

Current Biometric Telemetry:
- Resting Heart Rate: ${telemetry?.restingHR ?? 103} bpm (Normal range is 60-85; 103 is elevated/tachycardic in microgravity)
- HRV: ${telemetry?.hrv ?? 14} ms (Suppressed / elevated autonomic stress)
- VO2 Max: ${telemetry?.vo2Max ?? 20.0} mL/kg/min
- SpO2: ${telemetry?.spo2 ?? 95}% (Acceptable orbital cabin range, but keep monitored)
- Avg Sleep: ${telemetry?.avgSleepMinutes ?? 305} minutes (~5.1 hours, chronic mild sleep deprivation)
- Avg Exercise: ${telemetry?.avgExerciseMinutes ?? 175} minutes
- System Status: Mental (${telemetry?.mentalStatus || 'Normal'}), Musculoskeletal (${telemetry?.musculoskeletalStatus || 'Normal'}), Nutrition (${telemetry?.nutritionStatus || 'Normal'})

Station Habitat Atmosphere:
- Oxygen: 20.9% Nominal
- Carbon Dioxide: 0.38% (slight elevation common in orbital modules)
- Cabin Pressure: 101.3 kPa

Response Requirements:
- Respond in Traditional Chinese (zh-Hant-TW) for user-facing text
- Provide both overall assessment AND detailed per-metric/system analysis
- Keep verbal response concise (2-4 sentences for spoken audio)
- Assess physiological symptoms and relate to station tasks/experiments
- Provide 2-3 actionable suggestions with structured payloads
`;

    const prompt = `Astronaut Message: "${message || 'Run a quick biometrics check and advise on today schedule.'}"
Past conversation context: ${JSON.stringify(history?.slice(-4) || [])}`;

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
              description: 'The spoken dialogue response from AURA in Traditional Chinese (zh-Hant-TW)',
            },
            healthAssessment: {
              type: Type.OBJECT,
              properties: {
                status: {
                  type: Type.STRING,
                  enum: ['Nominal', 'Attention Required', 'Critical'],
                },
                summary: {
                  type: Type.STRING,
                  description: 'Overall health summary in Traditional Chinese',
                },
              },
              required: ['status', 'summary'],
            },
            suggestedActions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING, description: 'Action button label in Traditional Chinese, under 15 characters' },
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
              description: 'Detailed per-metric and per-system health analysis',
              properties: {
                metrics: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      metric: { type: Type.STRING, description: 'Metric name in Traditional Chinese' },
                      value: { type: Type.STRING },
                      status: { type: Type.STRING, enum: ['Normal', 'Attention', 'Critical'] },
                      analysis: { type: Type.STRING, description: 'Detailed analysis in Traditional Chinese' },
                      recommendations: { 
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'Specific recommendations in Traditional Chinese'
                      },
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
                      summary: { type: Type.STRING, description: 'System summary in Traditional Chinese' },
                      concerns: { 
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'Specific concerns in Traditional Chinese'
                      },
                      recommendations: { 
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'System-level recommendations in Traditional Chinese'
                      },
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

    const response = (await Promise.race([generatePromise, timeoutPromise])) as any;
    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini AI doctor error:', error);
    const { message, astronaut, telemetry } = req.body;
    return res.json(generateOfflineFallback(message, astronaut, telemetry));
  }
});

// NASA Space Environment Data Endpoint
app.get('/api/nasa/space-environment', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const startDate = formatDate(sevenDaysAgo);
    const endDate = formatDate(now);

    const NASA_API_KEY = 'DEMO_KEY';
    const DONKI_BASE = 'https://api.nasa.gov/DONKI';

    // Fetch space weather data from NASA DONKI
    const [flareRes, gstRes, cmeRes] = await Promise.all([
      fetch(`${DONKI_BASE}/FLR?startDate=${startDate}&endDate=${endDate}&api_key=${NASA_API_KEY}`, {
        signal: AbortSignal.timeout(8000),
      }).catch(() => null),
      fetch(`${DONKI_BASE}/GST?startDate=${startDate}&endDate=${endDate}&api_key=${NASA_API_KEY}`, {
        signal: AbortSignal.timeout(8000),
      }).catch(() => null),
      fetch(`${DONKI_BASE}/CME?startDate=${startDate}&endDate=${endDate}&api_key=${NASA_API_KEY}`, {
        signal: AbortSignal.timeout(8000),
      }).catch(() => null),
    ]);

    const solarFlares = flareRes?.ok ? await flareRes.json() : [];
    const geomagneticStorms = gstRes?.ok ? await gstRes.json() : [];
    const coronalMassEjections = cmeRes?.ok ? await cmeRes.json() : [];

    // Calculate summary metrics
    const highestFlare = solarFlares.reduce((max: string, flare: any) => {
      const current = flare.classType || 'A0.0';
      return current > max ? current : max;
    }, 'A0.0');

    const maxKp = geomagneticStorms.reduce((max: number, storm: any) => {
      const stormMax = Math.max(
        storm.kpIndex || 0,
        ...(storm.allKpIndex || []).map((k: any) => k.kpIndex || 0)
      );
      return Math.max(max, stormMax);
    }, 0);

    let radiationRisk: string = 'Low';
    const flareClass = highestFlare.charAt(0);
    if (flareClass === 'X' || maxKp >= 7) radiationRisk = 'Severe';
    else if (flareClass === 'M' || maxKp >= 5) radiationRisk = 'High';
    else if (flareClass === 'C' || maxKp >= 3) radiationRisk = 'Moderate';

    return res.json({
      timestamp: now.toISOString(),
      solarFlares: solarFlares.slice(0, 10),
      geomagneticStorms: geomagneticStorms.slice(0, 5),
      coronalMassEjections: coronalMassEjections.slice(0, 5),
      summary: {
        totalEvents: solarFlares.length + geomagneticStorms.length + coronalMassEjections.length,
        highestSolarFlareClass: highestFlare,
        maxKpIndex: maxKp,
        radiationRisk,
      },
    });
  } catch (error: any) {
    console.error('NASA API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch NASA space environment data',
      timestamp: new Date().toISOString(),
      solarFlares: [],
      geomagneticStorms: [],
      coronalMassEjections: [],
      summary: {
        totalEvents: 0,
        highestSolarFlareClass: 'N/A',
        maxKpIndex: 0,
        radiationRisk: 'Unknown',
      },
    });
  }
});

// Offline fallback with detailed analysis in Traditional Chinese
function generateOfflineFallback(message: string, astronaut: any, telemetry: any) {
  const metrics = [
    {
      metric: '靜息心率',
      value: `${telemetry?.restingHR || 103} bpm`,
      status: (telemetry?.restingHR || 103) > 100 ? 'Critical' : (telemetry?.restingHR || 103) > 90 ? 'Attention' : 'Normal',
      analysis: (telemetry?.restingHR || 103) > 100 
        ? '檢測到心搏過速。微重力環境下靜息心率顯著升高，可能與體液轉移、自主神經失調或脫水有關。'
        : '心率在軌道環境可接受範圍內。',
      recommendations: (telemetry?.restingHR || 103) > 100 
        ? ['立即執行等滲補液方案', '減少高強度運動', '監測血氧飽和度變化']
        : ['維持常規運動對策', '保持充足水分攝取'],
    },
    {
      metric: '心率變異性 (HRV)',
      value: `${telemetry?.hrv || 14} ms`,
      status: (telemetry?.hrv || 14) < 20 ? 'Critical' : (telemetry?.hrv || 14) < 25 ? 'Attention' : 'Normal',
      analysis: (telemetry?.hrv || 14) < 20
        ? 'HRV 嚴重抑制，表示自主神經系統壓力過大。可能與睡眠不足、過度訓練或心理壓力相關。'
        : 'HRV 正常，自主神經調節良好。',
      recommendations: (telemetry?.hrv || 14) < 20
        ? ['安排強制休息週期', '減少訓練強度', '進行放鬆訓練']
        : ['維持平衡的工作-休息週期'],
    },
    {
      metric: '血氧飽和度',
      value: `${telemetry?.spo2 || 95}%`,
      status: (telemetry?.spo2 || 95) < 94 ? 'Critical' : (telemetry?.spo2 || 95) < 96 ? 'Attention' : 'Normal',
      analysis: (telemetry?.spo2 || 95) < 94
        ? '血氧偏低，需立即檢查艙內氧氣濃度。'
        : '血氧飽和度正常。',
      recommendations: (telemetry?.spo2 || 95) < 94
        ? ['檢查 ECLSS 氧氣生成系統', '評估呼吸系統功能']
        : ['定期監測艙內氣體成分'],
    },
  ];

  const systems = [
    {
      system: 'Cardiovascular',
      status: (telemetry?.restingHR || 103) > 100 ? 'Attention' : 'Normal',
      summary: (telemetry?.restingHR || 103) > 100
        ? '心血管系統顯示微重力適應壓力，心搏過速伴隨自主神經抑制。'
        : '心血管系統適應良好。',
      concerns: (telemetry?.restingHR || 103) > 100 ? ['靜息心搏過速', 'HRV 抑制'] : [],
      recommendations: (telemetry?.restingHR || 103) > 100
        ? ['執行等滲補液方案', '調整運動強度']
        : ['維持常規 ARED 訓練'],
    },
    {
      system: 'Respiratory',
      status: (telemetry?.spo2 || 95) < 95 ? 'Attention' : 'Normal',
      summary: (telemetry?.spo2 || 95) < 95
        ? '血氧飽和度偏低，需檢查艙內環境。'
        : '呼吸系統功能正常。',
      concerns: (telemetry?.spo2 || 95) < 95 ? ['SpO2 低於理想值'] : [],
      recommendations: (telemetry?.spo2 || 95) < 95
        ? ['檢查 CO2 清除效率', '確認氧氣濃度']
        : ['定期監測艙內氣體'],
    },
  ];

  return {
    replyText: `[AURA 飛行外科醫師離線模式] 收到訊息：「${message}」。遙測數據顯示靜息心率為 ${telemetry?.restingHR || 103} bpm，血氧飽和度為 ${telemetry?.spo2 || 95}%。建議立即執行 20 分鐘等滲補液對策，並在下次植物學實驗前安排休息週期。`,
    suggestedActions: [
      {
        id: 'act-' + Date.now() + '-1',
        label: '安排補液與電解質平衡方案',
        type: 'ADD_TASK',
        payload: {
          title: '補液與電解質平衡方案',
          module: 'Tranquility ECLSS',
          priority: 'High',
          category: 'Health Countermeasure',
        },
      },
      {
        id: 'act-' + Date.now() + '-2',
        label: '記錄心搏過速觀測',
        type: 'LOG_ANOMALY',
        payload: {
          note: `靜息心率 ${telemetry?.restingHR || 103} bpm。太空人透過語音通報。`,
        },
      },
    ],
    healthAssessment: {
      status: 'Attention Required',
      summary: '心血管系統顯示微重力適應壓力。未檢測到危急缺氧狀態。',
    },
    detailedAnalysis: {
      metrics,
      systems,
    },
  };
}

// Setup Vite or static serving
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
