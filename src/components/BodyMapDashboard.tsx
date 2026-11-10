import React, { useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, Brain, Dumbbell, Radio } from 'lucide-react';
import { SimBadge } from './SimBadge';
import { StatusPill, toneFromStatus } from '../ui/StatusPill';
import { AnatomicalFigure } from './AnatomicalFigure';
import { useI18n } from '../i18n/I18nProvider';
import { statusLabel } from '../i18n/index';
import type { SpaceEnvironmentPayload } from '../domain/spaceWeather';
import type { CrewDef } from '../world/catalog';
import { SHIPS } from '../world/catalog';
import {
  bodyHealthAt,
  combinedTrend,
  REGION_DOMAIN,
  type BodyDomainId,
  type BodyRegionId,
  type Rank,
  type TrendRange,
} from '../world/bodyHealth';
import { daySchedule, exerciseLog } from '../world/worldState';

const STATUS = ['Normal', 'Attention', 'Critical'] as const;

function fmtHour(h: number): string {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  return `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export const BodyMapDashboard: React.FC<{
  crew: CrewDef;
  tNow: number;
  wx: SpaceEnvironmentPayload | null;
  onOpenAiCall: (prompt?: string) => void;
  compact?: boolean;
}> = ({ crew, tNow, wx, onOpenAiCall, compact = false }) => {
  const { t, lang } = useI18n();
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [selected, setSelected] = useState<BodyRegionId | null>('heart');
  const [range, setRange] = useState<TrendRange>('24h');

  const health = useMemo(() => bodyHealthAt(crew, tNow, wx), [crew, tNow, wx]);
  const series = useMemo(() => combinedTrend(crew, tNow, range, wx), [crew, tNow, range, wx]);
  const schedule = useMemo(() => daySchedule(crew, tNow), [crew, tNow]);
  const exLog = useMemo(() => exerciseLog(crew, tNow), [crew, tNow]);
  const ship = SHIPS.find((s) => s.id === crew.shipId);
  const w = health.snap.wearable;
  const pulseRegion =
    (Object.entries(health.regionRank) as [BodyRegionId, Rank][]).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const radar = health.domains.map((d) => ({
    key: t(`body.domain.${d.id}`),
    score: d.score,
  }));

  const domainOf = selected ? REGION_DOMAIN[selected] : null;
  const domain = health.domains.find((d) => d.id === domainOf);

  const askAura = (domainId: BodyDomainId) => {
    const d = health.domains.find((x) => x.id === domainId);
    onOpenAiCall(
      t('body.askPrompt', {
        name: crew.name,
        domain: t(`body.domain.${domainId}`),
        value: d?.valueLabel ?? '',
        score: d?.score ?? 0,
      })
    );
  };

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 overflow-hidden">
      <header className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold tracking-tight">{t('body.title')}</h2>
            <SimBadge />
            <StatusPill tone={toneFromStatus(STATUS[health.overallRank])}>{statusLabel(lang, STATUS[health.overallRank])}</StatusPill>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {crew.name} · {t(crew.occupationKey)} · {ship ? t(ship.nameKey) : ''} · {t('body.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-rose-300">
          <span className="inline-block w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
          <span className="text-lg font-bold tabular-nums">{w.hr}</span>
          <span className="text-[10px] text-slate-500">bpm</span>
          <span className="text-[11px] text-slate-400">SpO₂ {w.spo2}%</span>
        </div>
      </header>

      <div className={`grid ${compact ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(220px,280px)_1fr]'} gap-0`}>
        <div className="p-3 border-b lg:border-b-0 lg:border-r border-slate-800">
          <div className="flex gap-1 mb-2">
            <button
              type="button"
              onClick={() => setSide('front')}
              className={`flex-1 text-[11px] font-semibold py-1.5 rounded-lg border ${side === 'front' ? 'bg-cyan-900/60 border-cyan-500 text-cyan-100' : 'border-slate-700 text-slate-400'}`}
            >
              {t('body.front')}
            </button>
            <button
              type="button"
              onClick={() => setSide('back')}
              className={`flex-1 text-[11px] font-semibold py-1.5 rounded-lg border ${side === 'back' ? 'bg-cyan-900/60 border-cyan-500 text-cyan-100' : 'border-slate-700 text-slate-400'}`}
            >
              {t('body.back')}
            </button>
          </div>
          <div className="relative mx-auto max-w-[240px]">
            <AnatomicalFigure
              side={side}
              regionRank={health.regionRank}
              selected={selected}
              onSelect={setSelected}
              pulse={pulseRegion}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">{t('body.credit')}</p>
        </div>

        <div className="p-3 space-y-3 min-w-0">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold">{selected ? t(`body.region.${selected}`) : t('body.regionDetail')}</h3>
              {domain && (
                <StatusPill tone={toneFromStatus(STATUS[domain.rank])}>{statusLabel(lang, STATUS[domain.rank])}</StatusPill>
              )}
            </div>
            {domain && (
              <>
                <p className="text-[11px] text-slate-300 mt-1">
                  {t(`body.domain.${domain.id}`)} · {domain.valueLabel} · {t('body.score', { n: domain.score })}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">{t(`body.hrp.${domain.id}`)}</p>
                <button
                  type="button"
                  onClick={() => askAura(domain.id)}
                  className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-sky-600 text-sky-200"
                >
                  <Radio className="w-3 h-3" />
                  {t('body.askAura')}
                </button>
              </>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2 h-48">
              <p className="text-[10px] font-semibold text-slate-400 px-1 flex items-center gap-1">
                <Brain className="w-3 h-3" /> {t('body.radar')}
              </p>
              <ResponsiveContainer width="100%" height="90%">
                <RadarChart data={radar}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="key" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 space-y-1.5">
              <p className="text-[10px] font-semibold text-slate-400">{t('body.liveVitals')}</p>
              <p className="text-[11px] font-mono text-slate-200">
                {t('wear.hr')} {w.hr} · {t('wear.hrv')} {w.hrv} · {t('wear.resp')} {w.respRate} · SpO₂ {w.spo2}%
              </p>
              <p className="text-[11px] font-mono text-slate-400">
                {t('wear.bp')} {w.bpSys}/{w.bpDia} · {t('wear.core')} {w.coreTempC}°C · {t('wear.skin')} {w.skinTempC}°C
              </p>
              <p className="text-[11px] font-mono text-amber-200/90">
                {t('wear.dose')} {w.doseMsv} / {health.doseLimitMsv} mSv · {t('body.boneLoss')} −{health.boneLossPct}%
              </p>
              <p className="text-[10px] text-amber-300/80">{t('wear.liveStream')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-slate-800 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-bold">{t('body.trends')}</h3>
          <div className="flex gap-1">
            {(['24h', '7d', 'mission'] as TrendRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`text-[10px] font-semibold px-2 py-1 rounded-md border ${range === r ? 'bg-slate-100 text-slate-900 border-slate-100' : 'border-slate-700 text-slate-400'}`}
              >
                {t(`body.range.${r}`)}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[10px] text-amber-200/90">
          {t('body.forecastHint')} · {t('body.prediction')}
        </p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#64748b', fontSize: 9 }} width={32} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 11 }}
                labelStyle={{ color: '#cbd5e1' }}
              />
              <Area dataKey="hrHi" stroke="none" fill="#fb7185" fillOpacity={0.12} />
              <Line type="monotone" dataKey="hr" stroke="#fb7185" dot={false} strokeWidth={1.6} name={t('wear.hr')} />
              <Line type="monotone" dataKey="spo2" stroke="#22d3ee" dot={false} strokeWidth={1.2} name="SpO₂" />
              <Line
                type="monotone"
                dataKey="doseMsv"
                stroke="#a78bfa"
                dot={false}
                strokeWidth={1.2}
                strokeDasharray="4 3"
                name={t('wear.dose')}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <ul className="grid sm:grid-cols-3 gap-2 text-[10px] font-mono text-slate-400">
          <li>
            {t('body.forecastHr')}: {series.filter((p) => p.predicted).slice(-1)[0]?.hr ?? '—'} bpm
          </li>
          <li>
            {t('body.forecastDose')}: {series.filter((p) => p.predicted).slice(-1)[0]?.doseMsv ?? '—'} mSv
          </li>
          <li>
            {t('body.forecastBone')}: −{series.filter((p) => p.predicted).slice(-1)[0]?.boneLossPct ?? '—'}%
          </li>
        </ul>
      </div>

      <div className="grid lg:grid-cols-2 gap-0 border-t border-slate-800">
        <div className="p-4 border-b lg:border-b-0 lg:border-r border-slate-800">
          <h3 className="text-xs font-bold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> {t('body.activityLog')}
          </h3>
          <ol className="mt-2 space-y-1 max-h-48 overflow-y-auto">
            {schedule.map((b) => (
              <li
                key={`${b.startHour}-${b.activityKey}`}
                className={`flex items-center gap-2 text-[11px] rounded-lg px-2 py-1 ${b.current ? 'bg-cyan-950 border border-cyan-700' : ''}`}
              >
                <span className="font-mono text-slate-500 w-24 shrink-0">
                  {fmtHour(b.startHour)}–{fmtHour(b.endHour)}
                </span>
                <span className={b.done ? 'text-slate-500 line-through' : 'text-slate-200'}>{t(b.activityKey)}</span>
                <span className="ml-auto text-[10px] text-slate-500">
                  {b.current ? t('body.now') : b.done ? t('body.done') : t('body.upcoming')}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="p-4">
          <h3 className="text-xs font-bold flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5" /> {t('body.exerciseLog')}
          </h3>
          <ul className="mt-2 space-y-1.5">
            {exLog.map((b) => (
              <li key={b.device} className="flex items-center gap-2 text-[11px] rounded-lg border border-slate-800 px-2 py-1.5">
                <span className="font-semibold text-slate-100">{t(`body.ex.${b.device}`)}</span>
                <span className="font-mono text-slate-500">
                  {fmtHour(b.startHour)}–{fmtHour(b.endHour)}
                </span>
                <span className="ml-auto text-[10px] text-slate-500">
                  {b.current ? t('body.now') : b.done ? t('body.done') : t('body.upcoming')}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {health.domains.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => askAura(d.id)}
                className="text-[10px] px-2 py-1 rounded-md border border-slate-700 text-slate-300 hover:border-cyan-600"
              >
                {t('body.askAura')} · {t(`body.domain.${d.id}`)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
