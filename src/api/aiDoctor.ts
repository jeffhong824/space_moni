/**
 * AI Doctor API Service
 * 
 * Handles communication with the /api/ai-doctor endpoint
 * Provides both overall health assessment and per-metric/system analysis
 */

import { AstronautProfile, DailyHealthRecord, EnvironmentalMetrics, StationTask } from '../types';

export interface MetricAnalysis {
  metric: string;
  value: string;
  status: 'Normal' | 'Attention' | 'Critical';
  analysis: string;
  recommendations: string[];
}

export interface SystemAnalysis {
  system: 'Cardiovascular' | 'Respiratory' | 'Sleep' | 'Exercise' | 'Mental' | 'Musculoskeletal' | 'Nutrition';
  status: 'Normal' | 'Attention' | 'Critical';
  summary: string;
  concerns: string[];
  recommendations: string[];
}

export interface AiDoctorResponse {
  replyText: string;
  healthAssessment: {
    status: 'Nominal' | 'Attention Required' | 'Critical';
    summary: string;
  };
  suggestedActions: Array<{
    id: string;
    label: string;
    type: 'ADD_TASK' | 'LOG_ANOMALY' | 'UPDATE_VITALS' | 'NOTIFY_MISSION_CONTROL';
    payload?: any;
  }>;
  detailedAnalysis?: {
    metrics: MetricAnalysis[];
    systems: SystemAnalysis[];
  };
}

export interface AiDoctorRequest {
  message: string;
  astronaut: AstronautProfile;
  telemetry: DailyHealthRecord;
  envMetrics?: EnvironmentalMetrics;
  currentTasks?: Array<{ id: string; title: string; priority: string; status: string }>;
  history?: Array<{ sender: string; text: string }>;
}

/**
 * Call the AI Doctor endpoint with health telemetry
 */
export async function callAiDoctor(request: AiDoctorRequest): Promise<AiDoctorResponse> {
  try {
    const response = await fetch('/api/ai-doctor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`AI Doctor API returned ${response.status}`);
    }

    const data = await response.json();
    return data as AiDoctorResponse;
  } catch (error) {
    console.error('AI Doctor API error:', error);
    
    // Return offline fallback
    return generateOfflineFallback(request);
  }
}

/**
 * Generate offline AURA fallback response with detailed analysis
 */
function generateOfflineFallback(request: AiDoctorRequest): AiDoctorResponse {
  const { astronaut, telemetry, message } = request;
  
  // Analyze individual metrics
  const metrics: MetricAnalysis[] = [
    {
      metric: '靜息心率',
      value: `${telemetry.restingHR} bpm`,
      status: telemetry.restingHR > 100 ? 'Critical' : telemetry.restingHR > 90 ? 'Attention' : 'Normal',
      analysis: telemetry.restingHR > 100 
        ? '檢測到心搏過速。微重力環境下靜息心率顯著升高，可能與體液轉移、自主神經失調或脫水有關。'
        : '心率在軌道環境可接受範圍內。',
      recommendations: telemetry.restingHR > 100 
        ? ['立即執行等滲補液方案', '減少高強度運動', '監測血氧飽和度變化']
        : ['維持常規運動對策', '保持充足水分攝取'],
    },
    {
      metric: '心率變異性 (HRV)',
      value: `${telemetry.hrv} ms`,
      status: telemetry.hrv < 20 ? 'Critical' : telemetry.hrv < 25 ? 'Attention' : 'Normal',
      analysis: telemetry.hrv < 20
        ? 'HRV 嚴重抑制，表示自主神經系統壓力過大。可能與睡眠不足、過度訓練或心理壓力相關。'
        : telemetry.hrv < 25
        ? 'HRV 略低於理想值，建議加強恢復措施。'
        : 'HRV 正常，自主神經調節良好。',
      recommendations: telemetry.hrv < 20
        ? ['安排強制休息週期', '減少訓練強度', '進行放鬆訓練', '評估睡眠品質']
        : ['維持平衡的工作-休息週期', '確保充足睡眠時間'],
    },
    {
      metric: '血氧飽和度 (SpO2)',
      value: `${telemetry.spo2}%`,
      status: telemetry.spo2 < 94 ? 'Critical' : telemetry.spo2 < 96 ? 'Attention' : 'Normal',
      analysis: telemetry.spo2 < 94
        ? '血氧偏低，需立即檢查艙內氧氣濃度和 CO2 清除系統。'
        : telemetry.spo2 < 96
        ? '血氧略低，持續監測艱內環境控制系統。'
        : '血氧飽和度正常。',
      recommendations: telemetry.spo2 < 94
        ? ['檢查 ECLSS 氧氣生成系統', '測量艙內氧氣濃度', '評估呼吸系統功能']
        : ['定期監測艙內氣體成分'],
    },
    {
      metric: '平均睡眠時間',
      value: `${Math.floor(telemetry.avgSleepMinutes / 60)}h ${telemetry.avgSleepMinutes % 60}m`,
      status: telemetry.avgSleepMinutes < 360 ? 'Attention' : 'Normal',
      analysis: telemetry.avgSleepMinutes < 360
        ? `睡眠時間不足（僅 ${(telemetry.avgSleepMinutes / 60).toFixed(1)} 小時）。慢性睡眠剝奪會影響認知功能和免疫系統。`
        : '睡眠時間充足，有助於身體恢復和免疫功能。',
      recommendations: telemetry.avgSleepMinutes < 360
        ? ['調整工作時程確保 7-8 小時睡眠', '檢查睡眠艙聲學隔離', '評估褪黑激素補充必要性']
        : ['維持規律睡眠作息', '保持睡眠環境品質'],
    },
  ];

  // Analyze body systems
  const systems: SystemAnalysis[] = [
    {
      system: 'Cardiovascular',
      status: telemetry.restingHR > 100 || telemetry.hrv < 20 ? 'Attention' : 'Normal',
      summary: telemetry.restingHR > 100
        ? '心血管系統顯示微重力適應壓力，心搏過速伴隨自主神經抑制。'
        : '心血管系統適應良好。',
      concerns: telemetry.restingHR > 100 
        ? ['靜息心搏過速 (>100 bpm)', 'HRV 抑制', '可能的血容量降低']
        : [],
      recommendations: telemetry.restingHR > 100
        ? ['執行 20 分鐘等滲補液方案', '監測姿位性低血壓', '調整運動對策強度']
        : ['維持 ARED 和 T2 跑步機常規訓練'],
    },
    {
      system: 'Respiratory',
      status: telemetry.spo2 < 95 ? 'Attention' : 'Normal',
      summary: telemetry.spo2 < 95
        ? '血氧飽和度偏低，需檢查艙內環境。'
        : '呼吸系統功能正常，血氧飽和度穩定。',
      concerns: telemetry.spo2 < 95 ? ['SpO2 低於理想值'] : [],
      recommendations: telemetry.spo2 < 95
        ? ['檢查 ECLSS CO2 清除效率', '確認艙內氧氣濃度']
        : ['定期監測艙內氣體組成'],
    },
    {
      system: 'Sleep',
      status: telemetry.avgSleepMinutes < 360 || telemetry.mentalStatus !== 'Normal' ? 'Attention' : 'Normal',
      summary: telemetry.avgSleepMinutes < 360
        ? '睡眠不足可能影響任務表現和健康恢復。'
        : '睡眠時間充足，品質良好。',
      concerns: telemetry.avgSleepMinutes < 360 ? ['睡眠時間不足', '可能影響認知表現'] : [],
      recommendations: telemetry.avgSleepMinutes < 360
        ? ['優先調整任務時程確保充足睡眠', '檢查睡眠環境（噪音、光線）']
        : ['維持規律作息週期'],
    },
  ];

  // Determine overall status
  const hasCritical = metrics.some(m => m.status === 'Critical') || systems.some(s => s.status === 'Critical');
  const hasAttention = metrics.some(m => m.status === 'Attention') || systems.some(s => s.status === 'Attention');
  
  const overallStatus: 'Nominal' | 'Attention Required' | 'Critical' = hasCritical ? 'Critical' : hasAttention ? 'Attention Required' : 'Nominal';

  return {
    replyText: `[AURA 飛行外科醫師離線模式] 收到訊息：「${message}」。遙測數據顯示靜息心率為 ${telemetry.restingHR} bpm，血氧飽和度為 ${telemetry.spo2}%。建議立即執行 20 分鐘等滲補液對策，並在下次植物學實驗前安排休息週期。`,
    suggestedActions: [
      {
        id: 'act-' + Date.now() + '-1',
        label: '安排 20 分鐘補液與電解質平衡方案',
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
        label: '記錄心搏過速觀測供地面遙測',
        type: 'LOG_ANOMALY',
        payload: {
          note: `靜息心率 ${telemetry.restingHR} bpm。太空人透過語音通報。`,
        },
      },
    ],
    healthAssessment: {
      status: overallStatus,
      summary: hasCritical
        ? '檢測到關鍵健康指標異常，需立即採取醫療對策。'
        : hasAttention
        ? '心血管系統顯示微重力適應壓力。未檢測到危急缺氧狀態。'
        : '所有生理指標正常，任務適航狀態良好。',
    },
    detailedAnalysis: {
      metrics,
      systems,
    },
  };
}
