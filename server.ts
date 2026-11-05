import express, { Request, Response } from 'express';
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
const PORT = 3000;

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

// Server-side AI Doctor & Operations Endpoint
app.post('/api/ai-doctor', async (req: Request, res: Response) => {
  try {
    const { message, astronaut, telemetry, currentTasks, history } = req.body;

    const ai = getGeminiClient();

    if (!ai) {
      // Offline fallback when no key is configured
      return res.json({
        replyText: `[AURA Flight Surgeon Offline Mode] Receiving transmission: "${message}". Telemetry indicates Resting HR at ${telemetry?.restingHR || 103} bpm and SpO2 at ${telemetry?.spo2 || 95}%. Recommending immediate 20-minute isotonic rehydration countermeasure and scheduled rest cycle before next botany session.`,
        suggestedActions: [
          {
            id: 'act-' + Date.now() + '-1',
            label: 'Schedule 20-min Rehydration & Electrolyte Protocol',
            type: 'ADD_TASK',
            payload: {
              title: 'Rehydration & Electrolyte Balance Protocol',
              module: 'Tranquility ECLSS',
              priority: 'High',
              category: 'Health Countermeasure',
            },
          },
          {
            id: 'act-' + Date.now() + '-2',
            label: 'Log Tachycardia Observation for Ground Telemetry',
            type: 'LOG_ANOMALY',
            payload: {
              note: `Resting HR at ${telemetry?.restingHR || 103} bpm. Crew flagged via voice check.`,
            },
          },
        ],
        healthAssessment: {
          status: 'Attention Required',
          summary: 'Elevated resting HR with microgravity cardiovascular adaptation. No critical hypoxia detected.',
        },
      });
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

Tone & Style:
- Speak as a calm, highly capable aerospace doctor / flight surgeon with direct, reassuring language.
- Keep the verbal response concise and conversational (2-4 sentences max so it reads smoothly as spoken audio).
- Always assess both the physiological symptom/question and any relevant station tasks or experiments (e.g. Plant molecular observation, Plant catalyst experiment).
- Provide 2 to 3 concrete interactive action suggestions with structured payloads that the astronaut can click to immediately append tasks to the station schedule or log medical flags.
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
              description: 'The spoken dialogue response from AURA to the astronaut.',
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
                  label: { type: Type.STRING, description: 'Action button label under 10 words' },
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
          },
          required: ['replyText', 'healthAssessment', 'suggestedActions'],
        },
      },
    });

    const response = (await Promise.race([generatePromise, timeoutPromise])) as any;
    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini AI doctor error:', error);
    // Return resilient flight-surgeon consultation payload
    return res.json({
      replyText: `AURA Flight Surgeon responding. Telemetry analysis indicates resting heart rate is elevated at ${req.body.telemetry?.restingHR || 103} bpm with reduced HRV (${req.body.telemetry?.hrv || 14} ms). I recommend completing the 20-minute isotonic rehydration countermeasure before continuing your botany research in Columbus BioLab.`,
      suggestedActions: [
        {
          id: 'act-fallback-1',
          label: 'Schedule 20-min Rehydration & Electrolyte Protocol',
          type: 'ADD_TASK',
          payload: {
            title: 'Isotonic Rehydration & Cardiovascular Protocol',
            module: 'Tranquility ECLSS',
            priority: 'High',
            description: 'Oral fluid loading of 0.9% saline electrolyte to stabilize blood volume.',
          },
        },
        {
          id: 'act-fallback-2',
          label: 'Log Tachycardia Observation for Ground Telemetry',
          type: 'LOG_ANOMALY',
          payload: {
            note: `Tachycardia observed: Resting HR ${req.body.telemetry?.restingHR || 103} bpm, HRV ${req.body.telemetry?.hrv || 14} ms. Advised oral hydration.`,
          },
        },
      ],
      healthAssessment: {
        status: 'Attention Required',
        summary: 'Elevated resting HR with microgravity cardiovascular adaptation. No acute hypoxia.',
      },
    });
  }
});

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
