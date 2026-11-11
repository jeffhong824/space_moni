import React, { useMemo, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { earthDelayForKind, formatDelay, type EarthDelay } from '../domain/earthDelay';
import type { CmoPassedCheck, CmoRecommendation } from '../domain/cmoSupport';
import type { SpeStage } from '../domain/speAlert';
import { egressModeForKind, egressVerdict, type EgressMode, type EgressScores } from '../domain/egressReady';
import { analogI4Crew, OSDR_I4 } from '../data/osdrInspiration4';
import { personalZ, defaultSigma } from '../domain/baselines';
import { aggregateTeam, scoreCheckin, type MoodCheckin } from '../domain/moodCheckin';
import { flagSans } from '../domain/sansCheck';
import { buildSpeAlert } from '../domain/speAlert';
import { circadianDriftHours, pvtFromSleep, sleepDebtHours, solClockAt } from '../domain/solClock';
import type { SpaceEnvironmentPayload } from '../domain/spaceWeather';
import type { ShipKind } from '../world/catalog';
import { WORLD_EPOCH_MS } from '../world/worldState';
import { deliveredUplink, etaMs, formatEta, pendingUplink, sendCrewUplink } from '../world/comms';
import {
  cmoDecisions,
  latestMood,
  loadMoods,
  marsDelayOverride,
  moodsForShip,
  sansHistory,
  saveMood,
  saveSans,
  setCmoDecision,
  setMarsDelayOverride,
  shelterTicks,
  toggleShelterTick,
} from '../world/crewLogs';
import { useI18n } from '../i18n/I18nProvider';
import { SourceTag } from './SourceTag';

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-[24px] bg-white/90 p-3.5 shadow-[var(--sm-shadow-soft)] space-y-2">{children}</section>;
}

export function DelayBadge({ delay, compact }: { delay: EarthDelay; compact?: boolean }) {
  const { t } = useI18n();
  const title = t(delay.labelKey, delay.labelVars);
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full bg-white/90 font-semibold text-stone-600 shadow-[var(--sm-shadow-soft)] ${
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
      }`}
    >
      {compact ? formatDelay(delay.oneWaySec) : t('hrp.delayBadge', { delay: formatDelay(delay.oneWaySec) })}
      <SourceTag kind={delay.method === 'mars-sim-au' || delay.method === 'mars-override' ? 'ASSUMPTION' : 'SOURCED-STATIC'} />
    </span>
  );
}

export function SolClockChip({ now, compact }: { now: number; compact?: boolean }) {
  const { t } = useI18n();
  const sol = solClockAt(WORLD_EPOCH_MS, now);
  return (
    <span
      title={t('hrp.solCite')}
      className={`inline-flex items-center gap-1 rounded-full bg-white/90 font-mono text-stone-600 ${
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
      }`}
    >
      {compact ? sol.label.replace('Sol ', 'S') : sol.label}
      <SourceTag kind="SOURCED-STATIC" />
    </span>
  );
}

export const EarthIndependentPanel: React.FC<{
  kind: ShipKind;
  shipId: string;
  auFromEarth?: number;
  delay: EarthDelay;
}> = ({ kind, shipId, auFromEarth, delay }) => {
  const { t } = useI18n();
  const [, bump] = useState(0);
  const pending = pendingUplink(shipId, Date.now());
  const [override, setOverride] = useState<string>(marsDelayOverride() != null ? String(marsDelayOverride()) : '');
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold">{t('hrp.eihsoTitle')}</h2>
        <SourceTag kind="SOURCED-STATIC" title="EIHSO-202" />
      </div>
      <p className="text-[11px] text-stone-600 leading-snug">{t('hrp.eihsoCite')}</p>
      <p className="text-[11px] font-mono text-stone-700">{t(delay.labelKey, delay.labelVars)}</p>
      <p className="text-[10px] text-stone-500">{t('hrp.roundTrip', { delay: formatDelay(delay.roundTripSec) })}</p>
      {kind === 'mars-transit' && (
        <label className="flex items-center gap-2 text-[11px]">
          <span>{t('hrp.marsOverride')}</span>
          <input
            type="number"
            min={240}
            max={1320}
            value={override}
            onChange={(e) => setOverride(e.target.value)}
            onBlur={() => {
              const n = Number(override);
              setMarsDelayOverride(Number.isFinite(n) && n > 0 ? n : null);
            }}
            className="w-20 h-8 rounded-lg border border-stone-200 px-2 text-[11px]"
          />
          <span className="text-stone-400">s</span>
        </label>
      )}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-2">
          <p className="font-bold text-emerald-900">{t('hrp.crewAct')}</p>
          <p className="text-emerald-800 mt-0.5">{t('hrp.crewActList')}</p>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-2">
          <p className="font-bold text-amber-900">{t('hrp.groundAct')}</p>
          <p className="text-amber-800 mt-0.5">{t('hrp.groundActList')}</p>
        </div>
      </div>
      {delay.oneWaySec === 0 ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2 space-y-1.5">
          <p className="text-[11px] font-semibold text-emerald-900">{t('hrp.realtimeLink')}</p>
          <button
            type="button"
            onClick={() => {
              sendCrewUplink(shipId, t('hrp.queuedNote'), 0, Date.now());
              bump((n) => n + 1);
            }}
            className="h-9 w-full rounded-full bg-white text-[11px] font-semibold"
          >
            {t('hrp.sendNow')}
          </button>
          {deliveredUplink(shipId, Date.now())
            .slice(-3)
            .reverse()
            .map((m) => (
              <p key={m.id} className="text-[11px] font-mono text-emerald-800">
                {t('hrp.delivered')}
              </p>
            ))}
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              sendCrewUplink(shipId, t('hrp.queuedNote'), delay.oneWaySec, Date.now());
              bump((n) => n + 1);
            }}
            className="h-9 w-full rounded-full bg-stone-100 text-[11px] font-semibold"
          >
            {t('hrp.queueGround')}
          </button>
          {pending.map((m) => (
            <p key={m.id} className="text-[11px] font-mono text-amber-800">
              {t('hrp.eta', { eta: formatEta(etaMs(m, Date.now())) })}
            </p>
          ))}
        </>
      )}
      {auFromEarth != null && <p className="text-[10px] text-stone-400">{t('hrp.auNote', { au: auFromEarth.toFixed(3) })}</p>}
    </Card>
  );
};

function DoseBar({ label, value, limit, unit }: { label: string; value: number; limit: number; unit: string }) {
  const pct = Math.max(0, Math.min(100, (value / limit) * 100));
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] font-semibold">
        <span>{label}</span>
        <span className="font-mono">
          {value.toFixed(1)} / {limit} {unit} ({pct.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
        <div className="h-full bg-[var(--sm-cobalt)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export const SpeAlertCard: React.FC<{
  wx: SpaceEnvironmentPayload | null;
  missionDays: number;
  baselineMsvDay: number;
}> = ({ wx, missionDays, baselineMsvDay }) => {
  const { t } = useI18n();
  const live = buildSpeAlert(wx);
  const [drill, setDrill] = useState<'off' | SpeStage>('off');
  const stage: SpeStage = drill === 'off' ? live.stage : drill;
  const ticks = shelterTicks();
  const [, bump] = useState(0);
  const gcr = live.estimatedGcrMsvDay * missionDays;
  const speExtra = (live.estimatedSpeExtraMsvHour ?? 0) * (stage === 'shelter' ? 6 : stage === 'watch' ? 1 : 0);
  const total = gcr + speExtra;
  const ladder: SpeStage[] = ['quiet', 'watch', 'shelter'];
  const labelFor = (s: SpeStage) => (s === 'shelter' ? t('hrp.speShelter') : s === 'watch' ? t('hrp.speWatch') : t('hrp.speQuiet'));
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold">{t('hrp.speTitle')}</h2>
        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border bg-slate-50">{labelFor(stage)}</span>
      </div>
      <ol className="flex items-center gap-1 text-[10px] font-bold uppercase">
        {ladder.map((s, i) => (
          <li
            key={s}
            className={`flex-1 text-center rounded-full px-1 py-1 border ${
              s === stage ? 'bg-[var(--sm-cobalt)] text-white border-transparent' : 'bg-white text-stone-500'
            }`}
          >
            {i > 0 ? '→ ' : ''}
            {labelFor(s)}
          </li>
        ))}
      </ol>
      <p className="text-[11px] text-stone-600">{live.reasons.join(' · ') || t('hrp.speQuietDetail')}</p>
      <p className="text-[11px] font-mono">
        {t('hrp.spePfu', {
          pfu10: live.pfu10 != null ? live.pfu10.toFixed(2) : t('common.none'),
          pfu100: live.pfu100 != null ? live.pfu100.toFixed(2) : t('common.none'),
        })}
      </p>
      <label className="flex items-center gap-2 text-[11px] font-semibold">
        <input
          type="checkbox"
          checked={drill !== 'off'}
          onChange={(e) => setDrill(e.target.checked ? 'watch' : 'off')}
        />
        {t('hrp.speDrill')}
        <SourceTag kind="SIMULATION" />
      </label>
      {drill !== 'off' && (
        <div className="flex gap-1">
          {(['watch', 'shelter'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setDrill(s)}
              className={`flex-1 h-8 rounded-full text-[10px] font-bold ${drill === s ? 'bg-amber-200' : 'bg-stone-100'}`}
            >
              {labelFor(s)}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        <SourceTag kind="LIVE" title="NOAA GOES / DONKI SEP" />
        <SourceTag kind="SOURCED-STATIC" title={t('hrp.artemisCite')} />
        <SourceTag kind="ASSUMPTION" title={live.speExtraAssumption} />
        <SourceTag kind="SIMULATION" title={t('hrp.careerSim')} />
      </div>
      <DoseBar label={t('hrp.careerBar')} value={total} limit={live.careerLimitMsv} unit="mSv" />
      <DoseBar label={t('hrp.speBar')} value={speExtra} limit={live.spe30DayLimitMsv} unit="mSv" />
      <p className="text-[11px] font-mono">
        {t('hrp.doseLine', {
          gcr: gcr.toFixed(1),
          spe: speExtra.toFixed(2),
          total: total.toFixed(1),
          career: live.careerLimitMsv,
          spe30: live.spe30DayLimitMsv,
          pctC: ((total / live.careerLimitMsv) * 100).toFixed(1),
          pctS: ((speExtra / live.spe30DayLimitMsv) * 100).toFixed(1),
        })}
      </p>
      <p className="text-[10px] text-stone-500 leading-snug">{t('hrp.artemisCite')}</p>
      {(stage === 'watch' || stage === 'shelter') && (
        <ul className="space-y-1">
          {live.shelterChecklist.map((item) => (
            <li key={item.id}>
              <label className="flex items-start gap-2 text-[11px]">
                <input
                  type="checkbox"
                  checked={!!ticks[item.id]}
                  onChange={() => {
                    toggleShelterTick(item.id);
                    bump((n) => n + 1);
                  }}
                />
                <span>{t(`hrp.shelter.${item.id}`)}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[10px] text-stone-400">{t('hrp.baselineNote', { n: baselineMsvDay })}</p>
    </Card>
  );
};

export const MoodCheckinCard: React.FC<{ crewId: string; shipCrewIds: string[] }> = ({ crewId, shipCrewIds }) => {
  const { t } = useI18n();
  const [, bump] = useState(0);
  const last = latestMood(crewId);
  const [form, setForm] = useState({ mood: 3, stress: 2, sleepQuality: 3, cohesion: 4, conflict: 2 });
  const team = aggregateTeam(moodsForShip(shipCrewIds));
  const set = (k: keyof typeof form, v: number) => setForm((f) => ({ ...f, [k]: v as 1 | 2 | 3 | 4 | 5 }));
  const Likert = ({ k, label }: { k: keyof typeof form; label: string }) => (
    <label className="flex items-center justify-between gap-2 text-[11px]">
      <span>{label}</span>
      <input
        type="range"
        min={1}
        max={5}
        value={form[k]}
        onChange={(e) => set(k, Number(e.target.value))}
        className="flex-1"
      />
      <span className="w-4 font-mono">{form[k]}</span>
    </label>
  );
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">{t('hrp.moodTitle')}</h2>
        <SourceTag kind="SIMULATION" title="BH-201 / Team-201" />
      </div>
      <p className="text-[11px] text-stone-600">{t('hrp.moodCite')}</p>
      <Likert k="mood" label={t('hrp.mood')} />
      <Likert k="stress" label={t('hrp.stress')} />
      <Likert k="sleepQuality" label={t('hrp.sleepQ')} />
      <Likert k="cohesion" label={t('hrp.cohesion')} />
      <Likert k="conflict" label={t('hrp.conflict')} />
      <button
        type="button"
        className="h-9 w-full rounded-full bg-[var(--sm-cobalt)] text-white text-[11px] font-semibold"
        onClick={() => {
          const entry: MoodCheckin = {
            at: new Date().toISOString(),
            crewId,
            mood: form.mood as 1 | 2 | 3 | 4 | 5,
            stress: form.stress as 1 | 2 | 3 | 4 | 5,
            sleepQuality: form.sleepQuality as 1 | 2 | 3 | 4 | 5,
            cohesion: form.cohesion as 1 | 2 | 3 | 4 | 5,
            conflict: form.conflict as 1 | 2 | 3 | 4 | 5,
          };
          saveMood(entry);
          bump((n) => n + 1);
        }}
      >
        {t('hrp.moodSubmit')}
      </button>
      {last && <p className="text-[10px] text-stone-500">{t('hrp.moodLast', { flag: t(`hrp.flag.${scoreCheckin(last).flag}`) })}</p>}
      {team && (
        <p className="text-[11px] text-stone-700">
          {t('hrp.teamAgg', {
            n: team.n,
            mood: team.meanMood.toFixed(1),
            stress: team.meanStress.toFixed(1),
            flag: t(`hrp.flag.${team.flag}`),
          })}
        </p>
      )}
      <p className="sr-only">{loadMoods().length}</p>
    </Card>
  );
};

export const SansCheckCard: React.FC<{ crewId: string }> = ({ crewId }) => {
  const { t } = useI18n();
  const hist = sansHistory(crewId);
  const prior = hist[hist.length - 1];
  const [amsler, setAmsler] = useState<0 | 1 | 2 | 3>(0);
  const [od, setOd] = useState('0.0');
  const [os, setOs] = useState('0.0');
  const [, bump] = useState(0);
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">{t('hrp.sansTitle')}</h2>
        <SourceTag kind="SIMULATION" title="SANS-101 / SANS-404" />
      </div>
      <p className="text-[11px] text-stone-600">{t('hrp.sansCite')}</p>
      <div
        className="grid grid-cols-5 gap-px bg-stone-300 aspect-square max-w-[180px] mx-auto"
        aria-hidden
      >
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className="bg-white relative">
            {i === 12 && <span className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-stone-800" />}
          </div>
        ))}
      </div>
      <label className="text-[11px] flex items-center gap-2">
        {t('hrp.amsler')}
        <select value={amsler} onChange={(e) => setAmsler(Number(e.target.value) as 0 | 1 | 2 | 3)} className="h-8 rounded-lg border px-2">
          <option value={0}>{t('hrp.amsler0')}</option>
          <option value={1}>{t('hrp.amsler1')}</option>
          <option value={2}>{t('hrp.amsler2')}</option>
          <option value={3}>{t('hrp.amsler3')}</option>
        </select>
      </label>
      <div className="flex gap-2 text-[11px]">
        <label className="flex-1">
          {t('hrp.logMarOd')}
          <input value={od} onChange={(e) => setOd(e.target.value)} className="w-full h-8 rounded-lg border px-2" />
        </label>
        <label className="flex-1">
          {t('hrp.logMarOs')}
          <input value={os} onChange={(e) => setOs(e.target.value)} className="w-full h-8 rounded-lg border px-2" />
        </label>
      </div>
      <button
        type="button"
        className="h-9 w-full rounded-full bg-stone-100 text-[11px] font-semibold"
        onClick={() => {
          saveSans({
            at: new Date().toISOString(),
            crewId,
            amsler,
            logMarOd: Number(od) || 0,
            logMarOs: Number(os) || 0,
          });
          bump((n) => n + 1);
        }}
      >
        {t('hrp.sansSave')}
      </button>
      {prior && (
        <p className="text-[11px] text-stone-600">
          {t('hrp.sansLast', { flag: t(`hrp.flag.${flagSans(prior, hist[hist.length - 2]).flag}`), n: hist.length })}
        </p>
      )}
    </Card>
  );
};

export const OsdrPanel: React.FC<{ crewId: string; simWbc?: number }> = ({ crewId, simWbc }) => {
  const { t } = useI18n();
  const analog = analogI4Crew(crewId);
  const series = OSDR_I4.mean.map((row, i) => ({
    tp: String(row.timepoint),
    mean: Number(row.wbc),
    analog: Number(OSDR_I4.crew[analog][i]?.wbc),
  }));
  const pre = OSDR_I4.crew[analog][2];
  const z = simWbc != null && pre?.wbc != null ? personalZ(simWbc, Number(pre.wbc), defaultSigma(Number(pre.wbc), 0.15)) : null;
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">{t('hrp.osdrTitle')}</h2>
        <SourceTag kind="SOURCED-STATIC" />
      </div>
      <p className="text-[11px] text-stone-600 leading-snug">{t('hrp.osdrCite')}</p>
      <p className="text-[10px] font-mono">
        <a className="text-sky-700 underline" href={OSDR_I4.osdCbc.url} target="_blank" rel="noreferrer">
          {OSDR_I4.osdCbc.id}
        </a>
        {' · '}
        <a className="text-sky-700 underline" href={OSDR_I4.osdSerum.url} target="_blank" rel="noreferrer">
          {OSDR_I4.osdSerum.id}
        </a>
      </p>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series}>
            <XAxis dataKey="tp" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} width={28} />
            <Tooltip />
            <Line type="monotone" dataKey="mean" stroke="#2b3bff" dot={false} name={t('hrp.osdrMean')} />
            <Line type="monotone" dataKey="analog" stroke="#c45c2a" dot={false} name={analog} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {z && (
        <p className="text-[11px]">
          {t('hrp.osdrZ', { analog, z: z.z.toFixed(2), band: t(`hrp.band.${z.band}`) })} <SourceTag kind="SIMULATION" />
        </p>
      )}
    </Card>
  );
};

export const SleepSolCard: React.FC<{ sleepMin: number; now: number }> = ({ sleepMin, now }) => {
  const { t } = useI18n();
  const sol = solClockAt(WORLD_EPOCH_MS, now);
  const debt = sleepDebtHours(sleepMin);
  const pvt = pvtFromSleep(sleepMin);
  const drift = circadianDriftHours(sol.solNumber);
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">{t('hrp.sleepSolTitle')}</h2>
        <SourceTag kind="SIMULATION" />
      </div>
      <p className="font-mono text-[12px]">{sol.label}</p>
      <p className="text-[11px] text-stone-600">{t('hrp.sleepSolCite')}</p>
      <p className="text-[11px]">{t('hrp.sleepDebt', { h: debt.toFixed(1), pvt, drift: drift.toFixed(1) })}</p>
    </Card>
  );
};

export const EgressCard: React.FC<{
  scores: EgressScores;
  mode?: EgressMode;
  kind?: string;
  title?: string;
}> = ({ scores, mode, kind, title }) => {
  const { t } = useI18n();
  const resolved = mode ?? (kind ? egressModeForKind(kind) : 'landing');
  const v = egressVerdict(scores, resolved);
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">{title ?? t(resolved === 'return' ? 'hrp.egressReturnTitle' : 'hrp.egressTitle')}</h2>
        <SourceTag kind="SIMULATION" title="[V2 7042] SM-106" />
      </div>
      <p className="text-[11px] text-stone-600">{t(resolved === 'return' ? 'hrp.egressReturnCite' : 'hrp.egressCite')}</p>
      <p className="text-sm font-bold uppercase">{t(`hrp.go.${v.overall}`)}</p>
      <ul className="text-[11px] space-y-0.5">
        {v.tasks.map((task) => (
          <li key={task.id} className="flex justify-between">
            <span>{t(`hrp.egressTask.${task.id}`)}</span>
            <span className="font-semibold">{t(`hrp.go.${task.verdict}`)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export const CmoRecs: React.FC<{
  recs: CmoRecommendation[];
  passed?: CmoPassedCheck[];
  reviewedAt?: string;
}> = ({ recs, passed = [], reviewedAt }) => {
  const { t } = useI18n();
  const [, bump] = useState(0);
  const decisions = cmoDecisions();
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">{t('hrp.cmoTitle')}</h2>
        <SourceTag kind="SIMULATION" />
      </div>
      <p className="text-[11px] font-semibold text-amber-800">{t('hrp.notDiagnosis')}</p>
      <p className="text-[10px] text-stone-500">{t('hrp.docInABox')}</p>
      {recs.length === 0 && (
        <div className="rounded-xl border border-stone-100 bg-stone-50 p-2">
          <p className="text-[11px] font-semibold">{t('hrp.cmoEmpty', { at: reviewedAt ? reviewedAt.slice(11, 16) : '—' })}</p>
          <ul className="mt-1 space-y-0.5">
            {passed.map((p) => (
              <li key={p.id} className="text-[10px] text-stone-600">
                {t(p.titleKey)} · {p.citeId}
              </li>
            ))}
          </ul>
        </div>
      )}
      <ul className="space-y-2">
        {recs.map((r) => (
          <li key={r.id} className="rounded-xl border border-stone-200 p-2 text-[11px]">
            <div className="flex justify-between gap-2">
            <span className="font-bold">{t(r.titleKey)}</span>
            <span className="font-mono text-stone-500">{t(`hrp.conf.${r.confidence}`)}</span>
          </div>
          <p className="text-stone-700 mt-0.5">{t(r.detailKey, r.detailVars)}</p>
            <p className="text-[10px] font-mono text-indigo-700 mt-1">
              {r.citeId} · {r.citeDoc}
            </p>
            <p className="text-[10px] text-stone-500">{t(r.autonomy === 'crew_autonomous' ? 'hrp.crewAct' : 'hrp.groundAct')}</p>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                className="flex-1 h-8 rounded-full bg-emerald-100 text-emerald-900 font-semibold"
                onClick={() => {
                  setCmoDecision(r.id, 'confirmed');
                  bump((n) => n + 1);
                }}
              >
                {t('hrp.cmoConfirm')}
              </button>
              <button
                type="button"
                className="flex-1 h-8 rounded-full bg-stone-100 font-semibold"
                onClick={() => {
                  setCmoDecision(r.id, 'dismissed');
                  bump((n) => n + 1);
                }}
              >
                {t('hrp.cmoDismiss')}
              </button>
            </div>
            {decisions[r.id] && <p className="text-[10px] mt-1">{t(`hrp.cmoState.${decisions[r.id]}`)}</p>}
          </li>
        ))}
      </ul>
    </Card>
  );
};

export function useEarthDelay(kind: ShipKind, au?: number): EarthDelay {
  return useMemo(() => earthDelayForKind(kind, au, marsDelayOverride()), [kind, au]);
}

export const BaselineStrip: React.FC<{
  hr: number;
  baselineHr: number;
  spo2: number;
  baselineSpo2: number;
}> = ({ hr, baselineHr, spo2, baselineSpo2 }) => {
  const { t } = useI18n();
  const zHr = personalZ(hr, baselineHr, defaultSigma(baselineHr));
  const zSp = personalZ(spo2, baselineSpo2, defaultSigma(baselineSpo2, 0.02));
  if (!zHr || !zSp) return null;
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">{t('hrp.baselineTitle')}</h2>
        <SourceTag kind="SIMULATION" />
      </div>
      <p className="text-[11px] text-stone-600">{t('hrp.baselineCite')}</p>
      <p className="text-[11px] font-mono">
        HR z={zHr.z.toFixed(2)} ({t(`hrp.band.${zHr.band}`)}) · SpO₂ z={zSp.z.toFixed(2)} ({t(`hrp.band.${zSp.band}`)})
      </p>
    </Card>
  );
};
