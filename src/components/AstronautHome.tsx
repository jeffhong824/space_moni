import React, { useState } from 'react';
import { CheckCircle2, Circle, HeartPulse, Mic, Radio, ShieldAlert, Sun } from 'lucide-react';
import type { AstronautProfile, DailyHealthRecord, StationTask } from '../types';
import {
  interpretRecord,
  type SelfCheckEntry,
  type SelfCheckMood,
  type SelfCheckPain,
} from '../domain/healthThresholds';
import { sScaleElevated } from '../domain/spaceWeather';
import type { SpaceEnvironmentPayload } from '../domain/spaceWeather';
import { StatusPill, toneFromStatus } from '../ui/StatusPill';
import { useI18n } from '../i18n/I18nProvider';
import { localizeKey, statusLabel } from '../i18n/index';
import { CrewCommsInbox } from './CrewCommsInbox';
import { SimBadge } from './SimBadge';

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
}

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
}) => {
  const { t, lang } = useI18n();
  const interp = interpretRecord(todayRecord, selfCheck);
  const sScale = spaceEnvironment?.scales.sScale ?? 'S?';
  const shelter = sScaleElevated(sScale);
  const countermeasures = todayRecord.dailyActivities.filter((a) => a.category === 'Health Countermeasure');
  const assignedTasks = tasks.filter(
    (t) => t.assignedCrew.some((c) => c.name === astronaut.name) && t.status !== 'Completed'
  );

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

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-slate-50/80">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">{t('astro.title')}</h1>
            <SimBadge />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('astro.simNote', { name: astronaut.name, date: todayRecord.date })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onOpenAiCall()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-100 text-sky-900 border border-sky-300"
          >
            <Radio className="w-3.5 h-3.5" />
            {t('astro.callAura')}
          </button>
          <button
            type="button"
            onClick={onOpenConsole}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700"
          >
            {t('astro.console')}
          </button>
        </div>
      </header>

      {shelter && (
        <div className="rounded-2xl border-2 border-rose-400 bg-rose-50 p-4 text-rose-950 flex gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
          <div>
            <p className="text-sm font-bold">{t('astro.shelterTitle', { scale: sScale })}</p>
            <p className="text-xs mt-1 leading-relaxed">
              {t('astro.shelterBody')}
              {speDemo ? t('astro.shelterSpe') : ''}
            </p>
          </div>
        </div>
      )}

      <section className={`rounded-2xl border p-4 ${interp.overall === 'Critical' ? 'bg-rose-50 border-rose-300' : interp.overall === 'Attention' ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-sky-700" />
            <h2 className="text-sm font-bold">{t('astro.overall')}</h2>
          </div>
          <StatusPill tone={toneFromStatus(interp.overall)}>{statusLabel(lang, interp.overall)}</StatusPill>
        </div>
        <p className="text-sm mt-2 leading-relaxed">
          {interp.metrics.find((m) => m.status !== 'Normal')
            ? t('reason.metric', {
                label: t(`metric.${interp.metrics.find((m) => m.status !== 'Normal')!.id}`),
                value: interp.metrics.find((m) => m.status !== 'Normal')!.valueLabel,
                status: statusLabel(lang, interp.metrics.find((m) => m.status !== 'Normal')!.status),
                band: interp.metrics.find((m) => m.status !== 'Normal')!.thresholdBand,
              })
            : t('reason.allNormal')}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <StatusPill tone="info">{t('badge.simTelemetry')}</StatusPill>
          {spaceEnvironment?.observations.kp && (
            <StatusPill tone="neutral">
              Kp {spaceEnvironment.observations.kp.value.toFixed(1)}
            </StatusPill>
          )}
          {spaceEnvironment?.observations.goesXray && (
            <StatusPill tone="neutral">
              GOES {spaceEnvironment.observations.goesXray.goesClass} · {spaceEnvironment.scales.rScale}
            </StatusPill>
          )}
          <StatusPill tone={shelter ? 'crit' : 'neutral'}>{sScale}</StatusPill>
        </div>
        <ul className="mt-3 grid sm:grid-cols-3 gap-2">
          {interp.metrics
            .filter((m) => m.id !== 'selfCheck')
            .slice(0, 6)
            .map((m) => (
              <li key={String(m.id)} className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>{t(`metric.${m.id}`)}</span>
                  <span className="font-semibold">{statusLabel(lang, m.status)}</span>
                </div>
                <p className="font-mono text-sm font-bold tabular-nums mt-0.5">{m.valueLabel}</p>
              </li>
            ))}
        </ul>
        <p className="text-[10px] text-slate-400 mt-2">{t('badge.simNote')}</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold text-slate-900">{t('astro.selfCheck')}</h2>
        <p className="text-[11px] text-slate-500 mt-0.5">{t('astro.selfCheckHint')}</p>
        <form onSubmit={submitSelfCheck} className="mt-3 grid sm:grid-cols-2 gap-3 text-xs">
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-slate-700">{t('astro.sleepQuality')}</span>
            <select
              className="rounded-lg border border-slate-200 px-2 py-1.5 bg-white"
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
            <span className="font-semibold text-slate-700">{t('astro.mood')}</span>
            <select className="rounded-lg border border-slate-200 px-2 py-1.5 bg-white" value={mood} onChange={(e) => setMood(e.target.value as SelfCheckMood)}>
              <option value="normal">{t('astro.moodNormal')}</option>
              <option value="stressed">{t('astro.moodStressed')}</option>
              <option value="fatigued">{t('astro.moodFatigued')}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-slate-700">{t('astro.pain')}</span>
            <select className="rounded-lg border border-slate-200 px-2 py-1.5 bg-white" value={pain} onChange={(e) => setPain(e.target.value as SelfCheckPain)}>
              <option value="none">{t('astro.painNone')}</option>
              <option value="mild">{t('astro.painMild')}</option>
              <option value="moderate">{t('astro.painModerate')}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="font-semibold text-slate-700">{t('astro.symptoms')}</span>
            <input
              className="rounded-lg border border-slate-200 px-2 py-1.5"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder={t('astro.symptomsPlaceholder')}
            />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
              {t('astro.writeAnalysis')}
            </button>
            {selfCheck && <span className="ml-2 text-[11px] text-slate-500">{t('astro.recordedAt', { time: selfCheck.at.slice(11, 16) })}</span>}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold text-slate-900">{t('astro.countermeasures')}</h2>
        <p className="text-[11px] text-slate-500 mt-0.5">{t('astro.counterHint')}</p>
        <ul className="mt-3 space-y-2">
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
            <li className="text-xs text-slate-500">{t('astro.noCounter')}</li>
          )}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onOpenAiCall('請依目前示範門檻新增一項我今天可完成的健康對策任務。')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-sky-200 bg-sky-50 text-sky-900"
          >
            <Mic className="w-3.5 h-3.5" />
            {t('astro.askAddTask')}
          </button>
          <button
            type="button"
            onClick={() => onOpenAiCall(t('astro.logAnomaly'))}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
          >
            {t('astro.logAnomaly')}
          </button>
        </div>
      </section>

      {spaceEnvironment && (
        <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <Sun className="w-3.5 h-3.5" />
          {t('astro.wxLine', {
            g: spaceEnvironment.scales.gScale,
            r: spaceEnvironment.scales.rScale,
            s: spaceEnvironment.scales.sScale,
          })}
          {speDemo ? t('astro.speOn') : ''}
        </p>
      )}

      {astronaut.assignedStation && <CrewCommsInbox shipId={astronaut.assignedStation} />}
    </div>
  );
};

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
        className="w-full flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
      >
        {completed ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Circle className="w-4 h-4 text-slate-400 shrink-0" />}
        <span className={`text-xs font-medium ${completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{title}</span>
        {timeSlot && <span className="ml-auto text-[10px] font-mono text-slate-400">{timeSlot}</span>}
      </button>
    </li>
  );
}
