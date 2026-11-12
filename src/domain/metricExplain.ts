import { METRIC_IDS, type MetricId } from './crewSystems.ts';

/** Human Research Roadmap risk pages verified 2026-11-11. */
export const HRR = {
  radiation: 'https://humanresearchroadmap.nasa.gov/Risks/?i=96',
  cardio: 'https://humanresearchroadmap.nasa.gov/Risks/?i=179',
  sans: 'https://humanresearchroadmap.nasa.gov/Risks/?i=105',
  bone: 'https://humanresearchroadmap.nasa.gov/Risks/?i=77',
  fitness: 'https://humanresearchroadmap.nasa.gov/Risks/?i=180',
  sensorimotor: 'https://humanresearchroadmap.nasa.gov/Risks/?i=88',
  behavioral: 'https://humanresearchroadmap.nasa.gov/Risks/?i=99',
  team: 'https://humanresearchroadmap.nasa.gov/Risks/?i=101',
  sleep: 'https://humanresearchroadmap.nasa.gov/Risks/?i=100',
  immune: 'https://humanresearchroadmap.nasa.gov/Risks/?i=85',
  hostMicro: 'https://humanresearchroadmap.nasa.gov/Risks/?i=80',
  nutrition: 'https://humanresearchroadmap.nasa.gov/Risks/?i=176',
  renal: 'https://humanresearchroadmap.nasa.gov/Risks/?i=81',
  medications: 'https://humanresearchroadmap.nasa.gov/Risks/?i=177',
  inMission: 'https://humanresearchroadmap.nasa.gov/Risks/?i=95',
  hypoxia: 'https://humanresearchroadmap.nasa.gov/Risks/?i=173',
  dust: 'https://humanresearchroadmap.nasa.gov/Risks/?i=82',
  dcs: 'https://humanresearchroadmap.nasa.gov/Risks/?i=168',
  eva: 'https://humanresearchroadmap.nasa.gov/Risks/?i=84',
  dynamicLoads: 'https://humanresearchroadmap.nasa.gov/Risks/?i=167',
  eihso: 'https://humanresearchroadmap.nasa.gov/Risks/?i=175',
} as const;

const HRR_BY_METRIC: Record<MetricId, string> = {
  hr: HRR.cardio,
  bpSys: HRR.cardio,
  bpDia: HRR.cardio,
  ecg: HRR.cardio,
  ortho: HRR.cardio,
  rr: HRR.hypoxia,
  spo2: HRR.hypoxia,
  hrv: HRR.cardio,
  ppco2: HRR.hypoxia,
  ppo2: HRR.hypoxia,
  cabinTemp: HRR.eihso,
  humidity: HRR.eihso,
  doseDay: HRR.radiation,
  doseCum: HRR.radiation,
  careerPct: HRR.radiation,
  speShelter: HRR.radiation,
  goes: HRR.radiation,
  kp: HRR.radiation,
  bone: HRR.bone,
  grip: HRR.dynamicLoads,
  ared: HRR.fitness,
  cevis: HRR.fitness,
  t2: HRR.fitness,
  acuity: HRR.sans,
  headache: HRR.sans,
  sleepH: HRR.sleep,
  sleepQ: HRR.sleep,
  fatigue: HRR.sleep,
  workload: HRR.behavioral,
  pvt: HRR.sleep,
  kcal: HRR.nutrition,
  fluidIn: HRR.renal,
  fluidOut: HRR.renal,
  mass: HRR.nutrition,
  mood: HRR.behavioral,
  stress: HRR.behavioral,
  isolation: HRR.team,
  meds: HRR.medications,
  symptoms: HRR.inMission,
};

export function hrrUrlForMetric(id: string): string | null {
  return (HRR_BY_METRIC as Record<string, string>)[id] ?? null;
}

export function explainKeys(id: string): { how: string; why: string; when: string } {
  return {
    how: `explain.${id}.how`,
    why: `explain.${id}.why`,
    when: `explain.${id}.when`,
  };
}

export { METRIC_IDS };
