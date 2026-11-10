import React, { useEffect, useMemo, useState } from 'react';
import { Radio, Satellite, Send } from 'lucide-react';
import { SimBadge } from './SimBadge';
import { StatusPill, toneFromStatus } from '../ui/StatusPill';
import { useI18n } from '../i18n/I18nProvider';
import { statusLabel } from '../i18n/index';
import type { WorldState, ShipLive } from '../world/worldState';
import { overallRankFromVitals } from '../world/worldState';
import { locationVars, shipCrewStatus } from '../world/shipStatus';
import {
  ackVisible,
  formatEta,
  loadMessages,
  sendHqMessage,
  visibleToCrew,
  type HqMessage,
} from '../world/comms';

interface HqConsoleProps {
  world: WorldState;
  now: number;
}

function locLine(ship: ShipLive, t: (k: string, v?: Record<string, string | number>) => string) {
  const loc = locationVars(ship);
  return t(loc.key, loc.vars);
}

export const HqConsole: React.FC<HqConsoleProps> = ({ world, now }) => {
  const { t, lang } = useI18n();
  const [shipId, setShipId] = useState(world.ships[0]?.def.id ?? '');
  const [draft, setDraft] = useState('');
  const [tick, setTick] = useState(0);
  const ship = world.ships.find((s) => s.def.id === shipId) ?? world.ships[0];

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const messages = useMemo(() => loadMessages().filter((m) => m.shipId === ship?.def.id), [ship?.def.id, tick]);

  const send = () => {
    if (!ship || !draft.trim()) return;
    sendHqMessage(ship.def.id, draft.trim(), ship.commLatencySec, Date.now(), ship.crew[0]?.activityKey ?? 'act.comms');
    setDraft('');
    setTick((n) => n + 1);
  };

  if (!ship) return null;

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-slate-50/80">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">{t('hq.title')}</h1>
            <SimBadge />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{t('hq.subtitle')}</p>
          <p className="text-[11px] font-mono text-slate-400 mt-1">{t('sim.day', { n: world.missionDay })} · {world.taipeiIsoDate}</p>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <Satellite className="w-4 h-4 text-sky-700" />
          <h2 className="text-sm font-bold">{t('hq.fleet')}</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {world.ships.map((s) => {
            const st = shipCrewStatus(s);
            return (
              <li key={s.def.id}>
                <button
                  type="button"
                  onClick={() => setShipId(s.def.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 ${ship.def.id === s.def.id ? 'bg-sky-50' : ''}`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold">{t(s.def.nameKey)}</span>
                    <SimBadge />
                    <StatusPill tone={toneFromStatus(st)}>{statusLabel(lang, st)}</StatusPill>
                    <span className="text-[11px] text-slate-500">{t(s.def.kindKey)}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{locLine(s, t)}</p>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {t('hq.nextEvent')}: {t(s.nextEventKey)} · {t('hq.latency')} {Math.round(s.commLatencySec)}s
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <h2 className="text-sm font-bold">{t('hq.drill')} · {t(ship.def.nameKey)}</h2>
          <p className="text-xs text-slate-600">{locLine(ship, t)}</p>
          <p className="text-[11px] text-slate-500">
            {t('hq.radiation')}: {ship.radiationMsvDay.toFixed(3)} mSv/d
            {ship.sScaleUsed ? ` · S ${ship.sScaleUsed}` : ''}
          </p>
          <p className="text-[11px] font-mono text-slate-400">
            O₂ {ship.cabin.oxygenPercent.toFixed(1)}% · CO₂ {ship.cabin.carbonDioxidePercent.toFixed(2)}% · {t('sidebar.temp')} {ship.cabin.cabinTempCelsius}°C
          </p>
          <ul className="divide-y divide-slate-100">
            {ship.crew.map((c) => (
              <li key={c.def.id} className="py-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{c.def.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {t(c.def.occupationKey)} · {t(c.activityKey)}
                    {c.event ? ` · ${t(c.event)}` : ''}
                  </p>
                </div>
                <div className="text-right text-[11px] font-mono">
                  <StatusPill tone={toneFromStatus(['Normal', 'Attention', 'Critical'][overallRankFromVitals(c.vitals)])}>
                    {statusLabel(lang, ['Normal', 'Attention', 'Critical'][overallRankFromVitals(c.vitals)])}
                  </StatusPill>
                  <p className="mt-1">HR {c.vitals.restingHR} · HRV {c.vitals.hrv} · SpO₂ {c.vitals.spo2}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold">{t('hq.comms')}</h2>
            <span className="text-[11px] font-mono text-slate-400">
              {t('hq.latency')} {Math.round(ship.commLatencySec)}s
            </span>
          </div>
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {messages.length === 0 && <li className="text-xs text-slate-400">{t('hq.noMessages')}</li>}
            {messages.map((m) => (
              <MessageRow key={m.id} msg={m} now={Date.now()} t={t} />
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-slate-200 text-xs px-2 py-1.5"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t('hq.messagePlaceholder')}
            />
            <button type="button" onClick={send} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold flex items-center gap-1">
              <Send className="w-3.5 h-3.5" />
              {t('hq.send')}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

function MessageRow({
  msg,
  now,
  t,
}: {
  msg: HqMessage;
  now: number;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const delivered = visibleToCrew(msg, now);
  const acked = ackVisible(msg, now);
  return (
    <li className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs">
      <p className="text-slate-800">{msg.text}</p>
      {!delivered && (
        <p className="text-[10px] font-mono text-amber-700 mt-1">{t('hq.inTransit', { eta: formatEta(msg.deliverAt - now) })}</p>
      )}
      {delivered && <p className="text-[10px] font-mono text-emerald-700 mt-1">{t('hq.delivered')}</p>}
      {delivered && !acked && <p className="text-[10px] text-slate-400">{t('hq.ackPending')}</p>}
      {acked && msg.ackKey && (
        <p className="text-[11px] text-slate-700 mt-1">
          {t('hq.ackFrom')}: {t(msg.ackKey)}
        </p>
      )}
    </li>
  );
}
