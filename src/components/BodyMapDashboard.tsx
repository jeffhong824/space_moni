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
import { Activity, Brain, Dumbbell } from 'lucide-react';
import { AnatomicalFigure } from './AnatomicalFigure';
import { useI18n } from '../i18n/I18nProvider';
import { statusLabel } from '../i18n/index';
import { Segmented, Sheet, StatusDot, toneFromRank } from '../ui/chrome';
import { StatusPill } from '../ui/StatusPill';
import type { SpaceEnvironmentPayload } from '../domain/spaceWeather';
import type { CrewDef } from '../world/catalog';
import { SHIPS } from '../world/catalog';
import {
  BACK_REGIONS,
  bodyHealthAt,
  combinedTrend,
  FRONT_REGIONS,
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
  hero?: boolean;
  figureOnly?: boolean;
  onAskAura?: (prompt?: string) => void;
}> = ({ crew, tNow, wx, onOpenAiCall, compact = false, hero = false, figureOnly = false }) => {
  const { t, lang } = useI18n();
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [selected, setSelected] = useState<BodyRegionId | null>(hero ? 'heart' : 'heart');
  const [range, setRange] = useState<TrendRange>('24h');
  const [sheetOpen, setSheetOpen] = useState(!hero && !figureOnly && !compact);
  const [inspTab, setInspTab] = useState<'overview' | 'body' | 'radar'>('overview');
  const tabbed = !hero && !figureOnly && !compact;

  const health = useMemo(() => bodyHealthAt(crew, tNow, wx), [crew, tNow, wx]);
  const series = useMemo(() => combinedTrend(crew, tNow, range, wx), [crew, tNow, range, wx]);
  const schedule = useMemo(() => daySchedule(crew, tNow), [crew, tNow]);
  const exLog = useMemo(() => exerciseLog(crew, tNow), [crew, tNow]);
  const ship = SHIPS.find((s) => s.id === crew.shipId);
  const w = health.snap.wearable;
  const visibleRegions = side === 'front' ? FRONT_REGIONS : BACK_REGIONS;
  const pulseRegion =
    (Object.entries(health.regionRank) as [BodyRegionId, Rank][])
      .filter(([id, rank]) => visibleRegions.includes(id) && rank > 0)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const radar = health.domains.map((d) => ({
    key: t(`body.radarShort.${d.id}`),
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

  const onSelect = (id: BodyRegionId) => {
    setSelected(id);
    if (hero || figureOnly) setSheetOpen(true);
  };

  const regionBlock = (
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">{selected ? t(`body.region.${selected}`) : t('body.regionDetail')}</h3>
          {domain && (
            <StatusDot tone={toneFromRank(STATUS[domain.rank])} label={statusLabel(lang, STATUS[domain.rank])} />
          )}
        </div>
        {domain && (
          <>
            <p className="text-[12px] text-stone-500 mt-1">
              {t(`body.domain.${domain.id}`)} · {domain.valueLabel} · {t('body.score', { n: domain.score })}
            </p>
            <p className="text-[11px] text-stone-400 mt-1">{t(`body.hrp.${domain.id}`)}</p>
            <button
              type="button"
              onClick={() => askAura(domain.id)}
              className="mt-2 h-9 px-4 rounded-full bg-[var(--sm-cobalt)] text-white text-[12px] font-semibold"
            >
              {t('body.askAura')}
            </button>
          </>
        )}
      </div>
  );

  const radarBlock = (
    <div className="h-56 rounded-[28px] bg-white/80 p-3">
      <p className="text-[10px] font-semibold text-stone-400 px-2 flex items-center gap-1">
        <Brain className="w-3 h-3" /> {t('body.radar')}
      </p>
      <ResponsiveContainer width="100%" height="90%">
        <RadarChart data={radar} cx="50%" cy="50%" outerRadius="68%">
          <PolarGrid stroke="#e7e5e0" />
          <PolarAngleAxis dataKey="key" tick={{ fill: '#4b4a46', fontSize: 11, fontWeight: 600 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar dataKey="score" stroke="#2b3bff" fill="#c4b5fd" fillOpacity={0.35} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );

  const wearableBlock = (
    <div className="rounded-[28px] bg-white/80 p-3">
      <p className="text-[10px] font-semibold text-stone-400 mb-2">{t('body.liveVitals')}</p>
      <div className="grid grid-cols-2 gap-2">
        {[
          [t('wear.hr'), `${w.hr}`, 'bpm'],
          [t('wear.hrv'), `${w.hrv}`, 'ms'],
          [t('wear.resp'), `${w.respRate}`, '/min'],
          ['SpO₂', `${w.spo2}`, '%'],
          [t('wear.bp'), `${w.bpSys}/${w.bpDia}`, ''],
          [t('wear.core'), `${w.coreTempC}`, '°C'],
          [t('wear.skin'), `${w.skinTempC}`, '°C'],
          [t('wear.dose'), `${w.doseMsv}`, 'mSv'],
        ].map(([k, v, u]) => (
          <div key={String(k)} className="rounded-full bg-white px-3 py-2 flex items-center justify-between gap-2 min-w-0">
            <span className="text-[10px] text-stone-500 truncate">{k}</span>
            <span className="text-[12px] font-semibold tabular-nums font-sans shrink-0">
              {v}
              {u ? <span className="ml-0.5 text-[10px] font-medium text-stone-400">{u}</span> : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const trendsBlock = (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-bold">{t('body.trends')}</h3>
        <Segmented
          value={range}
          onChange={setRange}
          options={(['24h', '7d', 'mission'] as TrendRange[]).map((r) => ({ id: r, label: t(`body.range.${r}`) }))}
          ariaLabel={t('body.trends')}
        />
      </div>
      <p className="text-[10px] text-stone-400">
        {t('body.forecastHint')} · {t('body.prediction')}
      </p>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#eeeae4" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill: '#6b6a66', fontSize: 9 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#6b6a66', fontSize: 9 }} width={32} />
            <Tooltip contentStyle={{ borderRadius: 16, fontSize: 11, border: 'none' }} />
            <Area dataKey="hrHi" stroke="none" fill="#f08a80" fillOpacity={0.12} />
            <Line type="monotone" dataKey="hr" stroke="#f08a80" dot={false} strokeWidth={1.6} name={t('wear.hr')} />
            <Line type="monotone" dataKey="spo2" stroke="#7ddfc3" dot={false} strokeWidth={1.2} name="SpO₂" />
            <Line
              type="monotone"
              dataKey="doseMsv"
              stroke="#c4b5fd"
              dot={false}
              strokeWidth={1.2}
              strokeDasharray="4 3"
              name={t('wear.dose')}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid sm:grid-cols-3 gap-2 text-[10px] font-mono text-stone-500">
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
  );

  const logsBlock = (
    <div className="grid lg:grid-cols-2 gap-3">
      <div>
        <h3 className="text-xs font-bold flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" /> {t('body.activityLog')}
        </h3>
        <ol className="mt-2 space-y-1 max-h-48 overflow-y-auto">
          {schedule.map((b) => (
            <li
              key={`${b.startHour}-${b.activityKey}`}
              className={`flex items-center gap-2 text-[11px] rounded-full px-3 py-1.5 ${b.current ? 'bg-white shadow-[var(--sm-shadow-soft)]' : ''}`}
            >
              <span className="font-mono text-stone-400 w-24 shrink-0">
                {fmtHour(b.startHour)}–{fmtHour(b.endHour)}
              </span>
              <span className={b.done ? 'text-stone-400 line-through' : ''}>{t(b.activityKey)}</span>
              <span className="ml-auto text-[10px] text-stone-400">
                {b.current ? t('body.now') : b.done ? t('body.done') : t('body.upcoming')}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <h3 className="text-xs font-bold flex items-center gap-1.5">
          <Dumbbell className="w-3.5 h-3.5" /> {t('body.exerciseLog')}
        </h3>
        <ul className="mt-2 space-y-1.5">
          {exLog.map((b) => (
            <li key={b.device} className="flex items-center gap-2 text-[11px] rounded-full bg-white/80 px-3 py-1.5">
              <span className="font-semibold">{t(`body.ex.${b.device}`)}</span>
              <span className="font-mono text-stone-400">
                {fmtHour(b.startHour)}–{fmtHour(b.endHour)}
              </span>
              <span className="ml-auto text-[10px] text-stone-400">
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
              className="text-[10px] px-2.5 py-1 rounded-full bg-white text-stone-600"
            >
              {t('body.askAura')} · {t(`body.domain.${d.id}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const figureBlock = (
    <div className={compact ? 'flex flex-col' : hero ? 'flex flex-col' : ''}>
      {!(compact && figureOnly) && (
        <div className="flex justify-center mb-2 shrink-0">
          <Segmented
            value={side}
            onChange={setSide}
            options={[
              { id: 'front' as const, label: t('body.front') },
              { id: 'back' as const, label: t('body.back') },
            ]}
            ariaLabel={t('body.title')}
          />
        </div>
      )}
      <AnatomicalFigure
        side={side}
        regionRank={health.regionRank}
        selected={selected}
        onSelect={onSelect}
        pulse={pulseRegion}
        auraRank={health.domains.find((d) => d.id === 'radiation')?.rank ?? 0}
        labelFor={(id) => t(`body.region.${id}`)}
        hero={hero && !compact}
        compact={compact}
      />
      {!figureOnly && (
        <p className="text-[10px] text-stone-400 mt-2 leading-relaxed text-center">{t('body.credit')}</p>
      )}
    </div>
  );

  const inspectorTabs = (
    <div className="space-y-4">
      <div className="overflow-x-auto -mx-1 px-1">
        <Segmented
          value={inspTab}
          onChange={setInspTab}
          options={[
            { id: 'overview' as const, label: t('body.tabOverview') },
            { id: 'body' as const, label: t('body.tabBody') },
            { id: 'radar' as const, label: t('body.tabRadar') },
          ]}
          ariaLabel={t('body.title')}
        />
      </div>
      {inspTab === 'overview' && (
        <div className="space-y-4">
          {regionBlock}
          {radarBlock}
          {wearableBlock}
        </div>
      )}
      {inspTab === 'body' && figureBlock}
      {inspTab === 'radar' && (
        <div className="space-y-4">
          {radarBlock}
          {trendsBlock}
          {logsBlock}
        </div>
      )}
    </div>
  );

  return (
    <section className={compact || hero ? 'flex flex-col' : ''}>
      {!figureOnly && !hero && !tabbed && (
        <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl">{t('body.title')}</h2>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {crew.name} · {t(crew.occupationKey)} · {ship ? t(ship.nameKey) : ''} · {t('body.subtitle')}
            </p>
          </div>
          <StatusPill tone={toneFromRank(STATUS[health.overallRank])}>{statusLabel(lang, STATUS[health.overallRank])}</StatusPill>
        </header>
      )}

      {tabbed ? inspectorTabs : <div className="grid grid-cols-1 gap-2">{figureBlock}</div>}

      <Sheet
        open={sheetOpen && (hero || figureOnly || compact)}
        onClose={() => setSheetOpen(false)}
        title={
          <div>
            <p className="font-display text-2xl">{crew.name}</p>
            <p className="text-[12px] text-stone-500">{t(crew.occupationKey)}</p>
          </div>
        }
        wide
      >
        {inspectorTabs}
      </Sheet>
    </section>
  );
};
