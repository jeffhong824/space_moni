import React, { useMemo } from 'react';
import { SimBadge } from './SimBadge';
import { StatusPill, toneFromStatus } from '../ui/StatusPill';
import { useI18n } from '../i18n/I18nProvider';
import { statusLabel } from '../i18n/index';
import { crewSheetFor } from '../sim/crewPose';
import { layoutOf } from '../sim/layouts';
import { wearableSparkline } from '../world/wearable';
import { overallRank, type CrewLive, type ShipLive } from '../world/worldState';
import type { SpaceEnvironmentPayload } from '../domain/spaceWeather';

function Sparkline({ values, color = '#fb7185' }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values) - 2;
  const max = Math.max(...values) + 2;
  const w = 120;
  const h = 28;
  const d = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / Math.max(1, max - min)) * h;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function Portrait({ sheet }: { sheet: string }) {
  return (
    <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-950 border border-slate-600 shrink-0">
      <img
        src={`/sim/crew/${sheet}.png`}
        alt=""
        width={192}
        height={336}
        className="max-w-none"
        style={{ imageRendering: 'pixelated', width: 192, height: 336 }}
      />
    </div>
  );
}

export const WearableHud: React.FC<{
  live: CrewLive;
  ship: ShipLive;
  wx: SpaceEnvironmentPayload | null;
  compact?: boolean;
}> = ({ live, ship, wx, compact = false }) => {
  const { t, lang } = useI18n();
  const w = live.wearable;
  const rank = overallRank(live);
  const st = ['Normal', 'Attention', 'Critical'][rank];
  const layout = layoutOf(ship.def.id);
  const sheet = crewSheetFor(live.def.occupationKey, live.activityKey === 'act.eva', layout.microgravity);
  const spark = useMemo(
    () =>
      wearableSparkline(w.t, {
        crew: live.def,
        ship: ship.def,
        activity: live.activityKey,
        event: live.event,
        cabinMsvDay: ship.radiationMsvDay,
        wx,
      }),
    [w.t, live.def, ship.def, live.activityKey, live.event, ship.radiationMsvDay, wx]
  );

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold truncate">{live.def.name}</span>
        <span className="text-[10px] font-mono text-rose-300 shrink-0">
          ♥ {w.hr} · {w.spo2}%
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-600/50 bg-slate-900 p-3 space-y-2 text-slate-100">
      <div className="flex gap-3">
        <Portrait sheet={sheet} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold truncate">{live.def.name}</h3>
            <SimBadge />
            <StatusPill tone={toneFromStatus(st)}>{statusLabel(lang, st)}</StatusPill>
          </div>
          <p className="text-[10px] text-slate-400">
            {t(live.def.occupationKey)} · {t(live.def.nationKey)}
          </p>
          <p className="text-[10px] text-cyan-200">{t('sim.activity')}: {t(live.activityKey)}</p>
        </div>
      </div>
      <p className="text-[10px] text-amber-200">{t('wear.liveStream')}</p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] text-slate-400">{t('wear.hr')}</p>
          <p className="text-lg font-mono font-bold text-rose-300 flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
            {w.hr}
            <span className="text-[10px] font-normal text-slate-500">bpm</span>
          </p>
        </div>
        <Sparkline values={spark} />
      </div>
      <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-mono">
        <div>
          <dt className="text-slate-500">{t('wear.hrv')}</dt>
          <dd>{w.hrv} ms</dd>
        </div>
        <div>
          <dt className="text-slate-500">{t('wear.resp')}</dt>
          <dd>{w.respRate} /min</dd>
        </div>
        <div>
          <dt className="text-slate-500">{t('wear.spo2')}</dt>
          <dd>{w.spo2}%</dd>
        </div>
        <div>
          <dt className="text-slate-500">{t('wear.bp')}</dt>
          <dd>
            {w.bpSys}/{w.bpDia}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">{t('wear.core')}</dt>
          <dd>{w.coreTempC}°C</dd>
        </div>
        <div>
          <dt className="text-slate-500">{t('wear.skin')}</dt>
          <dd>{w.skinTempC}°C</dd>
        </div>
        <div>
          <dt className="text-slate-500">{t('wear.steps')}</dt>
          <dd>{w.steps}</dd>
        </div>
        <div>
          <dt className="text-slate-500">{t('wear.sleepStage')}</dt>
          <dd>{t(`wear.stage.${w.sleepStage}`)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">{t('wear.dose')}</dt>
          <dd>{w.doseMsv} mSv</dd>
        </div>
        <div>
          <dt className="text-slate-500">{t('wear.doseRate')}</dt>
          <dd>{w.doseRateUSvH} µSv/h</dd>
        </div>
      </dl>
      <p className="text-[10px] text-slate-400">
        {t('wear.device')} · {t('wear.battery')} {w.batteryPct}% · {t('wear.signal')} {w.signalPct}%
      </p>
      {live.event && <p className="text-[10px] text-amber-200">{t(live.event)}</p>}
    </div>
  );
};

export const WearableStrip: React.FC<{ live: CrewLive }> = ({ live }) => {
  const { t } = useI18n();
  const w = live.wearable;
  return (
    <section className="rounded-2xl border border-amber-200 bg-white p-4 space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold text-slate-900">{t('wear.title')}</h2>
        <SimBadge />
      </div>
      <p className="text-[11px] text-amber-800">{t('wear.liveStream')}</p>
      <p className="text-sm font-mono text-slate-800">
        <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse mr-1.5 align-middle" />
        {t('wear.hr')} {w.hr} · {t('wear.hrv')} {w.hrv} · {t('wear.resp')} {w.respRate} · SpO₂ {w.spo2}% · {t('wear.bp')} {w.bpSys}/{w.bpDia}
      </p>
      <p className="text-[11px] font-mono text-slate-500">
        {t('wear.core')} {w.coreTempC}°C · {t('wear.dose')} {w.doseMsv} mSv · {t('wear.steps')} {w.steps} · {t('wear.battery')} {w.batteryPct}%
      </p>
    </section>
  );
};
