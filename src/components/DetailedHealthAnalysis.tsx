import React from 'react';
import { Heart, Activity, Droplets, Moon, Dumbbell, Brain, Bone, Apple, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

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

interface DetailedHealthAnalysisProps {
  metrics?: MetricAnalysis[];
  systems?: SystemAnalysis[];
  overallStatus: 'Nominal' | 'Attention Required' | 'Critical';
  overallSummary: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Critical': return 'text-rose-600 bg-rose-50 border-rose-200';
    case 'Attention': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'Normal': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Critical': return <XCircle className="w-4 h-4" />;
    case 'Attention': return <AlertTriangle className="w-4 h-4" />;
    case 'Normal': return <CheckCircle className="w-4 h-4" />;
    default: return <Activity className="w-4 h-4" />;
  }
};

const getSystemIcon = (system: string) => {
  switch (system) {
    case 'Cardiovascular': return <Heart className="w-4 h-4" />;
    case 'Respiratory': return <Activity className="w-4 h-4" />;
    case 'Sleep': return <Moon className="w-4 h-4" />;
    case 'Exercise': return <Dumbbell className="w-4 h-4" />;
    case 'Mental': return <Brain className="w-4 h-4" />;
    case 'Musculoskeletal': return <Bone className="w-4 h-4" />;
    case 'Nutrition': return <Apple className="w-4 h-4" />;
    default: return <Activity className="w-4 h-4" />;
  }
};

const getSystemLabel = (system: string) => {
  switch (system) {
    case 'Cardiovascular': return '心血管系統';
    case 'Respiratory': return '呼吸系統';
    case 'Sleep': return '睡眠品質';
    case 'Exercise': return '運動表現';
    case 'Mental': return '心理狀態';
    case 'Musculoskeletal': return '肌肉骨骼';
    case 'Nutrition': return '營養攝取';
    default: return system;
  }
};

export const DetailedHealthAnalysis: React.FC<DetailedHealthAnalysisProps> = ({
  metrics = [],
  systems = [],
  overallStatus,
  overallSummary,
}) => {
  return (
    <div className="space-y-4">
      {/* Overall Health Status */}
      <div className={`rounded-xl p-4 border-2 ${getStatusColor(overallStatus)}`}>
        <div className="flex items-center gap-2 mb-2">
          {getStatusIcon(overallStatus)}
          <h3 className="font-bold text-sm">整體健康評估</h3>
        </div>
        <p className="text-xs leading-relaxed">{overallSummary}</p>
      </div>

      {/* Per-Metric Analysis */}
      {metrics.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">生理指標分析</h4>
          <div className="space-y-2">
            {metrics.map((metric, idx) => (
              <div key={idx} className={`rounded-lg p-3 border ${getStatusColor(metric.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(metric.status)}
                    <span className="font-bold text-xs">{metric.metric}</span>
                  </div>
                  <span className="font-mono font-bold text-sm">{metric.value}</span>
                </div>
                <p className="text-xs leading-relaxed mb-2">{metric.analysis}</p>
                {metric.recommendations.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-current/20">
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1 opacity-70">建議對策</p>
                    <ul className="space-y-1">
                      {metric.recommendations.map((rec, recIdx) => (
                        <li key={recIdx} className="text-xs flex items-start gap-1.5">
                          <span className="text-[10px] mt-0.5">▸</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-System Analysis */}
      {systems.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">身體系統評估</h4>
          <div className="space-y-2">
            {systems.map((system, idx) => (
              <div key={idx} className={`rounded-lg p-3 border ${getStatusColor(system.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getSystemIcon(system.system)}
                    <span className="font-bold text-xs">{getSystemLabel(system.system)}</span>
                  </div>
                  {getStatusIcon(system.status)}
                </div>
                <p className="text-xs leading-relaxed mb-2">{system.summary}</p>
                
                {system.concerns.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-current/20">
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1 opacity-70">關注事項</p>
                    <ul className="space-y-1">
                      {system.concerns.map((concern, cIdx) => (
                        <li key={cIdx} className="text-xs flex items-start gap-1.5">
                          <span className="text-[10px] mt-0.5">•</span>
                          <span>{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {system.recommendations.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-current/20">
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1 opacity-70">醫療建議</p>
                    <ul className="space-y-1">
                      {system.recommendations.map((rec, recIdx) => (
                        <li key={recIdx} className="text-xs flex items-start gap-1.5">
                          <span className="text-[10px] mt-0.5">▸</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
