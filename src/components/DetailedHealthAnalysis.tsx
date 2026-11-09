import React from 'react';
import {
  Activity,
  Apple,
  Bone,
  Brain,
  CheckCircle,
  Dumbbell,
  Heart,
  Moon,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import type { MetricAnalysis, SystemAnalysis } from '../types';
import { StatusPill, toneFromStatus } from '../ui/StatusPill';

interface DetailedHealthAnalysisProps {
  metrics?: MetricAnalysis[];
  systems?: SystemAnalysis[];
  overallStatus: 'Nominal' | 'Attention Required' | 'Critical';
  overallSummary: string;
  dataQuality?: {
    telemetry: string;
    cabin: string;
    spaceEnvironment: string;
  };
  analysisMode?: 'live_gemini' | 'offline_fallback';
}

const overallZh: Record<string, string> = {
  Nominal: '正常',
  'Attention Required': '需注意',
  Critical: '危急',
};

const metricZh: Record<string, string> = {
  Normal: '正常',
  Attention: '注意',
  Critical: '危急',
};

const systemLabel: Record<string, string> = {
  Cardiovascular: '心血管系統',
  Respiratory: '呼吸系統',
  Sleep: '睡眠品質',
  Exercise: '運動對策',
  Mental: '心理狀態',
  Musculoskeletal: '肌肉骨骼',
  Nutrition: '營養攝取',
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'Critical') return <XCircle className="w-4 h-4" aria-hidden />;
  if (status === 'Attention' || status === 'Attention Required') return <AlertTriangle className="w-4 h-4" aria-hidden />;
  return <CheckCircle className="w-4 h-4" aria-hidden />;
}

function SystemIcon({ system }: { system: string }) {
  switch (system) {
    case 'Cardiovascular':
      return <Heart className="w-4 h-4" aria-hidden />;
    case 'Respiratory':
      return <Activity className="w-4 h-4" aria-hidden />;
    case 'Sleep':
      return <Moon className="w-4 h-4" aria-hidden />;
    case 'Exercise':
      return <Dumbbell className="w-4 h-4" aria-hidden />;
    case 'Mental':
      return <Brain className="w-4 h-4" aria-hidden />;
    case 'Musculoskeletal':
      return <Bone className="w-4 h-4" aria-hidden />;
    default:
      return <Apple className="w-4 h-4" aria-hidden />;
  }
}

function toneClass(status: string) {
  const tone = toneFromStatus(status);
  if (tone === 'crit') return 'border-rose-200 bg-rose-50/80 text-rose-950';
  if (tone === 'warn') return 'border-amber-200 bg-amber-50/80 text-amber-950';
  if (tone === 'ok') return 'border-emerald-200 bg-emerald-50/70 text-emerald-950';
  return 'border-slate-200 bg-slate-50 text-slate-800';
}

export const DetailedHealthAnalysis: React.FC<DetailedHealthAnalysisProps> = ({
  metrics = [],
  systems = [],
  overallStatus,
  overallSummary,
  dataQuality,
  analysisMode,
}) => {
  return (
    <div className="space-y-4">
      <div className={`rounded-xl p-3.5 border ${toneClass(overallStatus)}`}>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <StatusIcon status={overallStatus} />
            <h3 className="font-bold text-sm">整體健康評估</h3>
          </div>
          <StatusPill tone={toneFromStatus(overallStatus)}>{overallZh[overallStatus] || overallStatus}</StatusPill>
        </div>
        <p className="text-xs leading-relaxed">{overallSummary}</p>
        {analysisMode && (
          <p className="text-[10px] font-mono mt-2 opacity-80">
            模式：{analysisMode === 'live_gemini' ? 'Gemini 即時' : 'AURA 離線門檻引擎'}
          </p>
        )}
      </div>

      {dataQuality && (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] text-slate-600 space-y-0.5">
          <p>
            <span className="font-semibold text-slate-800">生理來源：</span>
            {dataQuality.telemetry}
          </p>
          <p>
            <span className="font-semibold text-slate-800">艙內環境：</span>
            {dataQuality.cabin}
          </p>
          <p>
            <span className="font-semibold text-slate-800">空間天氣：</span>
            {dataQuality.spaceEnvironment}
          </p>
        </div>
      )}

      {metrics.length > 0 && (
        <div>
          <h4 className="text-[11px] font-bold text-slate-600 mb-2 tracking-wide">逐項生理指標</h4>
          <div className="space-y-2">
            {metrics.map((metric) => (
              <article key={metric.metric} className={`rounded-xl p-3 border ${toneClass(metric.status)}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusIcon status={metric.status} />
                    <span className="font-bold text-xs truncate">{metric.metric}</span>
                  </div>
                  <span className="font-mono font-bold text-sm tabular-nums shrink-0">{metric.value}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  <StatusPill tone={toneFromStatus(metric.status)}>{metricZh[metric.status]}</StatusPill>
                  {metric.threshold && <StatusPill tone="neutral">{metric.threshold}</StatusPill>}
                </div>
                <p className="text-xs leading-relaxed">{metric.analysis}</p>
                {metric.recommendations.length > 0 && (
                  <ul className="mt-2 space-y-1 border-t border-current/15 pt-2">
                    {metric.recommendations.map((rec) => (
                      <li key={rec} className="text-xs flex gap-1.5">
                        <span aria-hidden>▸</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {systems.length > 0 && (
        <div>
          <h4 className="text-[11px] font-bold text-slate-600 mb-2 tracking-wide">身體系統評估</h4>
          <div className="space-y-2">
            {systems.map((system) => (
              <article key={system.system} className={`rounded-xl p-3 border ${toneClass(system.status)}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <SystemIcon system={system.system} />
                    <span className="font-bold text-xs">{systemLabel[system.system] || system.system}</span>
                  </div>
                  <StatusPill tone={toneFromStatus(system.status)}>{metricZh[system.status]}</StatusPill>
                </div>
                <p className="text-xs leading-relaxed">{system.summary}</p>
                {system.concerns.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs">
                    {system.concerns.map((c) => (
                      <li key={c}>• {c}</li>
                    ))}
                  </ul>
                )}
                {system.recommendations.length > 0 && (
                  <ul className="mt-2 space-y-1 border-t border-current/15 pt-2">
                    {system.recommendations.map((rec) => (
                      <li key={rec} className="text-xs flex gap-1.5">
                        <span aria-hidden>▸</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
