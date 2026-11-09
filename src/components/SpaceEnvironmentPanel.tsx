import React, { useState, useEffect } from 'react';
import { Sun, Radio, AlertTriangle, TrendingUp, RefreshCw, Zap, Activity } from 'lucide-react';

interface SpaceEnvironmentData {
  timestamp: string;
  solarFlares: Array<{
    flrID?: string;
    beginTime?: string;
    peakTime?: string;
    classType?: string;
    sourceLocation?: string;
  }>;
  geomagneticStorms: Array<{
    gstID?: string;
    startTime?: string;
    kpIndex?: number;
  }>;
  coronalMassEjections: Array<{
    activityID?: string;
    startTime?: string;
    note?: string;
  }>;
  summary: {
    totalEvents: number;
    highestSolarFlareClass: string;
    maxKpIndex: number;
    radiationRisk: string;
  };
}

interface SpaceEnvironmentPanelProps {
  isCollapsed?: boolean;
}

export const SpaceEnvironmentPanel: React.FC<SpaceEnvironmentPanelProps> = ({ isCollapsed }) => {
  const [data, setData] = useState<SpaceEnvironmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchSpaceEnvironment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/nasa/space-environment');
      if (!response.ok) {
        throw new Error('無法連接 NASA DONKI 空間天氣資料庫');
      }
      
      const envData = await response.json();
      setData(envData);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Space environment fetch error:', err);
      setError(err.message || '資料載入失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaceEnvironment();
    // Refresh every 30 minutes
    const interval = setInterval(fetchSpaceEnvironment, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isCollapsed) {
    return null;
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Severe': return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Moderate': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'Severe': return '嚴重';
      case 'High': return '高';
      case 'Moderate': return '中等';
      case 'Low': return '低';
      default: return '未知';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-sky-50 to-indigo-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">太空環境監測</h3>
            <p className="text-xs text-slate-500 font-mono">NASA DONKI 空間天氣資料</p>
          </div>
        </div>
        
        <button
          onClick={fetchSpaceEnvironment}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-white/60 text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
          title="重新整理資料"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {loading && !data && (
          <div className="text-center py-8 text-slate-400 text-xs">
            <Radio className="w-6 h-6 mx-auto mb-2 animate-pulse" />
            <p>正在連接 NASA 資料源...</p>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">資料源連線失敗</p>
                <p className="text-rose-700 mt-1">{error}</p>
                <p className="text-rose-600 mt-2 text-[11px]">
                  NASA DONKI API 可能暫時無法使用。系統將使用艙內感測器資料作為備援。
                </p>
              </div>
            </div>
          </div>
        )}

        {data && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[10px] font-mono text-slate-500 uppercase">太陽閃焰等級</span>
                </div>
                <p className="text-lg font-bold text-slate-900 font-mono">
                  {data.summary.highestSolarFlareClass}
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[10px] font-mono text-slate-500 uppercase">地磁 Kp 指數</span>
                </div>
                <p className="text-lg font-bold text-slate-900 font-mono">
                  {data.summary.maxKpIndex > 0 ? data.summary.maxKpIndex.toFixed(1) : 'N/A'}
                </p>
              </div>
            </div>

            {/* Radiation Risk Banner */}
            <div className={`rounded-lg px-3 py-2 border ${getRiskColor(data.summary.radiationRisk)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-semibold">輻射風險等級</span>
                </div>
                <span className="text-sm font-bold font-mono">
                  {getRiskLabel(data.summary.radiationRisk)}
                </span>
              </div>
            </div>

            {/* Event Count */}
            <div className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-3">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                過去 7 天事件總數
              </span>
              <span className="font-bold font-mono">{data.summary.totalEvents}</span>
            </div>

            {/* Recent Events */}
            {data.solarFlares.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-[10px] font-mono uppercase text-slate-500 mb-2">最近太陽閃焰</h4>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {data.solarFlares.slice(0, 5).map((flare, idx) => (
                    <div key={idx} className="bg-amber-50 rounded px-2 py-1.5 text-[11px] border border-amber-100">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 font-mono">{flare.classType || 'N/A'}</span>
                        <span className="text-amber-700">
                          {flare.peakTime ? new Date(flare.peakTime).toLocaleString('zh-TW', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : 'N/A'}
                        </span>
                      </div>
                      {flare.sourceLocation && (
                        <p className="text-amber-600 mt-0.5">來源：{flare.sourceLocation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Update */}
            {lastUpdate && (
              <div className="text-[10px] text-slate-400 text-center font-mono pt-2 border-t border-slate-100">
                最後更新：{lastUpdate.toLocaleTimeString('zh-TW')}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
