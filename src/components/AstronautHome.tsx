import React, { useMemo, useState } from 'react';
import { Activity, Moon, Sun } from 'lucide-react';
import type { AstronautProfile, DailyHealthRecord, StationTask } from '../types';
import {
  interpretRecord,
  type SelfCheckEntry,
  type SelfCheckMood,
  type SelfCheckPain,
} from '../domain/healthThresholds';
import { buildCmoRecommendations } from '../domain/cmoSupport';
import { simulatedEgressScores } from '../domain/egressReady';
import { flagSans } from '../domain/sansCheck';
import { scoreCheckin } from '../domain/moodCheckin';
import { sScaleElevated } from '../domain/spaceWeather';
import type { SpaceEnvironmentPayload } from '../domain/spaceWeather';
import { attachSeries, crewPanelAt, panelAction } from '../domain/crewSystems';
import {
  hrNormalBand,
  minutesInTaipei,
  minutesUntil,
  nextScheduleIndex,
  parseSlotStartMin,
  spo2NormalBand,
  type ScheduleItemModel,
} from '../domain/todayStatus';
import { useI18n } from '../i18n/I18nProvider';
import { localizeKey, statusLabel } from '../i18n/index';
import { AbnormalStrip, SystemsAccordion, displayMetric } from './SystemsPanel';
import { CrewCommsInbox } from './CrewCommsInbox';
import { BodyMapDashboard } from './BodyMapDashboard';
import { CREW } from '../world/catalog';
import type { WorldState } from '../world/worldState';
import { findCrewLive, taipeiClockHms } from '../world/worldState';
import { bodyHealthAt } from '../world/bodyHealth';
import { firstName, greetingKey, Sheet, StatusDot, toneFromRank } from '../ui/chrome';
import { loadMessages, visibleToCrew } from '../world/comms';
import { latestMood, sansHistory } from '../world/crewLogs';
import {
  BaselineStrip,
  CmoRecs,
  EarthIndependentPanel,
  EgressCard,
  MoodCheckinCard,
  SleepSolCard,
  SpeAlertCard,
  useEarthDelay,
} from './HrpPanels';

interface AstronautHomeProps {
  astronaut: AstronautProfile;
  todayRecord: DailyHealthRecord;
  selfCheck?: SelfCheckEntry | null;
  onSaveSelfCheck: (entry: SelfCheckEntry) => void;
  tasks: StationTask[];
  onToggleActivity: (date: string, activityId: string) => void;
  onToggleTaskStatus?: (taskId: string) => void;
  onOpenAiCall: (prompt?: string) => void;
  onOpenConsole: () => void;
  spaceEnvironment: SpaceEnvironmentPayload | null;
  speDemo: boolean;
  world: WorldState;
}

export const AstronautHome: React.FC<AstronautHomeProps> = ({
  astronaut,
  todayRecord,
  selfCheck,
  onSaveSelfCheck,
  onToggleActivity,
  onOpenAiCall,
  onOpenConsole,
  spaceEnvironment,
  speDemo,
  world,
}) => {
  const { t, lang } = useI18n();
  const sScale = spaceEnvironment?.scales.sScale ?? 'S?';
  const shelter = sScaleElevated(sScale);
  const countermeasures = todayRecord.dailyActivities.filter((a) => a.category === 'Health Countermeasure');
  const live = findCrewLive(world, astronaut.id);
  const crew = CREW.find((c) => c.id === astronaut.id);
  const w = live?.crew.wearable;
  const health = useMemo(
    () => (crew ? bodyHealthAt(crew, world.t, spaceEnvironment) : null),
    [crew, world.t, spaceEnvironment]
  );

  const [sleepOpen, setSleepOpen] = useState(false);
  const [bodyOpen, setBodyOpen] = useState(false);
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

  const hr = w?.hr ?? todayRecord.restingHR;
  const spo2 = w?.spo2 ?? todayRecord.spo2;
  const hrSeries = todayRecord.hourlyTimeline.map((p) => p.hr);
  const spo2Series = todayRecord.hourlyTimeline.map((p) => p.spo2);
  const panel = useMemo(() => {
    if (!crew) return null;
    const raw = crewPanelAt(crew, world.t, spaceEnvironment, live?.ship ?? null, selfCheck);
    return attachSeries(raw, crew, world.t, spaceEnvironment, live?.ship ?? null);
  }, [crew, world.t, spaceEnvironment, live?.ship, selfCheck]);
  const overall = panel?.overall ?? 'Normal';
  const action = panel ? panelAction(panel) : 'logSelfCheck';
  const flagged = panel?.flagged ?? [];
  const clock = taipeiClockHms(world.t).slice(0, 5);
  const findings = (health?.domains ?? []).filter((d) => d.rank > 0).sort((a, b) => b.rank - a.rank);
  const kind = live?.ship.def.kind ?? 'leo-station';
  const delay = useEarthDelay(kind, live?.ship.location.auFromEarth);
  const shipId = live?.ship.def.id ?? astronaut.assignedStation ?? 'ship-harmony';
  const shipCrewIds = CREW.filter((c) => c.shipId === shipId).map((c) => c.id);
  const surface = kind === 'lunar-south-pole' || kind === 'lunar-habitat';
  const interp = interpretRecord(todayRecord, selfCheck ?? null);
  const sansHist = sansHistory(astronaut.id);
  const lastMood = latestMood(astronaut.id);
  const recs = buildCmoRecommendations({
    hrStatus: interp.metrics.find((m) => m.id === 'restingHR')?.status,
    spo2Status: interp.metrics.find((m) => m.id === 'spo2')?.status,
    sleepMin: todayRecord.avgSleepMinutes,
    sScale,
    sansFlag: sansHist.length
      ? flagSans(sansHist[sansHist.length - 1], sansHist[sansHist.length - 2]).flag
      : undefined,
    moodFlag: lastMood ? scoreCheckin(lastMood).flag : undefined,
    delaySec: delay.oneWaySec,
  });
  const egressScores = simulatedEgressScores({
    hr,
    baselineHr: crew?.baselineHr ?? 72,
    spo2,
    missionDays: astronaut.missionDaysElapsed,
  });

  const schedule: ScheduleItemModel[] = [
    { id: 'overall', title: t('astro.overall'), startMin: 8 * 60, timeLabel: '08:00' },
    ...countermeasures.slice(0, 4).map((a) => ({
      id: a.id,
      title: localizeKey(lang, a.title),
      startMin: parseSlotStartMin(a.timeSlot) ?? 13 * 60,
      timeLabel: a.timeSlot ?? '',
      activityId: a.id,
    })),
    { id: 'self', title: t('astro.selfCheck'), startMin: 18 * 60, timeLabel: '18:00', self: true },
  ];
  const nowMin = minutesInTaipei(world.t);
  const nextIdx = nextScheduleIndex(schedule, nowMin);
  const nextItem = nextIdx >= 0 ? schedule[nextIdx] : schedule[0];
  const until = nextItem ? minutesUntil(nextItem.startMin, nowMin) : 0;
  const rest = schedule.filter((_, i) => i !== nextIdx);

  const hqMessages = astronaut.assignedStation
    ? loadMessages().filter((m) => m.shipId === astronaut.assignedStation && visibleToCrew(m, Date.now()))
    : [];

  const verdictLine =
    flagged.length === 0
      ? t('today.allInRange')
      : t('today.verdictOff', {
          parts: flagged
            .slice(0, 3)
            .map((v) =>
              v.id === 'ortho' || v.id === 'ecg' || v.id === 'speShelter'
                ? t('today.partStatus', { label: t(v.labelKey), value: displayMetric(v, t) })
                : t('today.part', {
                    label: t(v.labelKey),
                    value: displayMetric(v, t),
                    unit: v.unit,
                    flag: t((v.delta ?? 0) < 0 ? 'today.flagLow' : 'today.flagElevated'),
                  })
            )
            .join(' · '),
          action: panel?.prompts[0] ? t(panel.prompts[0].key) : t('today.restHydrate'),
        });

  const primary = () => {
    if (action === 'askAura') onOpenAiCall(verdictLine);
    else setSleepOpen(true);
  };

  const tone = toneFromRank(overall);
  const heroBg =
    overall === 'Critical' ? 'bg-rose-50' : overall === 'Attention' ? 'bg-amber-50' : 'bg-emerald-50/80';

  return (
    <div data-page="today" className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 pt-2 sm-page-pad sm-orb-gutter">
      <div className="mx-auto max-w-[88rem] flex flex-col gap-3 lg:grid lg:grid-cols-12 lg:items-start lg:gap-4">
        <section data-today-hero className={`order-1 lg:col-span-12 rounded-[24px] ${heroBg} px-4 py-3 shadow-[var(--sm-shadow-soft)]`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-wide text-stone-500 uppercase">
                {t(greetingKey(world.t), { name: firstName(astronaut.name) })}
              </p>
              <p className="mt-1 text-sm sm:text-[15px] font-semibold text-stone-900 leading-snug">{verdictLine}</p>
              <p className="mt-1 text-[11px] font-mono text-stone-500 flex items-center gap-1.5">
                <StatusDot tone={tone} />
                {t('today.updated', { time: clock })} · {t('common.simulation')}
              </p>
            </div>
            <button
              type="button"
              data-today-action
              onClick={primary}
              className="h-9 shrink-0 px-3.5 rounded-full bg-[var(--sm-cobalt)] text-white text-[12px] font-semibold whitespace-nowrap"
            >
              {action === 'askAura' ? t('today.askAura') : t('today.logSelfCheck')}
            </button>
          </div>
        </section>

        {shelter && (
          <div className="order-2 lg:col-span-12 px-4 py-2.5 rounded-[20px] bg-rose-50 text-rose-950">
            <p className="text-sm font-semibold">{t('astro.shelterTitle', { scale: sScale })}</p>
            <p className="text-xs">{t('astro.shelterBody')}{speDemo ? t('astro.shelterSpe') : ''}</p>
          </div>
        )}

        {panel && <AbnormalStrip panel={panel} />}

        <section data-today-schedule className="order-3 lg:col-span-4 rounded-[24px] bg-white px-3 py-3 shadow-[var(--sm-shadow-soft)]">
          {nextItem && (
            <button
              type="button"
              data-today-next
              onClick={() => {
                if (nextItem.self) setSleepOpen(true);
                else if (nextItem.activityId) onToggleActivity(todayRecord.date, nextItem.activityId);
                else onOpenConsole();
              }}
              className="w-full text-left rounded-[18px] bg-sky-50 px-3 py-2.5"
            >
              <p className="text-[11px] font-semibold text-sky-800">
                {t('today.next')} · {until <= 0 ? t('today.now') : t('today.inMin', { n: until })}
              </p>
              <p className="text-sm font-semibold mt-0.5">
                {nextItem.timeLabel} · {nextItem.title}
              </p>
            </button>
          )}
          <ul className="mt-2 space-y-1">
            {rest.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (item.self) setSleepOpen(true);
                    else if (item.activityId) onToggleActivity(todayRecord.date, item.activityId);
                    else onOpenConsole();
                  }}
                  className="w-full flex items-center gap-2 rounded-[14px] px-2 py-1.5 text-left hover:bg-stone-50"
                >
                  {item.self ? <Moon className="w-3.5 h-3.5 text-stone-400" /> : item.id === 'overall' ? <Sun className="w-3.5 h-3.5 text-stone-400" /> : <Activity className="w-3.5 h-3.5 text-stone-400" />}
                  <span className="text-[12px] font-mono text-stone-400">{item.timeLabel}</span>
                  <span className="text-[13px] truncate">{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section data-today-body className="order-4 lg:col-span-4 rounded-[24px] bg-white px-3 py-3 shadow-[var(--sm-shadow-soft)]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[12px] font-semibold">{t('today.attention')}</p>
            <button type="button" onClick={() => setBodyOpen((v) => !v)} className="text-[11px] font-semibold text-[var(--sm-cobalt)]">
              {bodyOpen ? t('body.closeMap') : t('today.expandBody')}
            </button>
          </div>
          <div className="flex gap-3 items-start">
            {crew && (
              <div className="shrink-0 w-[6.5rem] sm:w-[7.5rem]">
                <BodyMapDashboard
                  crew={crew}
                  tNow={world.t}
                  wx={spaceEnvironment}
                  onOpenAiCall={onOpenAiCall}
                  compact
                  figureOnly
                />
              </div>
            )}
            <ul className="min-w-0 flex-1 space-y-1.5">
              {findings.length === 0 && <li className="text-[12px] text-stone-500">{t('today.noFindings')}</li>}
              {findings.slice(0, bodyOpen ? 8 : 3).map((d) => (
                <li key={d.id} className="rounded-[14px] bg-stone-50 px-2.5 py-1.5">
                  <p className="text-[12px] font-semibold leading-tight">{t(`body.domain.${d.id}`)}</p>
                  <p className="text-[11px] text-stone-500">
                    {d.valueLabel} · {statusLabel(lang, ['Normal', 'Attention', 'Critical'][d.rank])}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <TrendCard hr={hrSeries} spo2={spo2Series} currentHr={hr} currentSpo2={spo2} t={t} />

        {panel && (
          <div className="order-6 lg:col-span-12">
            <SystemsAccordion panel={panel} />
          </div>
        )}

        <div className="order-6 lg:col-span-12 grid gap-3 lg:grid-cols-2">
          <EarthIndependentPanel
            kind={kind}
            shipId={shipId}
            auFromEarth={live?.ship.location.auFromEarth}
            delay={delay}
          />
          <SpeAlertCard
            wx={spaceEnvironment}
            missionDays={astronaut.missionDaysElapsed}
            baselineMsvDay={live?.ship.def.baselineMsvDay ?? 0.42}
          />
          <MoodCheckinCard crewId={astronaut.id} shipCrewIds={shipCrewIds} />
          <SleepSolCard sleepMin={todayRecord.avgSleepMinutes} now={world.t} />
          {crew && (
            <BaselineStrip
              hr={hr}
              baselineHr={crew.baselineHr}
              spo2={spo2}
              baselineSpo2={crew.baselineSpo2}
            />
          )}
          <EgressCard scores={egressScores} surface={surface} />
          <CmoRecs recs={recs} />
        </div>

        {hqMessages.length > 0 ? (
          <div data-today-hq className="order-7 lg:col-span-8">
            <p className="text-[12px] font-semibold mb-2">{t('today.hqMessages', { n: hqMessages.length })}</p>
            {astronaut.assignedStation && <CrewCommsInbox shipId={astronaut.assignedStation} />}
          </div>
        ) : null}
      </div>

      <Sheet open={sleepOpen} onClose={() => setSleepOpen(false)} title={<h2 className="font-display text-2xl">{t('astro.selfCheck')}</h2>}>
        <p className="text-[12px] text-stone-500 mb-3">{t('astro.selfCheckHint')}</p>
        <form onSubmit={submitSelfCheck} className="space-y-3 text-sm">
          <label className="flex flex-col gap-1">
            <span>{t('astro.sleepQuality')}</span>
            <select className="h-11 rounded-full bg-stone-50 px-4" value={sleepQuality} onChange={(e) => setSleepQuality(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}>
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
            <input className="h-11 rounded-full bg-stone-50 px-4" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder={t('astro.symptomsPlaceholder')} />
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

function TrendCard({
  hr,
  spo2,
  currentHr,
  currentSpo2,
  t,
}: {
  hr: number[];
  spo2: number[];
  currentHr: number;
  currentSpo2: number;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  return (
    <section data-today-trends className="order-5 lg:col-span-4 rounded-[24px] bg-white px-3 py-3 shadow-[var(--sm-shadow-soft)]">
      <p className="text-[12px] font-semibold mb-2">{t('today.trends')}</p>
      <AxisChart label={t('wear.hr')} unit="bpm" points={hr} current={currentHr} band={hrNormalBand()} color="#f08a80" t={t} />
      <div className="mt-3">
        <AxisChart label={t('wear.spo2')} unit="%" points={spo2} current={currentSpo2} band={spo2NormalBand()} color="#2b3bff" t={t} />
      </div>
    </section>
  );
}

function AxisChart({
  label,
  unit,
  points,
  current,
  band,
  color,
  t,
}: {
  label: string;
  unit: string;
  points: number[];
  current: number;
  band: { lo: number; hi: number };
  color: string;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const w = 320;
  const h = 72;
  const padL = 28;
  const padR = 8;
  const padT = 8;
  const padB = 16;
  const vals = points.length ? points : [current];
  const min = Math.min(...vals, band.lo) - 2;
  const max = Math.max(...vals, band.hi) + 2;
  const span = max - min || 1;
  const xAt = (i: number) => padL + (i / Math.max(1, vals.length - 1)) * (w - padL - padR);
  const yAt = (v: number) => padT + (1 - (v - min) / span) * (h - padT - padB);
  const d = vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(' ');
  const yLo = yAt(band.lo);
  const yHi = yAt(band.hi);
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-0.5">
        <p className="text-[11px] font-semibold text-stone-600">{label}</p>
        <p className="text-[11px] tabular-nums text-stone-500">
          {t('today.current', { n: current })} {unit} · {t('today.min', { n: mn })} · {t('today.max', { n: mx })}
        </p>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[4.5rem] lg:h-28" role="img" aria-label={label}>
        <rect x={padL} y={yHi} width={w - padL - padR} height={Math.max(1, yLo - yHi)} fill={color} opacity="0.12" />
        <text x={2} y={yHi + 4} className="fill-stone-400" fontSize="8">
          {band.hi}
        </text>
        <text x={2} y={yLo} className="fill-stone-400" fontSize="8">
          {band.lo}
        </text>
        <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <text x={padL} y={h - 2} className="fill-stone-400" fontSize="8">
          00
        </text>
        <text x={(w - padR) / 2} y={h - 2} className="fill-stone-400" fontSize="8">
          12
        </text>
        <text x={w - 18} y={h - 2} className="fill-stone-400" fontSize="8">
          24
        </text>
      </svg>
      <p className="sr-only">{t('today.band')}</p>
    </div>
  );
}

