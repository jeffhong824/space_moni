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
import type { BaselineBand } from './baselines.ts';

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

export interface CmoPassedCheck {
  id: string;
  titleKey: string;
  citeId: string;
  citeDoc: string;
}

export interface CmoReview {
  recs: CmoRecommendation[];
  passed: CmoPassedCheck[];
  reviewedAt: string;
}

export interface CmoInput {
  hrStatus?: ClinicalStatus;
  hrvStatus?: ClinicalStatus;
  spo2Status?: ClinicalStatus;
  sleepMin?: number;
  sScale?: string;
  sansFlag?: 'ok' | 'watch' | 'refer';
  moodFlag?: 'ok' | 'watch' | 'concern';
  delaySec?: number;
  baselineZBand?: BaselineBand | null;
  nowIso?: string;
}

function rec(partial: Omit<CmoRecommendation, 'notADiagnosis'>): CmoRecommendation {
  return { ...partial, notADiagnosis: true };
}

export function evaluateCmoSupport(input: CmoInput): CmoReview {
  const recs: CmoRecommendation[] = [];
  const passed: CmoPassedCheck[] = [];

  const hrOk = !input.hrStatus || input.hrStatus === 'Normal';
  if (!hrOk && input.hrStatus) {
    recs.push(
      rec({
        id: 'cmo-hr',
        titleKey: 'hrp.cmoHrTitle',
        detailKey: 'hrp.cmoHrDetail',
        citeId: 'V2 7042',
        citeDoc: EGRESS_CITE.doc,
        confidence: input.hrStatus === 'Critical' ? 'high' : 'medium',
        autonomy: classifyAction('hydrate'),
        status: input.hrStatus,
      })
    );
  } else {
    passed.push({ id: 'cmo-hr', titleKey: 'hrp.cmoHrTitle', citeId: 'V2 7042', citeDoc: EGRESS_CITE.doc });
  }

  const hrvOk = !input.hrvStatus || input.hrvStatus === 'Normal';
  if (!hrvOk && input.hrvStatus) {
    recs.push(
      rec({
        id: 'cmo-hrv',
        titleKey: 'hrp.cmoHrvTitle',
        detailKey: 'hrp.cmoHrvDetail',
        citeId: 'V2 7042',
        citeDoc: EGRESS_CITE.doc,
        confidence: input.hrvStatus === 'Critical' ? 'high' : 'medium',
        autonomy: classifyAction('self_check'),
        status: input.hrvStatus,
      })
    );
  } else {
    passed.push({ id: 'cmo-hrv', titleKey: 'hrp.cmoHrvTitle', citeId: 'V2 7042', citeDoc: EGRESS_CITE.doc });
  }

  const zOff = input.baselineZBand === 'caution' || input.baselineZBand === 'off';
  if (zOff) {
    recs.push(
      rec({
        id: 'cmo-z',
        titleKey: 'hrp.cmoZTitle',
        detailKey: 'hrp.cmoZDetail',
        detailVars: { band: input.baselineZBand ?? 'caution' },
        citeId: BH_201.id,
        citeDoc: BH_201.doc,
        confidence: input.baselineZBand === 'off' ? 'high' : 'medium',
        autonomy: classifyAction('self_check'),
        status: input.baselineZBand === 'off' ? 'Critical' : 'Attention',
      })
    );
  } else {
    passed.push({ id: 'cmo-z', titleKey: 'hrp.cmoZTitle', citeId: BH_201.id, citeDoc: BH_201.doc });
  }

  const spo2Ok = !input.spo2Status || input.spo2Status === 'Normal';
  if (!spo2Ok && input.spo2Status) {
    recs.push(
      rec({
        id: 'cmo-spo2',
        titleKey: 'hrp.cmoSpo2Title',
        detailKey: 'hrp.cmoSpo2Detail',
        citeId: 'EIHSO-202',
        citeDoc: EIHSO_202.doc,
        confidence: 'medium',
        autonomy: classifyAction('self_check'),
        status: input.spo2Status,
      })
    );
  } else {
    passed.push({ id: 'cmo-spo2', titleKey: 'hrp.cmoSpo2Title', citeId: 'EIHSO-202', citeDoc: EIHSO_202.doc });
  }

  if (input.sleepMin != null && input.sleepMin < 360) {
    recs.push(
      rec({
        id: 'cmo-sleep',
        titleKey: 'hrp.cmoSleepTitle',
        detailKey: 'hrp.cmoSleepDetail',
        citeId: BH_201.id,
        citeDoc: BH_201.doc,
        confidence: 'medium',
        autonomy: classifyAction('sleep'),
        status: input.sleepMin < 300 ? 'Critical' : 'Attention',
      })
    );
  } else {
    passed.push({ id: 'cmo-sleep', titleKey: 'hrp.cmoSleepTitle', citeId: BH_201.id, citeDoc: BH_201.doc });
  }

  if (input.sScale && /^S[1-5]/.test(input.sScale)) {
    recs.push(
      rec({
        id: 'cmo-spe',
        titleKey: 'hrp.cmoSpeTitle',
        detailKey: 'hrp.cmoSpeDetail',
        detailVars: { scale: input.sScale, career: STD3001_CAREER_CITE.id, spe30: SPE_30DAY_CITE.id },
        citeId: STD3001_CAREER_CITE.id,
        citeDoc: STD3001_CAREER_CITE.doc,
        confidence: 'high',
        autonomy: classifyAction('shelter'),
        status: 'Critical',
      })
    );
  } else {
    passed.push({
      id: 'cmo-spe',
      titleKey: 'hrp.cmoSpeTitle',
      citeId: STD3001_CAREER_CITE.id,
      citeDoc: STD3001_CAREER_CITE.doc,
    });
  }

  if (input.sansFlag && input.sansFlag !== 'ok') {
    recs.push(
      rec({
        id: 'cmo-sans',
        titleKey: 'hrp.cmoSansTitle',
        detailKey: 'hrp.cmoSansDetail',
        citeId: SANS_CITE.id,
        citeDoc: SANS_CITE.doc,
        confidence: input.sansFlag === 'refer' ? 'high' : 'medium',
        autonomy: classifyAction('sans_check'),
        status: input.sansFlag === 'refer' ? 'Critical' : 'Attention',
      })
    );
  } else {
    passed.push({ id: 'cmo-sans', titleKey: 'hrp.cmoSansTitle', citeId: SANS_CITE.id, citeDoc: SANS_CITE.doc });
  }

  if (input.moodFlag && input.moodFlag !== 'ok') {
    recs.push(
      rec({
        id: 'cmo-bhp',
        titleKey: 'hrp.cmoBhpTitle',
        detailKey: 'hrp.cmoBhpDetail',
        citeId: BH_201.id,
        citeDoc: BH_201.doc,
        confidence: 'low',
        autonomy: classifyAction('mood_checkin'),
        status: 'Attention',
      })
    );
  } else {
    passed.push({ id: 'cmo-bhp', titleKey: 'hrp.cmoBhpTitle', citeId: BH_201.id, citeDoc: BH_201.doc });
  }

  if (input.delaySec != null && input.delaySec >= 60) {
    recs.push(
      rec({
        id: 'cmo-eihso',
        titleKey: 'hrp.cmoEihsoTitle',
        detailKey: 'hrp.cmoEihsoDetail',
        detailVars: { sec: Math.round(input.delaySec) },
        citeId: EIHSO_202.id,
        citeDoc: EIHSO_202.doc,
        confidence: 'high',
        autonomy: classifyAction('self_check'),
        status: 'Normal',
      })
    );
  } else {
    passed.push({ id: 'cmo-eihso', titleKey: 'hrp.cmoEihsoTitle', citeId: EIHSO_202.id, citeDoc: EIHSO_202.doc });
  }

  return { recs, passed, reviewedAt: input.nowIso ?? new Date().toISOString() };
}

export function buildCmoRecommendations(input: CmoInput): CmoRecommendation[] {
  return evaluateCmoSupport(input).recs;
}
