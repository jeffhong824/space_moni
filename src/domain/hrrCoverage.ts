import type { Provenance } from './scienceTrace.ts';
import { HRR } from './metricExplain.ts';

export interface HrrCoverageRow {
  id: string;
  featureKey: string;
  hrp: string;
  url: string;
  std3001: string;
  source: string;
  provenance: Provenance;
}

/** 22-row Human Research Roadmap coverage matrix (A11). Disc is inactive. */
export const HRR_COVERAGE: HrrCoverageRow[] = [
  { id: 'radiation', featureKey: 'hrr.radiation', hrp: 'Space radiation', url: HRR.radiation, std3001: '[V2 6095] [V2 6161]', source: 'NOAA GOES / DONKI SEP', provenance: 'LIVE' },
  { id: 'cardio', featureKey: 'hrr.cardio', hrp: 'Cardiovascular', url: HRR.cardio, std3001: '[V2 7042]', source: 'Demo crew telemetry', provenance: 'SIMULATION' },
  { id: 'sans', featureKey: 'hrr.sans', hrp: 'SANS', url: HRR.sans, std3001: 'IRP-47065 §4.3.9', source: 'Amsler analog + logMAR', provenance: 'SIMULATION' },
  { id: 'bone', featureKey: 'hrr.bone', hrp: 'Bone', url: HRR.bone, std3001: '—', source: 'Demo bone-loss analog', provenance: 'SIMULATION' },
  { id: 'fitness', featureKey: 'hrr.fitness', hrp: 'Aerobic / muscle fitness', url: HRR.fitness, std3001: '—', source: 'ARED / CEVIS / T2 demo logs', provenance: 'SIMULATION' },
  { id: 'sensorimotor', featureKey: 'hrr.sensorimotor', hrp: 'Sensorimotor', url: HRR.sensorimotor, std3001: '[V2 7042]', source: 'Egress stand-test analog', provenance: 'SIMULATION' },
  { id: 'behavioral', featureKey: 'hrr.behavioral', hrp: 'Behavioral health', url: HRR.behavioral, std3001: '—', source: 'BH-201 Likert check-in', provenance: 'SIMULATION' },
  { id: 'team', featureKey: 'hrr.team', hrp: 'Team', url: HRR.team, std3001: '—', source: 'Team-201 cohesion/conflict', provenance: 'SIMULATION' },
  { id: 'sleep', featureKey: 'hrr.sleep', hrp: 'Sleep', url: HRR.sleep, std3001: '[V2 7073]', source: 'Sleep minutes / PVT analog', provenance: 'SIMULATION' },
  { id: 'immune', featureKey: 'hrr.immune', hrp: 'Immune', url: HRR.immune, std3001: '—', source: 'OSD-569 WBC analog + illness log', provenance: 'SOURCED-STATIC' },
  { id: 'hostMicro', featureKey: 'hrr.hostMicro', hrp: 'Host-microorganism', url: HRR.hostMicro, std3001: '—', source: 'Illness log (sore throat)', provenance: 'SIMULATION' },
  { id: 'nutrition', featureKey: 'hrr.nutrition', hrp: 'Nutrition', url: HRR.nutrition, std3001: '—', source: 'Demo kcal / mass', provenance: 'SIMULATION' },
  { id: 'renal', featureKey: 'hrr.renal', hrp: 'Renal stone', url: HRR.renal, std3001: '—', source: 'Fluid in/out demo', provenance: 'SIMULATION' },
  { id: 'medications', featureKey: 'hrr.medications', hrp: 'Medications', url: HRR.medications, std3001: '—', source: 'Medical log (demo)', provenance: 'SIMULATION' },
  { id: 'inMission', featureKey: 'hrr.inMission', hrp: 'In-mission medical', url: HRR.inMission, std3001: '—', source: 'Symptom log / CMO recs', provenance: 'SIMULATION' },
  { id: 'hypoxia', featureKey: 'hrr.hypoxia', hrp: 'Hypoxia / cabin gas', url: HRR.hypoxia, std3001: '—', source: 'Demo ECLSS ppO2 / SpO2', provenance: 'SIMULATION' },
  { id: 'dust', featureKey: 'hrr.dust', hrp: 'Lunar/planetary dust', url: HRR.dust, std3001: '—', source: 'Post-EVA eye/nasal/throat check', provenance: 'SIMULATION' },
  { id: 'dcs', featureKey: 'hrr.dcs', hrp: 'Decompression sickness', url: HRR.dcs, std3001: '—', source: 'Prebreathe checklist (SIMULATION)', provenance: 'SIMULATION' },
  { id: 'eva', featureKey: 'hrr.eva', hrp: 'EVA', url: HRR.eva, std3001: '—', source: 'EVA readiness checklist', provenance: 'SIMULATION' },
  { id: 'dynamicLoads', featureKey: 'hrr.dynamicLoads', hrp: 'Dynamic loads', url: HRR.dynamicLoads, std3001: '—', source: 'Hand/shoulder post-EVA check', provenance: 'SIMULATION' },
  { id: 'eihso', featureKey: 'hrr.eihso', hrp: 'Earth-independent health & ops', url: HRR.eihso, std3001: 'EIHSO-202', source: 'Delay badge + CMO Doc-in-a-Box', provenance: 'SOURCED-STATIC' },
  { id: 'disc', featureKey: 'hrr.disc', hrp: 'Intervertebral disc (inactive)', url: 'https://humanresearchroadmap.nasa.gov/', std3001: '—', source: 'HRR lists this risk as inactive — not scored here', provenance: 'SOURCED-STATIC' },
];
