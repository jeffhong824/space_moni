import React from 'react';
import { Activity, ExternalLink, RefreshCw, Sun, Wind, Zap } from 'lucide-react';
import type { SpaceEnvironmentPayload } from '../domain/spaceWeather';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../ui/DataState';
import { StatusPill, toneFromStatus } from '../ui/StatusPill';

function fmtTime(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso.endsWith('Z') || iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
}

function riskLabel(risk: string) {
  switch (risk) {
    case 'Severe':
      return '嚴重';
    case 'High':
      return '高';
    case 'Moderate':
      return '中等';
    case 'Low':
      return '低';
    default:
      return '未知';
  }
}

function sourceStatusZh(status: string) {
  switch (status) {
    case 'ok':
      return '已連線';
    case 'empty':
      return '空窗';
    case 'timeout':
      return '逾時';
    case 'error':
      return '失敗';
    default:
      return status;
  }
}

export const SpaceEnvironmentPanel: React.FC<{
  payload?: SpaceEnvironmentPayload | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  speDemo?: boolean;
}> = ({ payload = null, loading = false, error = null, onRefresh, speDemo = false }) => {
  const data = payload;
  const obs = data?.observations;
  const demoKey = data?.nasaKeyMode === 'demo_key';
  const donkiSources = data?.sources.filter((s) => s.id.startsWith('nasa-donki')) ?? [];
  const donkiAllTimeout = donkiSources.length > 0 && donkiSources.every((s) => s.status === 'timeout');
  const donkiAnyTimeout = donkiSources.some((s) => s.status === 'timeout');
  const donkiEmptyOk =
    donkiSources.length > 0 &&
    donkiSources.every((s) => s.status === 'empty' || s.status === 'ok') &&
    !donkiAnyTimeout;
  const donkiNoEvents =
    !!data &&
    data.events.solarFlares.length === 0 &&
    data.events.geomagneticStorms.length === 0 &&
    data.events.coronalMassEjections.length === 0;

  return (
    <section
      aria-labelledby="space-env-heading"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden"
    >
      <header className="px-4 py-3 bg-gradient-to-r from-sky-50 to-indigo-50 border-b border-slate-200/80 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
            <Sun className="w-4 h-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 id="space-env-heading" className="text-sm font-bold text-slate-900 leading-tight">
              官方空間環境
            </h3>
            <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
              NOAA SWPC／GOES 即時觀測 · NASA DONKI 事件目錄
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRefresh?.()}
          disabled={loading || !onRefresh}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-white/80 hover:text-slate-900 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-sky-600"
          aria-label="重新整理空間環境資料"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
        </button>
      </header>

      <div className="p-4 space-y-3">
        {loading && !data && <LoadingBlock label="正在向 NOAA SWPC 與 NASA DONKI 擷取…" />}

        {error && !data && (
          <ErrorBlock title="空間環境饋送失敗" detail={error} onRetry={() => onRefresh?.()} />
        )}

        {speDemo && (
          <p className="text-[11px] leading-relaxed rounded-lg border border-amber-300 bg-amber-50 text-amber-950 px-2.5 py-2 font-semibold">
            示範太陽質子事件已疊加：S 尺度與質子通量不是 NOAA 即時觀測。
          </p>
        )}

        {demoKey && data && (
          <p className="text-[11px] leading-relaxed rounded-lg border border-amber-200 bg-amber-50 text-amber-950 px-2.5 py-2">
            非營運金鑰：NASA DONKI 使用公開 DEMO_KEY。設定 <span className="font-mono">NASA_API_KEY</span> 後可改用申請金鑰。即時觀測不依賴此金鑰。
          </p>
        )}

        {data && (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusPill tone={toneFromStatus(data.overallStatus)}>
                饋送 {data.overallStatus === 'ok' ? '完整' : data.overallStatus === 'partial' ? '部分' : '中斷'}
              </StatusPill>
              <StatusPill tone={toneFromStatus(data.scales.radiationRisk)}>
                輻射風險 {riskLabel(data.scales.radiationRisk)}
              </StatusPill>
              <StatusPill tone="info">
                {data.scales.gScale} · {data.scales.rScale} · {data.scales.sScale}
              </StatusPill>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <MetricTile
                icon={<Activity className="w-3.5 h-3.5 text-indigo-600" aria-hidden />}
                label="行星 Kp"
                value={obs?.kp ? obs.kp.value.toFixed(2) : '—'}
                unit="Kp"
                time={obs?.kp?.observedAt}
              />
              <MetricTile
                icon={<Zap className="w-3.5 h-3.5 text-amber-600" aria-hidden />}
                label="GOES X 射線"
                value={obs?.goesXray?.goesClass ?? '—'}
                unit={obs?.goesXray ? obs.goesXray.fluxUnit : ''}
                time={obs?.goesXray?.observedAt}
                sub={obs?.goesXray ? `${obs.goesXray.satellite} · ${obs.goesXray.energyBand}` : undefined}
              />
              <MetricTile
                icon={<Wind className="w-3.5 h-3.5 text-sky-600" aria-hidden />}
                label="太陽風速"
                value={obs?.solarWind ? String(Math.round(obs.solarWind.speed)) : '—'}
                unit="km/s"
                time={obs?.solarWind?.observedAt}
              />
              <MetricTile
                icon={<Sun className="w-3.5 h-3.5 text-rose-600" aria-hidden />}
                label="≥10 MeV 質子"
                value={obs?.protons ? obs.protons.flux.toExponential(2) : '—'}
                unit="pfu"
                time={obs?.protons?.observedAt}
                sub={obs?.protons?.satellite}
              />
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">{data.scales.basisZh}</p>

            {data.notices.map((note) => (
              <p
                key={note}
                className="text-[11px] leading-relaxed rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-slate-700"
              >
                {note}
              </p>
            ))}

            {data.events.swpcAlerts.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  NOAA 警報（原文）
                </h4>
                <ul className="space-y-1.5">
                  {data.events.swpcAlerts.slice(0, 3).map((alert) => (
                    <li
                      key={`${alert.productId}-${alert.issueDatetime}`}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-2"
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                        <span>{alert.productId || 'ALERT'}</span>
                        <time dateTime={alert.issueDatetime}>{fmtTime(alert.issueDatetime)}</time>
                      </div>
                      <p className="text-[11px] text-slate-800 mt-1 leading-relaxed">{alert.headline}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                NASA DONKI 7 日事件
              </h4>
              {donkiNoEvents ? (
                donkiAllTimeout ? (
                  <EmptyBlock
                    title="NASA DONKI 連線逾時"
                    detail="這是逾時，不是確認無事件。未填補閃焰／CME。"
                  />
                ) : donkiAnyTimeout ? (
                  <EmptyBlock
                    title="NASA DONKI 部分逾時"
                    detail="部分目錄逾時，其餘為空窗或成功。未填補事件；逾時≠確認無事件。"
                  />
                ) : donkiEmptyOk ? (
                  <EmptyBlock
                    title="視窗內確實無 DONKI 事件"
                    detail="來源回報空窗或已連線且無紀錄，非逾時，亦未填補。"
                  />
                ) : (
                  <EmptyBlock
                    title="目錄無事件"
                    detail="未填補閃焰／CME。"
                  />
                )
              ) : (
                <ul className="space-y-1.5 max-h-28 overflow-y-auto">
                  {data.events.solarFlares.slice(0, 5).map((flare) => (
                    <li key={flare.flrID} className="rounded-lg bg-amber-50 border border-amber-100 px-2 py-1.5 text-[11px]">
                      <div className="flex justify-between font-mono">
                        <span className="font-bold text-amber-950">{flare.classType}</span>
                        <span className="text-amber-800">{fmtTime(flare.peakTime)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <details className="rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-2">
              <summary className="text-[11px] font-semibold text-slate-700 cursor-pointer">資料出處與延遲</summary>
              <ul className="mt-2 space-y-1.5">
                {data.sources.map((src) => (
                  <li key={src.id} className="text-[11px] text-slate-600 leading-snug">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-800">{src.agency} · {src.name}</span>
                      <StatusPill tone={src.status === 'ok' ? 'ok' : src.status === 'empty' ? 'info' : 'warn'}>
                        {sourceStatusZh(src.status)} · {src.latencyMs} ms
                      </StatusPill>
                    </div>
                    <p>{src.noteZh}{src.observedAt ? ` · 觀測 ${fmtTime(src.observedAt)}` : ''}</p>
                    <a
                      href={src.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 text-sky-700 hover:underline"
                    >
                      文件 <ExternalLink className="w-3 h-3" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </details>

            <p className="text-[10px] font-mono text-slate-400 text-center">
              擷取 {fmtTime(data.fetchedAt)}
              {data.cache.hit ? ` · 快取 ${data.cache.ttlSeconds}s` : ''}
            </p>
          </>
        )}
      </div>
    </section>
  );
};

function MetricTile({
  icon,
  label,
  value,
  unit,
  time,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  time?: string | null;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 min-w-0">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums leading-none truncate" title={value}>
        {value}
        {unit ? <span className="text-[10px] font-medium text-slate-500 ml-1">{unit}</span> : null}
      </p>
      <p className="mt-1 text-[10px] text-slate-500 font-mono truncate">
        {sub ? `${sub} · ` : ''}
        {time ? fmtTime(time) : '無觀測'}
      </p>
    </div>
  );
}
