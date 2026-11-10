import type { AstronautProfile, DailyHealthRecord, EnvironmentalMetrics, StationTask } from '../types';
import type { SpaceEnvironmentPayload } from '../domain/spaceWeather';
import { packHealthPayload, buildOfflineTwoLevelAnalysis, type TwoLevelAnalysis } from '../domain/healthPacking';
import type { SelfCheckEntry } from '../domain/healthThresholds';

export async function callAiDoctor(input: {
  message: string;
  astronaut: AstronautProfile;
  telemetry: DailyHealthRecord;
  envMetrics?: EnvironmentalMetrics;
  spaceEnvironment?: SpaceEnvironmentPayload | null;
  selfCheck?: SelfCheckEntry | null;
  tasks?: StationTask[];
  history?: Array<{ sender: string; text: string }>;
}): Promise<TwoLevelAnalysis> {
  const packed = packHealthPayload(
    input.astronaut,
    input.telemetry,
    input.envMetrics,
    input.spaceEnvironment ?? null,
    input.selfCheck ?? null
  );

  try {
    const response = await fetch('/api/ai-doctor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: input.message,
        packed,
        astronaut: input.astronaut,
        telemetry: input.telemetry,
        envMetrics: input.envMetrics,
        spaceEnvironment: input.spaceEnvironment,
        currentTasks: (input.tasks || []).slice(0, 8).map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status,
        })),
        history: input.history,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Doctor HTTP ${response.status}`);
    }

    return (await response.json()) as TwoLevelAnalysis;
  } catch (error) {
    console.error('AI Doctor API error:', error);
    return buildOfflineTwoLevelAnalysis(input.message, packed);
  }
}
