/**
 * AURA as crew medical officer decision support ("Doc-in-a-Box" offline concept).
 * Every recommendation cites a NASA-STD-3001 / HRP ID, has confidence, and is
 * explicitly not a diagnosis. Confirm / dismiss is a CMO action.
 */
import type { ClinicalStatus } from './healthThresholds.ts';
import { classifyAction, type ActionClass } from './earthDelay.ts';
import { BH_201 } from './moodCheckin.ts';
import { EGRESS_CITE } from './egressReady.ts';
import { SANS_CITE } from './sansCheck.ts';
import { SPE_30DAY_CITE, STD3001_CAREER_CITE } from './speAlert.ts';
import { EIHSO_202 } from './earthDelay.ts';

export const DOC_IN_A_BOX = {
  id: 'Doc-in-a-Box',
  doc: 'NASA exploration medical capability / Earth-independent ops (HHP 2023)',
  text: 'Robust on-board medical capabilities and decision support so crew can monitor health without immediate ground. Offline AURA mirrors this concept.',
};

export type CmoConfidence = 'high' | 'medium' | 'low';

export interface CmoRecommendation {
  id: string;
  titleKey: string;
  detailKey: string;
  detailVars?: Record<string, string | number>;
  citeId: string;
  citeDoc: string;
  confidence: CmoConfidence;
  autonomy: ActionClass;
  status: ClinicalStatus;
  notADiagnosis: true;
}

export function buildCmoRecommendations(input: {
  hrStatus?: ClinicalStatus;
  spo2Status?: ClinicalStatus;
  sleepMin?: number;
  sScale?: string;
  sansFlag?: 'ok' | 'watch' | 'refer';
  moodFlag?: 'ok' | 'watch' | 'concern';
  delaySec?: number;
}): CmoRecommendation[] {
  const out: CmoRecommendation[] = [];
  if (input.hrStatus && input.hrStatus !== 'Normal') {
    out.push({
      id: 'cmo-hr',
      titleKey: 'hrp.cmoHrTitle',
      detailKey: 'hrp.cmoHrDetail',
      citeId: 'V2 7042',
      citeDoc: EGRESS_CITE.doc,
      confidence: input.hrStatus === 'Critical' ? 'high' : 'medium',
      autonomy: classifyAction('hydrate'),
      status: input.hrStatus,
      notADiagnosis: true,
    });
  }
  if (input.spo2Status && input.spo2Status !== 'Normal') {
    out.push({
      id: 'cmo-spo2',
      titleKey: 'hrp.cmoSpo2Title',
      detailKey: 'hrp.cmoSpo2Detail',
      citeId: 'EIHSO-202',
      citeDoc: EIHSO_202.doc,
      confidence: 'medium',
      autonomy: classifyAction('self_check'),
      status: input.spo2Status,
      notADiagnosis: true,
    });
  }
  if (input.sleepMin != null && input.sleepMin < 360) {
    out.push({
      id: 'cmo-sleep',
      titleKey: 'hrp.cmoSleepTitle',
      detailKey: 'hrp.cmoSleepDetail',
      citeId: BH_201.id,
      citeDoc: BH_201.doc,
      confidence: 'medium',
      autonomy: classifyAction('sleep'),
      status: input.sleepMin < 300 ? 'Critical' : 'Attention',
      notADiagnosis: true,
    });
  }
  if (input.sScale && /^S[1-5]/.test(input.sScale)) {
    out.push({
      id: 'cmo-spe',
      titleKey: 'hrp.cmoSpeTitle',
      detailKey: 'hrp.cmoSpeDetail',
      detailVars: { scale: input.sScale, career: STD3001_CAREER_CITE.id, spe30: SPE_30DAY_CITE.id },
      citeId: STD3001_CAREER_CITE.id,
      citeDoc: STD3001_CAREER_CITE.doc,
      confidence: 'high',
      autonomy: classifyAction('shelter'),
      status: 'Critical',
      notADiagnosis: true,
    });
  }
  if (input.sansFlag && input.sansFlag !== 'ok') {
    out.push({
      id: 'cmo-sans',
      titleKey: 'hrp.cmoSansTitle',
      detailKey: 'hrp.cmoSansDetail',
      citeId: SANS_CITE.id,
      citeDoc: SANS_CITE.doc,
      confidence: input.sansFlag === 'refer' ? 'high' : 'medium',
      autonomy: classifyAction('sans_check'),
      status: input.sansFlag === 'refer' ? 'Critical' : 'Attention',
      notADiagnosis: true,
    });
  }
  if (input.moodFlag && input.moodFlag !== 'ok') {
    out.push({
      id: 'cmo-bhp',
      titleKey: 'hrp.cmoBhpTitle',
      detailKey: 'hrp.cmoBhpDetail',
      citeId: BH_201.id,
      citeDoc: BH_201.doc,
      confidence: 'low',
      autonomy: classifyAction('mood_checkin'),
      status: input.moodFlag === 'concern' ? 'Attention' : 'Attention',
      notADiagnosis: true,
    });
  }
  if (input.delaySec != null && input.delaySec >= 60) {
    out.push({
      id: 'cmo-eihso',
      titleKey: 'hrp.cmoEihsoTitle',
      detailKey: 'hrp.cmoEihsoDetail',
      detailVars: { sec: Math.round(input.delaySec) },
      citeId: EIHSO_202.id,
      citeDoc: EIHSO_202.doc,
      confidence: 'high',
      autonomy: classifyAction('self_check'),
      status: 'Normal',
      notADiagnosis: true,
    });
  }
  return out;
}
