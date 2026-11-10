import React from 'react';
import { Activity, ExternalLink, RefreshCw, Sun, Wind, Zap } from 'lucide-react';
import type { SpaceEnvironmentPayload } from '../domain/spaceWeather';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../ui/DataState';
import { StatusPill, toneFromStatus } from '../ui/StatusPill';
import { useI18n } from '../i18n/I18nProvider';

function fmtTime(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso.endsWith('Z') || iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
}

function riskKey(risk: string) {
  if (risk === 'Severe') return 'wx.riskSevere';
  if (risk === 'High') return 'wx.riskHigh';
  if (risk === 'Moderate') return 'wx.riskModerate';
  if (risk === 'Low') return 'wx.riskLow';
  return 'wx.riskUnknown';
}

function sourceStatusKey(status: string) {
  if (status === 'ok') return 'wx.srcOk';
  if (status === 'empty') return 'wx.srcEmpty';
  if (status === 'timeout') return 'wx.srcTimeout';
  if (status === 'error') return 'wx.srcError';
  return '';
}

export function feedImpact(
  data: SpaceEnvironmentPayload | null,
  t: (k: string, v?: Record<string, string | number>) => string
): string {
  if (!data || data.overallStatus === 'unavailable') return t('wx.impactDown');
  if (data.overallStatus === 'ok') return t('wx.impactOk');
  const noaaLive = data.sources.some((s) => s.agency === 'NOAA' && (s.status === 'ok' || s.status === 'empty'));
  const donkiDown = data.sources.some(
    (s) => (s.id.includes('donki') || s.agency === 'NASA') && s.status !== 'ok' && s.status !== 'empty'
  );
  if (noaaLive && donkiDown) {
    return t('wx.impactPartial', { live: t('wx.noaaData'), down: t('wx.donkiFlares') });
  }
  const live = [...new Set(data.sources.filter((s) => s.status === 'ok' || s.status === 'empty').map((s) => s.agency))]
    .join(', ') || t('wx.noaaData');
  const down =
    [...new Set(data.sources.filter((s) => s.status !== 'ok' && s.status !== 'empty').map((s) => s.name))].join(', ') ||
    t('wx.donkiFlares');
  return t('wx.impactPartial', { live, down });
}

export const SpaceEnvironmentPanel: React.FC<{
  payload?: SpaceEnvironmentPayload | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  speDemo?: boolean;
  lastOk?: string | null;
}> = ({ payload = null, loading = false, error = null, onRefresh, speDemo = false, lastOk = null }) => {
  const { t } = useI18n();
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
              {t('wx.title')}
            </h3>
            <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
              {t('wx.sub')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRefresh?.()}
          disabled={loading || !onRefresh}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-white/80 hover:text-slate-900 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-sky-600"
          aria-label={t('wx.refresh')}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
        </button>
      </header>

      <div className="p-4 space-y-3">
        {loading && !data && <LoadingBlock label={t('wx.loading')} />}

        {error && !data && (
          <ErrorBlock title={t('wx.fail')} detail={error} onRetry={() => onRefresh?.()} retryLabel={t('common.retry')} />
        )}

        {(error || data?.overallStatus === 'partial' || data?.overallStatus === 'unavailable') && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 space-y-1.5">
            <p className="text-[12px] font-semibold text-amber-950 leading-snug">{feedImpact(data, t)}</p>
            <p className="text-[11px] text-amber-800 font-mono">
              {t('wx.lastOk', { time: fmtTime(lastOk || data?.fetchedAt) })}
            </p>
            {onRefresh && (
              <button
                type="button"
                onClick={() => onRefresh()}
                disabled={loading}
                className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-white text-[11px] font-semibold text-amber-950 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} aria-hidden />
                {t('common.retry')}
              </button>
            )}
          </div>
        )}

        {speDemo && (
          <p className="text-[11px] leading-relaxed rounded-lg border border-amber-300 bg-amber-50 text-amber-950 px-2.5 py-2 font-semibold">
            {t('wx.speBanner')}
          </p>
        )}

        {demoKey && data && (
          <p className="text-[11px] leading-relaxed rounded-lg border border-amber-200 bg-amber-50 text-amber-950 px-2.5 py-2">
            {t('wx.demoKey')}
          </p>
        )}

        {data && (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusPill tone={toneFromStatus(data.overallStatus)}>
                {t('wx.feed', { state: data.overallStatus === 'ok' ? t('wx.feedOk') : data.overallStatus === 'partial' ? t('wx.feedPartial') : t('wx.feedDown') })}
              </StatusPill>
              <StatusPill tone={toneFromStatus(data.scales.radiationRisk)}>
                {t('wx.radRisk', { risk: t(riskKey(data.scales.radiationRisk)) })}
              </StatusPill>
              <StatusPill tone="info">
                <span title={`${t('glossary.gScale')} ${t('glossary.sScale')} ${t('glossary.rScale')}`}>
                  {data.scales.gScale} · {data.scales.rScale} · {data.scales.sScale}
                </span>
              </StatusPill>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <MetricTile
                icon={<Activity className="w-3.5 h-3.5 text-indigo-600" aria-hidden />}
                label={t('wx.kp')}
                title={t('glossary.kp')}
                value={obs?.kp ? obs.kp.value.toFixed(2) : '—'}
                unit="Kp"
                time={obs?.kp?.observedAt}
              />
              <MetricTile
                icon={<Zap className="w-3.5 h-3.5 text-amber-600" aria-hidden />}
                label={t('wx.xray')}
                value={obs?.goesXray?.goesClass ?? '—'}
                unit={obs?.goesXray ? obs.goesXray.fluxUnit : ''}
                time={obs?.goesXray?.observedAt}
                sub={obs?.goesXray ? `${obs.goesXray.satellite} · ${obs.goesXray.energyBand}` : undefined}
              />
              <MetricTile
                icon={<Wind className="w-3.5 h-3.5 text-sky-600" aria-hidden />}
                label={t('wx.wind')}
                value={obs?.solarWind ? String(Math.round(obs.solarWind.speed)) : '—'}
                unit="km/s"
                time={obs?.solarWind?.observedAt}
              />
              <MetricTile
                icon={<Sun className="w-3.5 h-3.5 text-rose-600" aria-hidden />}
                label={t('wx.protons')}
                value={obs?.protons ? obs.protons.flux.toExponential(2) : '—'}
                unit="pfu"
                time={obs?.protons?.observedAt}
                sub={obs?.protons?.satellite}
              />
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              {t('wx.basis', { g: data.scales.gScale, r: data.scales.rScale, s: data.scales.sScale })}
            </p>

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
                  {t('wx.alerts')}
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
                {t('wx.donki')}
              </h4>
              {donkiNoEvents ? (
                donkiAllTimeout ? (
                  <EmptyBlock
                    title={t('wx.donkiTimeout')}
                    detail={t('wx.donkiTimeoutDetail')}
                  />
                ) : donkiAnyTimeout ? (
                  <EmptyBlock
                    title={t('wx.donkiPartial')}
                    detail={t('wx.donkiPartialDetail')}
                  />
                ) : donkiEmptyOk ? (
                  <EmptyBlock
                    title={t('wx.donkiEmpty')}
                    detail={t('wx.donkiEmptyDetail')}
                  />
                ) : (
                  <EmptyBlock
                    title={t('wx.donkiNone')}
                    detail={t('wx.donkiNoneDetail')}
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
              <summary className="text-[11px] font-semibold text-slate-700 cursor-pointer">{t('wx.provenance')}</summary>
              <ul className="mt-2 space-y-1.5">
                {data.sources.map((src) => (
                  <li key={src.id} className="text-[11px] text-slate-600 leading-snug">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-800">{src.agency} · {src.name}</span>
                      <StatusPill tone={src.status === 'ok' ? 'ok' : src.status === 'empty' ? 'info' : 'warn'}>
                        {sourceStatusKey(src.status) ? t(sourceStatusKey(src.status)) : src.status} · {src.latencyMs} ms
                      </StatusPill>
                    </div>
                    <p>
                      {sourceStatusKey(src.status) ? t(sourceStatusKey(src.status)) : src.status}
                      {src.observedAt ? ` · ${t('wx.observedAt', { time: fmtTime(src.observedAt) })}` : ''}
                    </p>
                    <a
                      href={src.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 text-sky-700 hover:underline"
                    >
                      {t('wx.docs')} <ExternalLink className="w-3 h-3" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </details>

            <p className="text-[10px] font-mono text-slate-400 text-center">
              {t('wx.fetched', { time: fmtTime(data.fetchedAt) })}
              {data.cache.hit ? t('wx.cache', { s: data.cache.ttlSeconds }) : ''}
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
  title,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  time?: string | null;
  sub?: string;
  title?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 min-w-0" title={title}>
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
        {time ? fmtTime(time) : '—'}
      </p>
    </div>
  );
}
