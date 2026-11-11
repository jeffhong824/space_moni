import React, { useMemo, useState } from 'react';
import { METRIC_IDS } from '../domain/crewSystems';
import { duePrompts, markPromptDone, nextScheduledPrompt, snoozePrompt } from '../domain/dailyPrompts';
import {
  EVA_POST_ITEMS,
  EVA_PRE_ITEMS,
  ILLNESS_ITEMS,
  notifyCmo,
  saveEvaIllness,
  type Severity,
} from '../domain/evaIllness';
import { explainKeys, hrrUrlForMetric } from '../domain/metricExplain';
import {
  OSD575_GLUCOSE,
  SELF_LOG_METRICS,
  addSelfLog,
  loadSelfLog,
  sparkFor,
  type SelfLogMetric,
} from '../domain/selfLog';
import { streakDays, tickStreak, todayProgress } from '../domain/streak';
import { useI18n } from '../i18n/I18nProvider';
import { SourceTag } from './SourceTag';

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-[24px] bg-white/90 p-3.5 shadow-[var(--sm-shadow-soft)] space-y-2">{children}</section>;
}

export function StreakChip({ account, dayIso }: { account: string; dayIso: string }) {
  const { t } = useI18n();
  const progress = todayProgress(account, dayIso);
  const n = streakDays(account, dayIso);
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold shadow-[var(--sm-shadow-soft)]">
      {t('streak.chip', { n, done: progress.done, total: progress.total })}
    </span>
  );
}

export function SelfLogCard({
  account,
  dayIso,
}: {
  account: string;
  dayIso: string;
}) {
  const { t } = useI18n();
  const [, bump] = useState(0);
  const [metric, setMetric] = useState<SelfLogMetric>('glucose');
  const [value, setValue] = useState('');
  const entries = loadSelfLog(account);
  const spark = sparkFor(entries, metric, 7);
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">{t('selfLog.title')}</h2>
        <SourceTag kind="SELF-REPORTED" />
      </div>
      <p className="text-[11px] text-stone-600">{t('selfLog.hint')}</p>
      {metric === 'glucose' && (
        <p className="text-[10px] text-stone-500">
          {t('selfLog.glucoseCite', { min: OSD575_GLUCOSE.min, max: OSD575_GLUCOSE.max })}
        </p>
      )}
      <div className="flex gap-2">
        <select value={metric} onChange={(e) => setMetric(e.target.value as SelfLogMetric)} className="h-9 rounded-lg border px-2 text-[11px]">
          {SELF_LOG_METRICS.map((m) => (
            <option key={m} value={m}>
              {t(`selfLog.metric.${m}`)}
            </option>
          ))}
        </select>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 h-9 rounded-lg border px-2 text-[11px]"
          inputMode="decimal"
        />
        <button
          type="button"
          className="h-9 px-3 rounded-full bg-[var(--sm-cobalt)] text-white text-[11px] font-semibold"
          onClick={() => {
            const n = Number(value);
            const saved = addSelfLog(account, metric, n);
            if (saved) {
              tickStreak(account, dayIso, 'selfLog');
              setValue('');
              bump((x) => x + 1);
            }
          }}
        >
          {t('selfLog.save')}
        </button>
      </div>
      {spark.length > 0 && (
        <p className="text-[10px] font-mono text-stone-500">
          {t('selfLog.spark', { n: spark.length, last: spark[spark.length - 1] })}
        </p>
      )}
    </Card>
  );
}

export function PromptToast({
  account,
  dayIso,
  nowMin,
  onLog,
}: {
  account: string;
  dayIso: string;
  nowMin: number;
  onLog: () => void;
}) {
  const { t } = useI18n();
  const [, bump] = useState(0);
  const [preview, setPreview] = useState(false);
  const due = duePrompts(account, dayIso, nowMin);
  const next = nextScheduledPrompt(nowMin);
  const live = due[0];
  const showing = live ?? (preview ? next : null);

  if (showing) {
    const isPreview = !live;
    return (
      <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-3 py-2 flex flex-wrap items-center gap-2">
        <p className="text-[12px] font-semibold flex-1">{t(showing.labelKey)}</p>
        {isPreview && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-amber-800">{t('common.demo')}</span>
        )}
        <button
          type="button"
          className="h-8 px-3 rounded-full bg-[var(--sm-cobalt)] text-white text-[11px] font-semibold"
          onClick={() => {
            if (isPreview) {
              setPreview(false);
              onLog();
              return;
            }
            markPromptDone(account, dayIso, showing.id, new Date().toISOString());
            tickStreak(account, dayIso, 'prompt');
            onLog();
            bump((n) => n + 1);
          }}
        >
          {t('prompt.logNow')}
        </button>
        <button
          type="button"
          className="h-8 px-3 rounded-full bg-white text-[11px] font-semibold"
          onClick={() => {
            if (isPreview) {
              setPreview(false);
              return;
            }
            snoozePrompt(account, dayIso, showing.id);
            bump((n) => n + 1);
          }}
        >
          {t('prompt.later')}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] bg-white/90 px-3 py-2 flex flex-wrap items-center gap-2 shadow-[var(--sm-shadow-soft)]">
      <p className="text-[12px] text-stone-600 flex-1">{t('prompt.nextCheckIn', { label: t(next.whenKey) })}</p>
      <button
        type="button"
        className="h-8 px-3 rounded-full bg-white text-[11px] font-semibold border border-stone-200"
        onClick={() => setPreview(true)}
      >
        {t('prompt.preview')}
        <span className="ml-1 text-[10px] font-bold uppercase text-stone-400">{t('common.demo')}</span>
      </button>
    </div>
  );
}

export function EvaIllnessCard({ crewId }: { crewId: string }) {
  const { t } = useI18n();
  const [pre, setPre] = useState<Record<string, boolean>>({});
  const [post, setPost] = useState<Record<string, Severity>>({});
  const [illness, setIllness] = useState<Record<string, Severity>>({});
  const log = { at: new Date().toISOString(), crewId, pre, post, illness };
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">{t('eva.title')}</h2>
        <SourceTag kind="SIMULATION" />
      </div>
      <p className="text-[11px] text-stone-600">{t('eva.cite')}</p>
      <p className="text-[11px] font-semibold">{t('eva.pre')}</p>
      {EVA_PRE_ITEMS.map((item) => (
        <label key={item.id} className="flex items-center gap-2 text-[11px]">
          <input
            type="checkbox"
            checked={!!pre[item.id]}
            onChange={(e) => setPre((s) => ({ ...s, [item.id]: e.target.checked }))}
          />
          {t(item.labelKey)}
        </label>
      ))}
      <p className="text-[11px] font-semibold">{t('eva.post')}</p>
      {EVA_POST_ITEMS.map((item) => (
        <label key={item.id} className="flex items-center justify-between gap-2 text-[11px]">
          {t(item.labelKey)}
          <select
            value={post[item.id] ?? 'none'}
            onChange={(e) => setPost((s) => ({ ...s, [item.id]: e.target.value as Severity }))}
            className="h-8 rounded-lg border px-2"
          >
            {(['none', 'mild', 'moderate', 'severe'] as const).map((s) => (
              <option key={s} value={s}>
                {t(`eva.sev.${s}`)}
              </option>
            ))}
          </select>
        </label>
      ))}
      <p className="text-[11px] font-semibold">{t('eva.illness')}</p>
      {ILLNESS_ITEMS.map((item) => (
        <label key={item.id} className="flex items-center justify-between gap-2 text-[11px]">
          {t(item.labelKey)}
          <select
            value={illness[item.id] ?? 'none'}
            onChange={(e) => setIllness((s) => ({ ...s, [item.id]: e.target.value as Severity }))}
            className="h-8 rounded-lg border px-2"
          >
            {(['none', 'mild', 'moderate', 'severe'] as const).map((s) => (
              <option key={s} value={s}>
                {t(`eva.sev.${s}`)}
              </option>
            ))}
          </select>
        </label>
      ))}
      {notifyCmo(log) && <p className="text-[11px] font-semibold text-amber-900">{t('eva.notifyCmo')}</p>}
      <button
        type="button"
        className="h-9 w-full rounded-full bg-stone-100 text-[11px] font-semibold"
        onClick={() => saveEvaIllness(log)}
      >
        {t('eva.save')}
      </button>
    </Card>
  );
}

export function ExplainButton({ metricId }: { metricId: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const keys = explainKeys(metricId);
  const url = hrrUrlForMetric(metricId);
  if (!(METRIC_IDS as readonly string[]).includes(metricId)) return null;
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={t('explain.open')}
        onClick={() => setOpen((v) => !v)}
        className="w-5 h-5 rounded-full border border-stone-300 text-[10px] font-bold text-stone-600"
      >
        i
      </button>
      {open && (
        <div className="absolute z-20 right-0 top-6 w-64 rounded-2xl bg-white p-3 shadow-[var(--sm-shadow)] text-[11px] space-y-1">
          <p>
            <span className="font-semibold">{t('explain.how')}</span> {t(keys.how)}
          </p>
          <p>
            <span className="font-semibold">{t('explain.why')}</span> {t(keys.why)}
          </p>
          <p>
            <span className="font-semibold">{t('explain.when')}</span> {t(keys.when)}
          </p>
          {url && (
            <a className="text-sky-800 underline break-all" href={url} target="_blank" rel="noreferrer">
              {url}
            </a>
          )}
        </div>
      )}
    </span>
  );
}

export function useDayIso(now: number): string {
  return useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(
      new Date(now)
    );
  }, [now]);
}
