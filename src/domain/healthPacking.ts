import type { AstronautProfile, DailyHealthRecord, EnvironmentalMetrics } from '../types';
import type { SpaceEnvironmentPayload } from './spaceWeather';
import { snapshotForAi } from './spaceWeather';
import {
  CABIN_ENV_SOURCE,
  THRESHOLDS,
  TELEMETRY_SOURCE,
  formatSleep,
  rollupOverall,
  statusExercise,
  statusHrv,
  statusRestingHR,
  statusSleep,
  statusSpo2,
  statusVo2,
  type MetricStatus,
  type OverallStatus,
} from './healthThresholds';

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
  system: 'Cardiovascular' | 'Respiratory' | 'Sleep' | 'Exercise' | 'Mental' | 'Musculoskeletal' | 'Nutrition';
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

function analysisFor(
  id: keyof typeof THRESHOLDS,
  status: MetricStatus,
  valueLabel: string
): { analysis: string; recommendations: string[] } {
  switch (id) {
    case 'restingHR':
      if (status === 'Critical') {
        return {
          analysis: `靜息心率 ${valueLabel}，超過微重力示範門檻（>100 bpm）。可能與體液頭向轉移、自主神經失調或脫水有關。`,
          recommendations: ['執行 20 分鐘等滲補液方案', '暫緩高強度 ARED／T2 峰值負荷', '持續監測 SpO₂ 與症狀'],
        };
      }
      if (status === 'Attention') {
        return {
          analysis: `靜息心率 ${valueLabel}，高於軌道示範理想區間（50–90 bpm），尚未達危急心搏過速。`,
          recommendations: ['增加水分與電解質攝取', '下一班次降低峰值運動強度'],
        };
      }
      return {
        analysis: `靜息心率 ${valueLabel}，位於示範正常區間。`,
        recommendations: ['維持 T2／ARED 常規對策', '保持水分平衡'],
      };
    case 'hrv':
      if (status === 'Critical') {
        return {
          analysis: `HRV ${valueLabel}，自主神經張力嚴重抑制（<20 ms）。可能與睡眠負債、過度訓練或心理負荷有關。`,
          recommendations: ['安排強制恢復週期', '降低當日訓練負荷', '評估睡眠艙聲學與光照'],
        };
      }
      if (status === 'Attention') {
        return {
          analysis: `HRV ${valueLabel}，低於理想值（≥25 ms），恢復能力下降。`,
          recommendations: ['確保 7 小時睡眠窗', '加入放鬆呼吸訓練'],
        };
      }
      return {
        analysis: `HRV ${valueLabel}，自主神經調節良好。`,
        recommendations: ['維持工作–休息平衡'],
      };
    case 'spo2':
      if (status === 'Critical') {
        return {
          analysis: `SpO₂ ${valueLabel}，低於艙內示範危急門檻（<94%）。需核對 ECLSS 氧氣與 CO₂ 清除。`,
          recommendations: ['立即核對艙內 O₂／CO₂', '評估呼吸與活動負荷'],
        };
      }
      if (status === 'Attention') {
        return {
          analysis: `SpO₂ ${valueLabel}，略低於示範理想值（≥96%）。`,
          recommendations: ['持續監看 ECLSS', '避免在血氧偏低時進行峰值運動'],
        };
      }
      return {
        analysis: `SpO₂ ${valueLabel}，氧合穩定。`,
        recommendations: ['例行監看艙內氣體組成'],
      };
    case 'vo2Max':
      if (status !== 'Normal') {
        return {
          analysis: `VO₂ max ${valueLabel}，有氧儲備偏低，微重力下易加速體能流失。`,
          recommendations: ['檢視 T2 有氧處方完成率', '勿在心搏過速時加碼有氧'],
        };
      }
      return {
        analysis: `VO₂ max ${valueLabel}，有氧基線可接受。`,
        recommendations: ['維持處方運動對策'],
      };
    case 'sleepMinutes':
      if (status !== 'Normal') {
        return {
          analysis: `平均睡眠 ${valueLabel}，低於 7 小時示範目標，可能影響認知與自主神經恢復。`,
          recommendations: ['優先保留睡眠窗', '檢查睡眠艙噪音與光照', '評估是否需調整任務時程'],
        };
      }
      return {
        analysis: `平均睡眠 ${valueLabel}，達到示範恢復目標。`,
        recommendations: ['維持規律作息'],
      };
    case 'exerciseMinutes':
      if (status !== 'Normal') {
        return {
          analysis: `運動對策 ${valueLabel}，偏離 ISS 示範處方（約 90–210 分鐘）。`,
          recommendations: ['對齊 T2／ARED 當日處方', '過量時改為恢復日'],
        };
      }
      return {
        analysis: `運動對策 ${valueLabel}，符合示範處方區間。`,
        recommendations: ['維持阻力與有氧平衡'],
      };
  }
}

export function packHealthPayload(
  astronaut: AstronautProfile,
  record: DailyHealthRecord,
  envMetrics?: EnvironmentalMetrics | null,
  spaceEnvironment?: SpaceEnvironmentPayload | null
): PackedHealthPayload {
  const hr = statusRestingHR(record.restingHR);
  const hrv = statusHrv(record.hrv);
  const spo2 = statusSpo2(record.spo2);
  const vo2 = statusVo2(record.vo2Max);
  const sleep = statusSleep(record.avgSleepMinutes);
  const exercise = statusExercise(record.avgExerciseMinutes);

  const hrA = analysisFor('restingHR', hr, `${record.restingHR} bpm`);
  const hrvA = analysisFor('hrv', hrv, `${record.hrv} ms`);
  const spo2A = analysisFor('spo2', spo2, `${record.spo2}%`);
  const vo2A = analysisFor('vo2Max', vo2, `${record.vo2Max.toFixed(1)} mL/kg/min`);
  const sleepA = analysisFor('sleepMinutes', sleep, formatSleep(record.avgSleepMinutes));
  const exA = analysisFor('exerciseMinutes', exercise, `${record.avgExerciseMinutes} min`);

  const metrics: PackedMetric[] = [
    {
      metric: THRESHOLDS.restingHR.labelZh,
      id: 'restingHR',
      value: `${record.restingHR} bpm`,
      numericValue: record.restingHR,
      unit: 'bpm',
      status: hr,
      threshold: `正常 ${THRESHOLDS.restingHR.normal}`,
      analysis: hrA.analysis,
      recommendations: hrA.recommendations,
      source: TELEMETRY_SOURCE.labelZh,
    },
    {
      metric: THRESHOLDS.hrv.labelZh,
      id: 'hrv',
      value: `${record.hrv} ms`,
      numericValue: record.hrv,
      unit: 'ms',
      status: hrv,
      threshold: `正常 ${THRESHOLDS.hrv.normal}`,
      analysis: hrvA.analysis,
      recommendations: hrvA.recommendations,
      source: TELEMETRY_SOURCE.labelZh,
    },
    {
      metric: THRESHOLDS.spo2.labelZh,
      id: 'spo2',
      value: `${record.spo2}%`,
      numericValue: record.spo2,
      unit: '%',
      status: spo2,
      threshold: `正常 ${THRESHOLDS.spo2.normal}`,
      analysis: spo2A.analysis,
      recommendations: spo2A.recommendations,
      source: TELEMETRY_SOURCE.labelZh,
    },
    {
      metric: THRESHOLDS.vo2Max.labelZh,
      id: 'vo2Max',
      value: `${record.vo2Max.toFixed(1)} mL/kg/min`,
      numericValue: record.vo2Max,
      unit: 'mL/kg/min',
      status: vo2,
      threshold: `正常 ${THRESHOLDS.vo2Max.normal}`,
      analysis: vo2A.analysis,
      recommendations: vo2A.recommendations,
      source: TELEMETRY_SOURCE.labelZh,
    },
    {
      metric: THRESHOLDS.sleepMinutes.labelZh,
      id: 'sleepMinutes',
      value: formatSleep(record.avgSleepMinutes),
      numericValue: record.avgSleepMinutes,
      unit: 'min',
      status: sleep,
      threshold: `正常 ${THRESHOLDS.sleepMinutes.normal}`,
      analysis: sleepA.analysis,
      recommendations: sleepA.recommendations,
      source: TELEMETRY_SOURCE.labelZh,
    },
    {
      metric: THRESHOLDS.exerciseMinutes.labelZh,
      id: 'exerciseMinutes',
      value: `${record.avgExerciseMinutes} min`,
      numericValue: record.avgExerciseMinutes,
      unit: 'min',
      status: exercise,
      threshold: `正常 ${THRESHOLDS.exerciseMinutes.normal}`,
      analysis: exA.analysis,
      recommendations: exA.recommendations,
      source: TELEMETRY_SOURCE.labelZh,
    },
  ];

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
      summary:
        cardioStatus === 'Normal'
          ? '心血管系統適應良好，靜息心率與 HRV 均在示範門檻內。'
          : '心血管系統顯示微重力適應壓力：心率與／或 HRV 偏離示範門檻。',
      concerns: [
        ...(hr !== 'Normal' ? [`靜息心率 ${record.restingHR} bpm（${hr}）`] : []),
        ...(hrv !== 'Normal' ? [`HRV ${record.hrv} ms（${hrv}）`] : []),
      ],
      recommendations: cardioStatus === 'Normal' ? ['維持 ARED／T2 常規'] : ['執行補液與降低峰值負荷', '記錄異常供地面飛行外科醫師'],
    },
    {
      system: 'Respiratory',
      status: spo2,
      summary: spo2 === 'Normal' ? '呼吸與氧合穩定。' : '血氧偏低，需對照艙內氣體與活動負荷。',
      concerns: spo2 !== 'Normal' ? [`SpO₂ ${record.spo2}%`] : [],
      recommendations: spo2 === 'Normal' ? ['例行監看 ECLSS'] : ['核對艙內 O₂／CO₂', '避免峰值運動直至氧合回穩'],
    },
    {
      system: 'Sleep',
      status: sleep,
      summary: sleep === 'Normal' ? '睡眠時數達到恢復目標。' : '睡眠負債可能削弱認知與 HRV 恢復。',
      concerns: sleep !== 'Normal' ? [`睡眠 ${formatSleep(record.avgSleepMinutes)}`] : [],
      recommendations: sleepA.recommendations,
    },
    {
      system: 'Exercise',
      status: exercise,
      summary: exercise === 'Normal' ? '運動對策符合示範處方。' : '運動時數偏離處方，需與心血管狀態一併調整。',
      concerns: exercise !== 'Normal' ? [`運動 ${record.avgExerciseMinutes} min`] : [],
      recommendations: exA.recommendations,
    },
    {
      system: 'Mental',
      status: mentalStatus,
      summary: mentalStatus === 'Normal' ? '心理狀態標示為正常。' : `心理狀態標示為「${record.mentalStatus}」，建議結合睡眠與任務負荷解讀。`,
      concerns: mentalStatus !== 'Normal' ? [record.mentalStatus] : [],
      recommendations: mentalStatus === 'Normal' ? ['維持規律語音檢核'] : ['安排非勤務恢復時段', '與飛行外科醫師同步負荷'],
    },
    {
      system: 'Musculoskeletal',
      status: mskStatus,
      summary: mskStatus === 'Normal' ? '肌肉骨骼狀態標示為正常。' : `肌肉骨骼狀態為「${record.musculoskeletalStatus}」。`,
      concerns: mskStatus !== 'Normal' ? [record.musculoskeletalStatus] : [],
      recommendations: mskStatus === 'Normal' ? ['維持 ARED 阻力處方'] : ['核對 ARED 負荷與疼痛回報'],
    },
    {
      system: 'Nutrition',
      status: nutritionStatus,
      summary: nutritionStatus === 'Normal' ? '營養狀態標示為正常。' : `營養狀態為「${record.nutritionStatus}」。`,
      concerns: nutritionStatus !== 'Normal' ? [record.nutritionStatus] : [],
      recommendations: nutritionStatus === 'Normal' ? ['維持廚房條碼紀錄合規'] : ['補充電解質與熱量', '核對水分配器流量'],
    },
  ];

  const overallStatus = rollupOverall(metrics.map((m) => m.status));
  const overallSummary =
    overallStatus === 'Critical'
      ? '多項或單項生理指標達危急門檻，需立即對策並通報地面。'
      : overallStatus === 'Attention Required'
        ? '整體需注意：部分指標偏離示範門檻，尚未判定為立即危急。'
        : '整體標稱為正常，任務適航狀態良好。';

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
  packed: PackedHealthPayload
): TwoLevelAnalysis {
  const { overall, metrics, systems, astronaut } = packed;
  const hr = metrics.find((m) => m.id === 'restingHR');
  const spo2 = metrics.find((m) => m.id === 'spo2');
  const wx = packed.spaceEnvironment;
  const wxNote =
    wx?.kp && wx.goesXray
      ? ` 官方空間天氣：Kp ${wx.kp.value}（${wx.kp.observedAt}）、GOES X 射線 ${wx.goesXray.goesClass}、輻射風險 ${wx.radiationRisk}。`
      : wx
        ? ` 空間天氣饋送狀態：${wx.overallStatus}。`
        : '';

  const needsHydration = hr && hr.status !== 'Normal';

  return {
    replyText: `[AURA 離線飛行外科醫師] ${astronaut.name}，已收到「${message}」。${overall.summary} 靜息心率 ${hr?.value ?? '—'}、SpO₂ ${spo2?.value ?? '—'}。${needsHydration ? '建議先完成等滲補液與恢復窗，再進行高負荷實驗。' : '目前可依處方繼續對策與實驗，並持續監看指標。'}${wxNote}（分析依固定門檻產生，非即時 Gemini。）`,
    healthAssessment: overall,
    suggestedActions: needsHydration
      ? [
          {
            id: 'act-offline-hydrate',
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
            id: 'act-offline-log',
            label: '記錄心血管觀測',
            type: 'LOG_ANOMALY',
            payload: {
              note: `${astronaut.name} ${packed.capturedForDate}：${hr?.metric} ${hr?.value}（${hr?.status}）。來源：${TELEMETRY_SOURCE.labelZh}。`,
            },
          },
        ]
      : [
          {
            id: 'act-offline-ack',
            label: '記錄例行健康檢核完成',
            type: 'LOG_ANOMALY',
            payload: {
              note: `${astronaut.name} ${packed.capturedForDate}：整體 ${overall.status}。來源：${TELEMETRY_SOURCE.labelZh}。`,
            },
          },
        ],
    detailedAnalysis: { metrics, systems },
    analysisMode: 'offline_fallback',
    dataQuality: {
      telemetry: TELEMETRY_SOURCE.labelZh,
      cabin: packed.cabinEnvironment ? CABIN_ENV_SOURCE.labelZh : '未提供艙內讀數',
      spaceEnvironment: wx
        ? `官方饋送 ${wx.overallStatus}（擷取 ${wx.fetchedAt}）`
        : '本次未附帶空間天氣快照',
    },
  };
}

export function thresholdTableForPrompt(): string {
  return Object.values(THRESHOLDS)
    .map((t) => `- ${t.labelZh}（${t.unit}）：正常 ${t.normal}；注意 ${t.attention}；危急 ${t.critical}`)
    .join('\n');
}
