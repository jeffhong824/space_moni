import type { AstronautProfile, DailyHealthRecord, EnvironmentalMetrics } from '../types.ts';
import type { SpaceEnvironmentPayload } from './spaceWeather.ts';
import { snapshotForAi } from './spaceWeather.ts';
import {
  CABIN_ENV_SOURCE,
  THRESHOLDS,
  TELEMETRY_SOURCE,
  formatSleep,
  statusExercise,
  statusHrv,
  statusRestingHR,
  statusSleep,
  statusSpo2,
  statusVo2,
  type MetricStatus,
  type OverallStatus,
  interpretRecord,
  type SelfCheckEntry,
} from './healthThresholds.ts';
import { DEFAULT_LANG, statusLabel, translate } from '../i18n/index.ts';
import type { CrewPanel } from './crewSystems.ts';

export interface PackedMetric {
  metric: string;
  id: string;
  value: string;
  numericValue: number;
  unit: string;
  status: MetricStatus;
  threshold: string;
  analysis: string;
  recommendations: string[];
  source: string;
}

export interface PackedSystem {
  system: string;
  status: MetricStatus;
  summary: string;
  concerns: string[];
  recommendations: string[];
}

export interface PackedHealthPayload {
  source: typeof TELEMETRY_SOURCE;
  capturedForDate: string;
  astronaut: {
    id: string;
    name: string;
    gender: string;
    age: number;
    role: string;
    missionDuration: string;
    missionStartDate: string;
    missionDaysElapsed: number;
  };
  metrics: PackedMetric[];
  systems: PackedSystem[];
  overall: { status: OverallStatus; summary: string };
  cabinEnvironment: {
    source: typeof CABIN_ENV_SOURCE;
    oxygenPercent: number;
    carbonDioxidePercent: number;
    cabinPressureKpa: number;
    cabinTempCelsius: number;
    humidityPercent: number;
  } | null;
  spaceEnvironment: ReturnType<typeof snapshotForAi>;
}

export interface TwoLevelAnalysis {
  replyText: string;
  healthAssessment: { status: OverallStatus; summary: string };
  suggestedActions: Array<{
    id: string;
    label: string;
    type: 'ADD_TASK' | 'LOG_ANOMALY' | 'UPDATE_VITALS' | 'NOTIFY_MISSION_CONTROL';
    payload?: Record<string, string>;
  }>;
  detailedAnalysis: {
    metrics: PackedMetric[];
    systems: PackedSystem[];
  };
  analysisMode: 'live_gemini' | 'offline_fallback';
  dataQuality: {
    telemetry: string;
    cabin: string;
    spaceEnvironment: string;
  };
}

function tr(lang: string, key: string, vars?: Record<string, string | number>) {
  return translate(lang, key, vars);
}

export function isFiniteVital(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

function vitalOrNotProvided(metric: PackedMetric | undefined, lang: string): string {
  const value = metric?.value;
  if (!value || !isFiniteVital(metric.numericValue) || /nan/i.test(value) || /infinity/i.test(value)) {
    return tr(lang, 'ai.notProvided');
  }
  return value;
}

function analysisFor(
  id: keyof typeof THRESHOLDS,
  status: MetricStatus,
  valueLabel: string,
  lang: string
): { analysis: string; recommendations: string[] } {
  const v = { value: valueLabel };
  switch (id) {
    case 'restingHR':
      if (status === 'Critical') {
        return { analysis: tr(lang, 'analysis.hrCritical', v), recommendations: [tr(lang, 'rec.hydrate'), tr(lang, 'rec.pausePeak'), tr(lang, 'rec.watchSpo2')] };
      }
      if (status === 'Attention') {
        return { analysis: tr(lang, 'analysis.hrCaution', v), recommendations: [tr(lang, 'rec.fluids'), tr(lang, 'rec.lowerPeak')] };
      }
      return { analysis: tr(lang, 'analysis.hrNormal', v), recommendations: [tr(lang, 'rec.t2'), tr(lang, 'rec.balance')] };
    case 'hrv':
      if (status === 'Critical') {
        return { analysis: tr(lang, 'analysis.hrvCritical', v), recommendations: [tr(lang, 'rec.recovery'), tr(lang, 'rec.lowerLoad'), tr(lang, 'rec.sleepEnv')] };
      }
      if (status === 'Attention') {
        return { analysis: tr(lang, 'analysis.hrvCaution', v), recommendations: [tr(lang, 'rec.sleep7'), tr(lang, 'rec.breathe')] };
      }
      return { analysis: tr(lang, 'analysis.hrvNormal', v), recommendations: [tr(lang, 'rec.workRest')] };
    case 'spo2':
      if (status === 'Critical') {
        return { analysis: tr(lang, 'analysis.spo2Critical', v), recommendations: [tr(lang, 'rec.checkEclss'), tr(lang, 'rec.respLoad')] };
      }
      if (status === 'Attention') {
        return { analysis: tr(lang, 'analysis.spo2Caution', v), recommendations: [tr(lang, 'rec.watchEclss'), tr(lang, 'rec.noPeakSpo2')] };
      }
      return { analysis: tr(lang, 'analysis.spo2Normal', v), recommendations: [tr(lang, 'rec.routineGas')] };
    case 'vo2Max':
      if (status !== 'Normal') {
        return { analysis: tr(lang, 'analysis.vo2Off', v), recommendations: [tr(lang, 'rec.t2Rate'), tr(lang, 'rec.noAerobicTachy')] };
      }
      return { analysis: tr(lang, 'analysis.vo2Ok', v), recommendations: [tr(lang, 'rec.exRx')] };
    case 'sleepMinutes':
      if (status !== 'Normal') {
        return { analysis: tr(lang, 'analysis.sleepOff', v), recommendations: [tr(lang, 'rec.protectSleep'), tr(lang, 'rec.sleepEnv'), tr(lang, 'rec.shiftPlan')] };
      }
      return { analysis: tr(lang, 'analysis.sleepOk', v), recommendations: [tr(lang, 'rec.sleepHabit')] };
    case 'exerciseMinutes':
      if (status !== 'Normal') {
        return { analysis: tr(lang, 'analysis.exOff', v), recommendations: [tr(lang, 'rec.alignT2'), tr(lang, 'rec.restDay')] };
      }
      return { analysis: tr(lang, 'analysis.exOk', v), recommendations: [tr(lang, 'rec.resistAerobic')] };
  }
}

export function packHealthPayload(
  astronaut: AstronautProfile,
  record: DailyHealthRecord,
  envMetrics?: EnvironmentalMetrics | null,
  spaceEnvironment?: SpaceEnvironmentPayload | null,
  selfCheck?: SelfCheckEntry | null,
  lang: string = DEFAULT_LANG,
  crewPanel?: CrewPanel | null
): PackedHealthPayload {
  const hr = isFiniteVital(record.restingHR) ? statusRestingHR(record.restingHR) : 'Normal';
  const hrv = isFiniteVital(record.hrv) ? statusHrv(record.hrv) : 'Normal';
  const spo2 = isFiniteVital(record.spo2) ? statusSpo2(record.spo2) : 'Normal';
  const vo2 = isFiniteVital(record.vo2Max) ? statusVo2(record.vo2Max) : 'Normal';
  const sleep = isFiniteVital(record.avgSleepMinutes) ? statusSleep(record.avgSleepMinutes) : 'Normal';
  const exercise = isFiniteVital(record.avgExerciseMinutes) ? statusExercise(record.avgExerciseMinutes) : 'Normal';

  const hrA = isFiniteVital(record.restingHR) ? analysisFor('restingHR', hr, `${record.restingHR} bpm`, lang) : null;
  const hrvA = isFiniteVital(record.hrv) ? analysisFor('hrv', hrv, `${record.hrv} ms`, lang) : null;
  const spo2A = isFiniteVital(record.spo2) ? analysisFor('spo2', spo2, `${record.spo2}%`, lang) : null;
  const vo2A = isFiniteVital(record.vo2Max) ? analysisFor('vo2Max', vo2, `${record.vo2Max.toFixed(1)} mL/kg/min`, lang) : null;
  const sleepA = isFiniteVital(record.avgSleepMinutes)
    ? analysisFor('sleepMinutes', sleep, formatSleep(record.avgSleepMinutes), lang)
    : null;
  const exA = isFiniteVital(record.avgExerciseMinutes)
    ? analysisFor('exerciseMinutes', exercise, `${record.avgExerciseMinutes} min`, lang)
    : null;

  const metrics: PackedMetric[] = [];
  if (hrA && isFiniteVital(record.restingHR)) {
    metrics.push({
      metric: tr(lang, 'metric.restingHR'),
      id: 'restingHR',
      value: `${record.restingHR} bpm`,
      numericValue: record.restingHR,
      unit: 'bpm',
      status: hr,
      threshold: tr(lang, 'band.normal', { v: THRESHOLDS.restingHR.normal }),
      analysis: hrA.analysis,
      recommendations: hrA.recommendations,
      source: tr(lang, 'badge.simTelemetry'),
    });
  }
  if (hrvA && isFiniteVital(record.hrv)) {
    metrics.push({
      metric: tr(lang, 'metric.hrv'),
      id: 'hrv',
      value: `${record.hrv} ms`,
      numericValue: record.hrv,
      unit: 'ms',
      status: hrv,
      threshold: tr(lang, 'band.normal', { v: THRESHOLDS.hrv.normal }),
      analysis: hrvA.analysis,
      recommendations: hrvA.recommendations,
      source: tr(lang, 'badge.simTelemetry'),
    });
  }
  if (spo2A && isFiniteVital(record.spo2)) {
    metrics.push({
      metric: tr(lang, 'metric.spo2'),
      id: 'spo2',
      value: `${record.spo2}%`,
      numericValue: record.spo2,
      unit: '%',
      status: spo2,
      threshold: tr(lang, 'band.normal', { v: THRESHOLDS.spo2.normal }),
      analysis: spo2A.analysis,
      recommendations: spo2A.recommendations,
      source: tr(lang, 'badge.simTelemetry'),
    });
  }
  if (vo2A && isFiniteVital(record.vo2Max)) {
    metrics.push({
      metric: tr(lang, 'metric.vo2Max'),
      id: 'vo2Max',
      value: `${record.vo2Max.toFixed(1)} mL/kg/min`,
      numericValue: record.vo2Max,
      unit: 'mL/kg/min',
      status: vo2,
      threshold: tr(lang, 'band.normal', { v: THRESHOLDS.vo2Max.normal }),
      analysis: vo2A.analysis,
      recommendations: vo2A.recommendations,
      source: tr(lang, 'badge.simTelemetry'),
    });
  }
  if (sleepA && isFiniteVital(record.avgSleepMinutes)) {
    metrics.push({
      metric: tr(lang, 'metric.sleepMinutes'),
      id: 'sleepMinutes',
      value: formatSleep(record.avgSleepMinutes),
      numericValue: record.avgSleepMinutes,
      unit: 'min',
      status: sleep,
      threshold: tr(lang, 'band.normal', { v: THRESHOLDS.sleepMinutes.normal }),
      analysis: sleepA.analysis,
      recommendations: sleepA.recommendations,
      source: tr(lang, 'badge.simTelemetry'),
    });
  }
  if (exA && isFiniteVital(record.avgExerciseMinutes)) {
    metrics.push({
      metric: tr(lang, 'metric.exerciseMinutes'),
      id: 'exerciseMinutes',
      value: `${record.avgExerciseMinutes} min`,
      numericValue: record.avgExerciseMinutes,
      unit: 'min',
      status: exercise,
      threshold: tr(lang, 'band.normal', { v: THRESHOLDS.exerciseMinutes.normal }),
      analysis: exA.analysis,
      recommendations: exA.recommendations,
      source: tr(lang, 'badge.simTelemetry'),
    });
  }

  const cardioStatus = hr === 'Critical' || hrv === 'Critical' ? 'Critical' : hr === 'Attention' || hrv === 'Attention' ? 'Attention' : 'Normal';
  const mentalStatus: MetricStatus = record.mentalStatus === 'Normal' ? 'Normal' : record.mentalStatus === 'Fatigued' ? 'Attention' : 'Attention';
  const mskStatus: MetricStatus =
    record.musculoskeletalStatus === 'Normal' ? 'Normal' : record.musculoskeletalStatus === 'Atrophy Risk' ? 'Critical' : 'Attention';
  const nutritionStatus: MetricStatus =
    record.nutritionStatus === 'Normal' ? 'Normal' : record.nutritionStatus === 'Dehydration' ? 'Critical' : 'Attention';

  const systems: PackedSystem[] = [
    {
      system: 'Cardiovascular',
      status: cardioStatus,
      summary: cardioStatus === 'Normal' ? tr(lang, 'sys.cardioOk') : tr(lang, 'sys.cardioOff'),
      concerns: [
        ...(hr !== 'Normal' && isFiniteVital(record.restingHR)
          ? [`${tr(lang, 'metric.restingHR')} ${record.restingHR} bpm (${statusLabel(lang, hr)})`]
          : []),
        ...(hrv !== 'Normal' && isFiniteVital(record.hrv)
          ? [`${tr(lang, 'metric.hrv')} ${record.hrv} ms (${statusLabel(lang, hrv)})`]
          : []),
      ],
      recommendations: cardioStatus === 'Normal' ? [tr(lang, 'rec.keepAred')] : [tr(lang, 'rec.hydrateLog'), tr(lang, 'rec.logGround')],
    },
    {
      system: 'Respiratory',
      status: spo2,
      summary: spo2 === 'Normal' ? tr(lang, 'sys.respOk') : tr(lang, 'sys.respOff'),
      concerns: spo2 !== 'Normal' && isFiniteVital(record.spo2) ? [`SpO₂ ${record.spo2}%`] : [],
      recommendations: spo2 === 'Normal' ? [tr(lang, 'rec.routineGas')] : [tr(lang, 'rec.checkEclss'), tr(lang, 'rec.noPeakSpo2')],
    },
    {
      system: 'Sleep',
      status: sleep,
      summary: sleep === 'Normal' ? tr(lang, 'sys.sleepOk') : tr(lang, 'sys.sleepOff'),
      concerns: sleep !== 'Normal' && isFiniteVital(record.avgSleepMinutes) ? [`${tr(lang, 'metric.sleepMinutes')} ${formatSleep(record.avgSleepMinutes)}`] : [],
      recommendations: sleepA?.recommendations ?? [tr(lang, 'rec.sleepHabit')],
    },
    {
      system: 'Exercise',
      status: exercise,
      summary: exercise === 'Normal' ? tr(lang, 'sys.exOk') : tr(lang, 'sys.exOff'),
      concerns: exercise !== 'Normal' && isFiniteVital(record.avgExerciseMinutes)
        ? [`${tr(lang, 'metric.exerciseMinutes')} ${record.avgExerciseMinutes} min`]
        : [],
      recommendations: exA?.recommendations ?? [tr(lang, 'rec.resistAerobic')],
    },
    {
      system: 'Mental',
      status: mentalStatus,
      summary: mentalStatus === 'Normal' ? tr(lang, 'sys.mentalOk') : tr(lang, 'sys.mentalOff', { value: record.mentalStatus }),
      concerns: mentalStatus !== 'Normal' ? [record.mentalStatus] : [],
      recommendations: mentalStatus === 'Normal' ? [tr(lang, 'rec.voiceCheck')] : [tr(lang, 'rec.offDuty'), tr(lang, 'rec.syncLoad')],
    },
    {
      system: 'Musculoskeletal',
      status: mskStatus,
      summary: mskStatus === 'Normal' ? tr(lang, 'sys.mskOk') : tr(lang, 'sys.mskOff', { value: record.musculoskeletalStatus }),
      concerns: mskStatus !== 'Normal' ? [record.musculoskeletalStatus] : [],
      recommendations: mskStatus === 'Normal' ? [tr(lang, 'rec.keepAred')] : [tr(lang, 'rec.aredLoad')],
    },
    {
      system: 'Nutrition',
      status: nutritionStatus,
      summary: nutritionStatus === 'Normal' ? tr(lang, 'sys.nutOk') : tr(lang, 'sys.nutOff', { value: record.nutritionStatus }),
      concerns: nutritionStatus !== 'Normal' ? [record.nutritionStatus] : [],
      recommendations: nutritionStatus === 'Normal' ? [tr(lang, 'rec.kitchen')] : [tr(lang, 'rec.electrolytes'), tr(lang, 'rec.waterFlow')],
    },
  ];

  if (crewPanel) {
    for (const m of crewPanel.groups.flatMap((g) => g.metrics)) {
      if (metrics.some((x) => x.id === m.id)) continue;
      metrics.push({
        metric: tr(lang, m.labelKey),
        id: m.id,
        value: m.unit ? `${m.display} ${m.unit}` : m.display,
        numericValue: m.numericValue ?? 0,
        unit: m.unit,
        status: m.status,
        threshold: tr(lang, 'band.normal', { v: m.range }),
        analysis: `${tr(lang, m.labelKey)} ${m.display} ${m.unit} (${m.status}) · ${tr(lang, 'badge.simTelemetry')}`,
        recommendations: crewPanel.prompts.filter((p) => p.severity !== 'Normal').map((p) => tr(lang, p.key)),
        source: m.source === 'noaa' ? tr(lang, 'panel.noaaLive') : tr(lang, 'badge.simTelemetry'),
      });
    }
    for (const g of crewPanel.groups) {
      systems.push({
        system: tr(lang, `panel.sys.${g.id}`),
        status: g.status,
        summary: tr(lang, g.hrpKey),
        concerns: g.metrics.filter((m) => m.status !== 'Normal').map((m) => `${tr(lang, m.labelKey)} ${m.display}`),
        recommendations: g.prompts.map((p) => tr(lang, p.key)),
      });
    }
  }

  const interpreted = interpretRecord(record, selfCheck);
  const overallStatus = crewPanel?.overall ?? interpreted.overall;
  const overallSummary =
    overallStatus === 'Critical'
      ? tr(lang, 'analysis.overallCritical')
      : overallStatus === 'Attention'
        ? tr(lang, 'analysis.overallCaution')
        : tr(lang, 'analysis.overallNormal');

  return {
    source: TELEMETRY_SOURCE,
    capturedForDate: record.date,
    astronaut: {
      id: astronaut.id,
      name: astronaut.name,
      gender: astronaut.gender,
      age: astronaut.age,
      role: astronaut.role,
      missionDuration: astronaut.missionDuration,
      missionStartDate: astronaut.missionStartDate,
      missionDaysElapsed: astronaut.missionDaysElapsed,
    },
    metrics,
    systems,
    overall: { status: overallStatus, summary: overallSummary },
    cabinEnvironment: envMetrics
      ? {
          source: CABIN_ENV_SOURCE,
          oxygenPercent: envMetrics.oxygenPercent,
          carbonDioxidePercent: envMetrics.carbonDioxidePercent,
          cabinPressureKpa: envMetrics.cabinPressureKpa,
          cabinTempCelsius: envMetrics.cabinTempCelsius,
          humidityPercent: envMetrics.humidityPercent,
        }
      : null,
    spaceEnvironment: snapshotForAi(spaceEnvironment ?? null),
  };
}

export function buildOfflineTwoLevelAnalysis(
  message: string,
  packed: PackedHealthPayload,
  lang: string = DEFAULT_LANG
): TwoLevelAnalysis {
  const { overall, metrics, systems, astronaut } = packed;
  const hr = metrics.find((m) => m.id === 'restingHR');
  const spo2 = metrics.find((m) => m.id === 'spo2');
  const wx = packed.spaceEnvironment;
  const wxNote =
    wx?.kp && wx.goesXray
      ? tr(lang, 'ai.wxLive', {
          kp: wx.kp.value,
          at: wx.kp.observedAt,
          goes: wx.goesXray.goesClass,
          risk: wx.radiationRisk,
        })
      : wx
        ? tr(lang, 'ai.wxStatus', { status: wx.overallStatus })
        : '';

  const needsHydration = hr && hr.status !== 'Normal';
  const action = needsHydration ? tr(lang, 'ai.offlineHydrate') : tr(lang, 'ai.offlineContinue');

  return {
    replyText: tr(lang, 'ai.offlineReply', {
      name: astronaut.name,
      message,
      summary: overall.summary,
      hr: vitalOrNotProvided(hr, lang),
      spo2: vitalOrNotProvided(spo2, lang),
      action,
      wx: wxNote,
    }),
    healthAssessment: overall,
    suggestedActions: needsHydration
      ? [
          {
            id: 'act-offline-hydrate',
            label: tr(lang, 'ai.hydrate'),
            type: 'ADD_TASK',
            payload: {
              title: tr(lang, 'ai.hydrateTask'),
              module: 'mod.tranquility',
              priority: 'High',
              category: 'Health Countermeasure',
            },
          },
          {
            id: 'act-offline-log',
            label: tr(lang, 'ai.logCardio'),
            type: 'LOG_ANOMALY',
            payload: {
              note: tr(lang, 'ai.logNote', {
                name: astronaut.name,
                date: packed.capturedForDate,
                metric: hr?.metric ?? '',
                value: hr?.value ?? '',
                status: statusLabel(lang, hr?.status),
                source: tr(lang, 'badge.simTelemetry'),
              }),
            },
          },
        ]
      : [
          {
            id: 'act-offline-ack',
            label: tr(lang, 'ai.ackRoutine'),
            type: 'LOG_ANOMALY',
            payload: {
              note: tr(lang, 'ai.logOverall', {
                name: astronaut.name,
                date: packed.capturedForDate,
                status: statusLabel(lang, overall.status),
                source: tr(lang, 'badge.simTelemetry'),
              }),
            },
          },
        ],
    detailedAnalysis: { metrics, systems },
    analysisMode: 'offline_fallback',
    dataQuality: {
      telemetry: tr(lang, 'badge.simTelemetry'),
      cabin: packed.cabinEnvironment ? tr(lang, 'badge.simCabin') : tr(lang, 'ai.noCabin'),
      spaceEnvironment: wx
        ? tr(lang, 'ai.wxSnap', { status: wx.overallStatus, at: wx.fetchedAt })
        : tr(lang, 'ai.noWx'),
    },
  };
}

export function thresholdTableForPrompt(): string {
  return Object.values(THRESHOLDS)
    .map((t) => `- ${t.labelZh}（${t.unit}）：正常 ${t.normal}；注意 ${t.attention}；危急 ${t.critical}`)
    .join('\n');
}
