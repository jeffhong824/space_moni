import React, { useState } from 'react';
import { Activity, CheckCircle2, Circle, Heart, Leaf, Moon, Sun } from 'lucide-react';
import type { AstronautProfile, DailyHealthRecord, StationTask } from '../types';
import {
  BAND_NUMBERS,
  interpretRecord,
  THRESHOLDS,
  type SelfCheckEntry,
  type SelfCheckMood,
  type SelfCheckPain,
} from '../domain/healthThresholds';
import { sScaleElevated } from '../domain/spaceWeather';
import type { SpaceEnvironmentPayload } from '../domain/spaceWeather';
import { useI18n } from '../i18n/I18nProvider';
import { localizeKey, statusLabel } from '../i18n/index';
import { CrewCommsInbox } from './CrewCommsInbox';
import { ShipStatusCard } from './ShipStatusCard';
import { WearableStrip } from './WearableHud';
import { BodyMapDashboard } from './BodyMapDashboard';
import { CREW } from '../world/catalog';
import type { WorldState } from '../world/worldState';
import { findCrewLive } from '../world/worldState';
import { FilterChip, firstName, greetingKey, RingGauge, Sheet, StatusDot, toneFromRank } from '../ui/chrome';

interface AstronautHomeProps {
  astronaut: AstronautProfile;
  todayRecord: DailyHealthRecord;
  selfCheck?: SelfCheckEntry | null;
  onSaveSelfCheck: (entry: SelfCheckEntry) => void;
  tasks: StationTask[];
  onToggleActivity: (date: string, activityId: string) => void;
  onToggleTaskStatus: (taskId: string) => void;
  onOpenAiCall: (prompt?: string) => void;
  onOpenConsole: () => void;
  spaceEnvironment: SpaceEnvironmentPayload | null;
  speDemo: boolean;
  world: WorldState;
}

type Filter = 'vitals' | 'sleep' | 'activity' | 'environment';

export const AstronautHome: React.FC<AstronautHomeProps> = ({
  astronaut,
  todayRecord,
  selfCheck,
  onSaveSelfCheck,
  tasks,
  onToggleActivity,
  onToggleTaskStatus,
  onOpenAiCall,
  onOpenConsole,
  spaceEnvironment,
  speDemo,
  world,
}) => {
  const { t, lang } = useI18n();
  const interp = interpretRecord(todayRecord, selfCheck);
  const sScale = spaceEnvironment?.scales.sScale ?? 'S?';
  const shelter = sScaleElevated(sScale);
  const countermeasures = todayRecord.dailyActivities.filter((a) => a.category === 'Health Countermeasure');
  const assignedTasks = tasks.filter(
    (task) => task.assignedCrew.some((c) => c.name === astronaut.name) && task.status !== 'Completed'
  );
  const live = findCrewLive(world, astronaut.id);
  const crew = CREW.find((c) => c.id === astronaut.id);
  const w = live?.crew.wearable;

  const [filter, setFilter] = useState<Filter>('vitals');
  const [sleepOpen, setSleepOpen] = useState(false);
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5>(selfCheck?.sleepQuality ?? 3);
  const [mood, setMood] = useState<SelfCheckMood>(selfCheck?.mood ?? 'normal');
  const [pain, setPain] = useState<SelfCheckPain>(selfCheck?.pain ?? 'none');
  const [symptoms, setSymptoms] = useState(selfCheck?.symptoms ?? '');

  const submitSelfCheck = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSelfCheck({
      sleepQuality,
      mood,
      pain,
      symptoms,
      at: new Date().toISOString(),
    });
  };

  const off = interp.metrics.find((m) => m.status !== 'Normal' && m.id !== 'selfCheck');
  const headline = !off
    ? t('ui.headlineNormal')
    : off.status === 'Critical'
      ? t('ui.headlineCritical', { issue: t(`metric.${off.id}`) })
      : t('ui.headlineCaution', { issue: t(`metric.${off.id}`) });

  const bandKey = (status: string) =>
    status === 'Critical' ? 'band.critical' : status === 'Attention' ? 'band.caution' : 'band.normal';
  const bandVal = (id: string, status: string) => {
    const row = THRESHOLDS[id as keyof typeof THRESHOLDS];
    if (!row) return '';
    if (status === 'Critical') return row.critical;
    if (status === 'Attention') return row.attention;
    return row.normal;
  };

  const hr = w?.hr ?? todayRecord.restingHR;
  const spo2 = w?.spo2 ?? todayRecord.spo2;
  const hrv = w?.hrv ?? todayRecord.hrv;
  const dose = w?.doseMsv ?? 0;

  const timeline = [
    { t: '08:00', title: t('astro.overall'), icon: <Sun className="w-4 h-4" /> },
    ...countermeasures.slice(0, 4).map((a) => ({
      t: a.timeSlot ?? '',
      title: localizeKey(lang, a.title),
      icon: <Activity className="w-4 h-4" />,
      id: a.id,
      done: a.completed,
    })),
    { t: '18:00', title: t('astro.selfCheck'), icon: <Moon className="w-4 h-4" />, self: true },
  ];

  const gauges = (
    <>
      <RingGauge
        value={hr}
        max={120}
        label={t('wear.hr')}
        unit="bpm"
        tone={hr > BAND_NUMBERS.restingHR.attentionHigh ? 'warn' : 'ok'}
        size={120}
      />
      <RingGauge
        value={spo2}
        max={100}
        label={t('wear.spo2')}
        unit="%"
        tone={spo2 < BAND_NUMBERS.spo2.attentionBelow ? 'warn' : 'info'}
        size={120}
      />
      <RingGauge
        value={hrv}
        max={50}
        label={t('wear.hrv')}
        unit="ms"
        tone={hrv < BAND_NUMBERS.hrv.attentionBelow ? 'warn' : 'lilac'}
        size={120}
      />
      <RingGauge value={Number(dose)} max={1} label={t('wear.dose')} unit="mSv" tone="lilac" size={120} />
    </>
  );

  const hrSeries = todayRecord.hourlyTimeline.map((p) => p.hr);
  const spo2Series = todayRecord.hourlyTimeline.map((p) => p.spo2);

  return (
    <div data-page="today" className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden px-4 sm:px-8 pt-2 sm-page-pad lg:pb-3 flex flex-col">
      <div className="flex-1 min-h-0 grid lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,1fr)_minmax(15rem,22rem)] lg:grid-rows-[auto_minmax(0,1fr)] gap-4 lg:gap-6 items-stretch h-full">
        <div className="min-w-0 flex flex-col">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-stone-900">
            {t(greetingKey(world.t), { name: firstName(astronaut.name) })}
          </h1>
          <p className="mt-1.5 text-sm text-stone-500 flex items-center gap-2">
            {headline}
            {off && <StatusDot tone={toneFromRank(off.status)} />}
          </p>
          {off && (
            <p className="sr-only">
              {t('reason.metric', {
                label: t(`metric.${off.id}`),
                value: off.valueLabel,
                status: statusLabel(lang, off.status),
                band: t(bandKey(off.status), { v: bandVal(String(off.id), off.status) }),
              })}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2 pb-1">
            <FilterChip
              active={filter === 'vitals'}
              onClick={() => setFilter('vitals')}
              icon={<Heart className="w-3.5 h-3.5 text-rose-400" />}
              label={t('ui.filterVitals')}
            />
            <FilterChip
              active={filter === 'sleep'}
              onClick={() => setFilter('sleep')}
              icon={<Moon className="w-3.5 h-3.5 text-sky-400" />}
              label={t('ui.filterSleep')}
            />
            <FilterChip
              active={filter === 'activity'}
              onClick={() => setFilter('activity')}
              icon={<Activity className="w-3.5 h-3.5 text-amber-500" />}
              label={t('ui.filterActivity')}
            />
            <FilterChip
              active={filter === 'environment'}
              onClick={() => setFilter('environment')}
              icon={<Leaf className="w-3.5 h-3.5 text-emerald-500" />}
              label={t('ui.filterEnvironment')}
            />
            <button
              type="button"
              onClick={() => setSleepOpen(true)}
              className="h-8 px-3.5 rounded-full bg-[var(--sm-cobalt)] text-white text-[12px] font-semibold"
            >
              {t('ui.logSelfCheck')}
            </button>
          </div>

          {shelter && (
            <div className="mt-4 px-4 py-3 rounded-[28px] bg-rose-50 text-rose-950 flex gap-3">
              <p className="text-sm font-semibold">{t('astro.shelterTitle', { scale: sScale })}</p>
              <p className="text-xs">{t('astro.shelterBody')}{speDemo ? t('astro.shelterSpe') : ''}</p>
            </div>
          )}

          {filter === 'sleep' && (
            <section className="mt-6 space-y-3">
              <p className="text-sm text-stone-600">
                {t('ui.sleepLastNight')}: {Math.floor(todayRecord.avgSleepMinutes / 60)} h {todayRecord.avgSleepMinutes % 60} m
              </p>
              {selfCheck && (
                <p className="text-[12px] text-stone-500">{t('ui.sleepQualityNow', { n: selfCheck.sleepQuality })}</p>
              )}
            </section>
          )}

          {filter === 'activity' && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold mb-2">{t('astro.countermeasures')}</h2>
              <p className="text-[11px] text-stone-400 mb-3">{t('astro.counterHint')}</p>
              <ul className="space-y-2">
                {countermeasures.map((act) => (
                  <CountermeasureRow
                    key={act.id}
                    title={localizeKey(lang, act.title)}
                    timeSlot={act.timeSlot}
                    completed={act.completed}
                    onToggle={() => onToggleActivity(todayRecord.date, act.id)}
                  />
                ))}
                {assignedTasks.map((tsk) => (
                  <CountermeasureRow
                    key={tsk.id}
                    title={localizeKey(lang, tsk.title)}
                    timeSlot={tsk.deadline}
                    completed={tsk.status === 'Completed'}
                    onToggle={() => onToggleTaskStatus(tsk.id)}
                  />
                ))}
                {countermeasures.length === 0 && assignedTasks.length === 0 && (
                  <li className="text-xs text-stone-500">{t('astro.noCounter')}</li>
                )}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onOpenAiCall(t('astro.askAddTask'))}
                  className="h-10 px-4 rounded-full bg-[var(--sm-cobalt)] text-white text-xs font-semibold"
                >
                  {t('astro.askAddTask')}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAiCall(t('astro.logAnomaly'))}
                  className="h-10 px-4 rounded-full bg-white text-xs font-semibold"
                >
                  {t('astro.logAnomaly')}
                </button>
                <button
                  type="button"
                  onClick={onOpenConsole}
                  className="h-10 px-4 rounded-full bg-white text-xs font-semibold"
                >
                  {t('astro.console')}
                </button>
              </div>
            </section>
          )}

          {filter === 'environment' && (
            <section className="mt-6 space-y-3">
              {live && <ShipStatusCard world={world} ship={live.ship} me={live.crew} showFleetStrip />}
              {live && <WearableStrip live={live.crew} />}
              {spaceEnvironment && (
                <p className="text-[12px] text-stone-500">
                  {t('astro.wxLine', {
                    g: spaceEnvironment.scales.gScale,
                    r: spaceEnvironment.scales.rScale,
                    s: spaceEnvironment.scales.sScale,
                  })}
                  {speDemo ? t('astro.speOn') : ''}
                </p>
              )}
            </section>
          )}

        </div>

        <div className="grid grid-cols-2 gap-3 content-start lg:hidden order-2">{gauges}</div>

        <div className="flex justify-center items-stretch order-3 lg:order-none lg:col-start-2 lg:row-start-1 lg:row-span-2 min-h-[22rem] sm:min-h-[28rem] lg:min-h-0 h-full rounded-[32px] bg-white/90 shadow-[var(--sm-shadow-soft)] px-2 py-3">
          {crew && (
            <BodyMapDashboard
              crew={crew}
              tNow={world.t}
              wx={spaceEnvironment}
              onOpenAiCall={onOpenAiCall}
              hero
              figureOnly
            />
          )}
        </div>

        <div className="hidden lg:flex flex-col justify-evenly gap-2 rounded-[32px] bg-white/90 shadow-[var(--sm-shadow-soft)] px-4 py-4 lg:col-start-3 lg:row-start-1 lg:row-span-2 h-full min-h-0">
          {gauges}
        </div>

        <div className="min-w-0 order-4 lg:order-none lg:col-start-1 flex flex-col gap-3 min-h-0 h-full">
          <div className="rounded-[28px] bg-white/90 p-4 shadow-[var(--sm-shadow-soft)] grid sm:grid-cols-2 gap-3 flex-1 min-h-[9rem]">
            <TrendSpark label={t('ui.trendHr')} points={hrSeries} color="#f08a80" />
            <TrendSpark label={t('ui.trendSpo2')} points={spo2Series} color="#2b3bff" />
          </div>
          <div className="sm-snap flex lg:grid lg:grid-cols-2 min-[1400px]:grid-cols-3 gap-3 overflow-x-auto lg:overflow-visible pb-1 shrink-0">
            {timeline.map((item, i) => (
              <button
                key={`${item.t}-${i}`}
                type="button"
                onClick={() => {
                  if ('self' in item && item.self) setSleepOpen(true);
                  else if ('id' in item && item.id) onToggleActivity(todayRecord.date, item.id as string);
                  else onOpenConsole();
                }}
                className="sm-wrap-btn w-[min(100%,14rem)] sm:w-[16rem] lg:w-auto min-h-[7rem] shrink-0 rounded-[28px] bg-white/90 px-4 py-3 text-left shadow-[var(--sm-shadow-soft)] overflow-hidden"
                style={{ whiteSpace: 'normal' }}
              >
                <div className="flex items-center gap-2 text-stone-400">{item.icon}</div>
                <p className="mt-2 text-[11px] font-mono text-stone-400 tabular-nums">{item.t}</p>
                <p
                  className="mt-0.5 w-full text-sm font-medium leading-snug break-normal hyphens-auto"
                  lang={lang}
                  style={{ whiteSpace: 'normal', overflowWrap: 'break-word', wordBreak: 'normal' }}
                >
                  {item.title}
                </p>
              </button>
            ))}
            <button
              type="button"
              onClick={onOpenConsole}
              className="min-w-[3rem] shrink-0 rounded-full bg-white/80 flex lg:hidden items-center justify-center text-stone-400"
              aria-label={t('common.next')}
            >
              →
            </button>
          </div>

          {astronaut.assignedStation && (
            <div className="shrink-0">
              <CrewCommsInbox shipId={astronaut.assignedStation} />
            </div>
          )}
        </div>
      </div>

      <Sheet open={sleepOpen} onClose={() => setSleepOpen(false)} title={<h2 className="font-display text-2xl">{t('astro.selfCheck')}</h2>}>
        <p className="text-[12px] text-stone-500 mb-3">{t('astro.selfCheckHint')}</p>
        <form onSubmit={submitSelfCheck} className="space-y-3 text-sm">
          <label className="flex flex-col gap-1">
            <span>{t('astro.sleepQuality')}</span>
            <select
              className="h-11 rounded-full bg-stone-50 px-4"
              value={sleepQuality}
              onChange={(e) => setSleepQuality(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span>{t('astro.mood')}</span>
            <select className="h-11 rounded-full bg-stone-50 px-4" value={mood} onChange={(e) => setMood(e.target.value as SelfCheckMood)}>
              <option value="normal">{t('astro.moodNormal')}</option>
              <option value="stressed">{t('astro.moodStressed')}</option>
              <option value="fatigued">{t('astro.moodFatigued')}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span>{t('astro.pain')}</span>
            <select className="h-11 rounded-full bg-stone-50 px-4" value={pain} onChange={(e) => setPain(e.target.value as SelfCheckPain)}>
              <option value="none">{t('astro.painNone')}</option>
              <option value="mild">{t('astro.painMild')}</option>
              <option value="moderate">{t('astro.painModerate')}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span>{t('astro.symptoms')}</span>
            <input
              className="h-11 rounded-full bg-stone-50 px-4"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder={t('astro.symptomsPlaceholder')}
            />
          </label>
          <button type="submit" className="h-11 w-full rounded-full bg-[var(--sm-cobalt)] text-white text-sm font-semibold">
            {t('astro.writeAnalysis')}
          </button>
          {selfCheck && <p className="text-[11px] text-stone-400">{t('astro.recordedAt', { time: selfCheck.at.slice(11, 16) })}</p>}
        </form>
      </Sheet>
    </div>
  );
};

function TrendSpark({ label, points, color }: { label: string; points: number[]; color: string }) {
  const w = 240;
  const h = 56;
  const min = Math.min(...points, 0);
  const max = Math.max(...points, 1);
  const span = max - min || 1;
  const d = points
    .map((v, i) => {
      const x = points.length < 2 ? 0 : (i / (points.length - 1)) * w;
      const y = h - 6 - ((v - min) / span) * (h - 12);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <div data-spark={label} className="h-full min-h-0 flex flex-col">
      <p className="text-[11px] font-semibold text-stone-500 mb-1 shrink-0">{label}</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16 lg:h-full lg:min-h-[7rem]" role="img" aria-label={label}>
        <path d={d} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function CountermeasureRow({
  title,
  timeSlot,
  completed,
  onToggle,
}: {
  title: string;
  timeSlot?: string;
  completed: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 rounded-full bg-white/90 px-4 py-2.5 text-left"
      >
        {completed ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Circle className="w-4 h-4 text-stone-300 shrink-0" />}
        <span className={`text-sm ${completed ? 'line-through text-stone-400' : ''}`}>{title}</span>
        {timeSlot && <span className="ml-auto text-[11px] font-mono text-stone-400">{timeSlot}</span>}
      </button>
    </li>
  );
}

