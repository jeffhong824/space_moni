import React, { useEffect, useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { statusLabel } from '../i18n/index';
import type { WorldState, ShipLive } from '../world/worldState';
import { overallRank } from '../world/worldState';
import { locationVars, shipCrewStatus } from '../world/shipStatus';
import {
  ackVisible,
  formatEta,
  loadMessages,
  sendHqMessage,
  visibleToCrew,
  type HqMessage,
} from '../world/comms';
import { BodyMapDashboard } from './BodyMapDashboard';
import type { SpaceEnvironmentPayload } from '../domain/spaceWeather';
import type { CrewDef } from '../world/catalog';
import { formatDelay, initials, Segmented, Sheet, StatusDot, TONE_HEX, toneFromRank } from '../ui/chrome';
import { StatusPill } from '../ui/StatusPill';

interface HqConsoleProps {
  world: WorldState;
  now: number;
  wx: SpaceEnvironmentPayload | null;
  onOpenAiCall: (prompt?: string) => void;
}

function locLine(ship: ShipLive, t: (k: string, v?: Record<string, string | number>) => string) {
  const loc = locationVars(ship);
  return t(loc.key, loc.vars);
}

const ORBIT: Record<string, { x: number; y: number; color: string }> = {
  'ship-harmony': { x: 48, y: 22, color: '#5b8cff' },
  'ship-gateway': { x: 28, y: 48, color: '#8ec8ff' },
  'ship-mare': { x: 72, y: 42, color: '#7ddfc3' },
  'ship-ares': { x: 58, y: 78, color: '#f08a80' },
};

export const HqConsole: React.FC<HqConsoleProps> = ({ world, now, wx, onOpenAiCall }) => {
  const { t, lang } = useI18n();
  const [shipId, setShipId] = useState(world.ships[0]?.def.id ?? '');
  const [draft, setDraft] = useState('');
  const [tick, setTick] = useState(0);
  const [inspect, setInspect] = useState<CrewDef | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
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

  const sent = messages.length;
  const delivered = messages.filter((m) => visibleToCrew(m, Date.now())).length;
  const acked = messages.filter((m) => ackVisible(m, Date.now())).length;
  const g = wx?.scales.gScale ?? 'G?';
  const s = wx?.scales.sScale ?? 'S?';
  const r = wx?.scales.rScale ?? 'R?';

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-4 pb-28">
      <p className="text-[11px] font-semibold tracking-wide text-stone-400 uppercase">{t('ui.missionControl')}</p>
      <h1 className="font-display text-4xl sm:text-5xl mt-1">{t('ui.fourShips')}</h1>
      <p className="mt-2 text-sm text-stone-500 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        {t('ui.liveWx', { g, s, r })}
      </p>

      <div className="mt-6 grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-6 items-start">
        <div className="relative w-full aspect-[4/3] max-h-[min(62vh,560px)]">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[18%] aspect-square rounded-full bg-gradient-to-br from-stone-200 to-stone-400 shadow-inner" aria-hidden />
          <div className="absolute left-[62%] top-[40%] w-[9%] aspect-square rounded-full bg-gradient-to-br from-stone-300 to-stone-500" aria-hidden />
          <div className="absolute left-[52%] top-[70%] w-[8%] aspect-square rounded-full bg-gradient-to-br from-orange-300 to-rose-400" aria-hidden />
          <div className="absolute inset-[8%] rounded-full border border-stone-200/70" />
          <div className="absolute inset-[22%] rounded-full border border-stone-200/50" />
          {world.ships.map((s) => {
            const pos = ORBIT[s.def.id] ?? { x: 50, y: 50, color: '#2b3bff' };
            const st = shipCrewStatus(s);
            const active = ship.def.id === s.def.id;
            return (
              <button
                key={s.def.id}
                type="button"
                onClick={() => {
                  setShipId(s.def.id);
                  setSheetOpen(true);
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 text-left"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                aria-label={`${t(s.def.nameKey)} ${s.crew.length}`}
              >
                <span
                  className="block w-9 h-9 rounded-full shadow-[var(--sm-shadow)]"
                  style={{
                    background: pos.color,
                    boxShadow: active ? `0 0 0 6px ${pos.color}33` : undefined,
                  }}
                />
                <span className="mt-1 block px-2.5 py-1 rounded-full bg-white/90 text-[11px] font-medium whitespace-nowrap shadow-[var(--sm-shadow-soft)]">
                  {t(s.def.nameKey)}
                  <span className="ml-1 text-stone-400">{s.crew.length}</span>
                  <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full" style={{ background: TONE_HEX[toneFromRank(st)] }} />
                </span>
              </button>
            );
          })}
        </div>

        <aside className="rounded-[32px] bg-white/90 p-5 shadow-[var(--sm-shadow-soft)]">
          <p className="text-sm font-semibold">
            {t(ship.def.nameKey)} · {ship.crew.length} {t('hq.crew').toLowerCase()}
          </p>
          <div className="flex -space-x-2 mt-3">
            {ship.crew.slice(0, 6).map((c) => (
              <span
                key={c.def.id}
                className="w-9 h-9 rounded-full bg-stone-100 border-2 border-white flex items-center justify-center text-[10px] font-bold"
              >
                {initials(c.def.name, c.def.avatarSeed)}
              </span>
            ))}
          </div>
          <div className="mt-5">
            <Segmented
              value={delivered >= sent && sent > 0 ? 'onBoard' : sent > 0 ? 'sent' : 'sent'}
              onChange={() => undefined}
              options={[
                { id: 'sent', label: `${t('ui.sent')} ${sent}` },
                { id: 'onBoard', label: `${t('ui.onBoard')} ${delivered}` },
                { id: 'replied', label: `${t('ui.replied')} ${acked}` },
              ]}
            />
          </div>
          <p className="mt-5 font-display text-4xl tabular-nums">{formatDelay(ship.commLatencySec, t)}</p>
          <div className="mt-4 flex gap-2">
            <input
              className="flex-1 h-11 rounded-full bg-stone-50 px-4 text-sm"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t('hq.messagePlaceholder')}
            />
            <button
              type="button"
              onClick={send}
              className="h-11 px-4 rounded-full bg-[var(--sm-cobalt)] text-white text-xs font-semibold inline-flex items-center gap-1"
            >
              {t('ui.transmit')}
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="mt-3 text-[12px] font-semibold text-[var(--sm-cobalt)]"
          >
            {t('hq.drill')} →
          </button>
        </aside>
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        wide
        title={
          <div>
            <p className="font-display text-2xl">{t(ship.def.nameKey)}</p>
            <p className="text-[12px] text-stone-500">{locLine(ship, t)}</p>
            <StatusPill tone={toneFromRank(shipCrewStatus(ship))}>{statusLabel(lang, shipCrewStatus(ship))}</StatusPill>
          </div>
        }
      >
        <p className="text-[12px] text-stone-500 mb-3">
          {t('hq.radiation')}: {ship.radiationMsvDay.toFixed(3)} mSv/d
          {ship.sScaleUsed ? ` · S ${ship.sScaleUsed}` : ''}
          {' · '}
          O₂ {ship.cabin.oxygenPercent.toFixed(1)}% · CO₂ {ship.cabin.carbonDioxidePercent.toFixed(2)}%
        </p>
        <ul className="space-y-1.5 mb-4">
          {ship.crew.map((c) => (
            <li key={c.def.id}>
              <button
                type="button"
                onClick={() => setInspect(c.def)}
                className="w-full py-2 px-3 rounded-[22px] bg-stone-50 flex items-center justify-between gap-2 text-left"
              >
                <div>
                  <p className="text-sm font-semibold">{c.def.name}</p>
                  <p className="text-[11px] text-stone-500">
                    {t(c.def.occupationKey)} · {t(c.activityKey)}
                    {c.event ? ` · ${t(c.event)}` : ''}
                  </p>
                </div>
                <StatusDot
                  tone={toneFromRank(['Normal', 'Attention', 'Critical'][overallRank(c)])}
                  label={statusLabel(lang, ['Normal', 'Attention', 'Critical'][overallRank(c)])}
                />
              </button>
            </li>
          ))}
        </ul>
        <h3 className="text-sm font-semibold mb-2">{t('hq.comms')}</h3>
        <ul className="space-y-2 max-h-48 overflow-y-auto mb-3">
          {messages.length === 0 && <li className="text-xs text-stone-400">{t('hq.noMessages')}</li>}
          {messages.map((m) => (
            <MessageRow key={m.id} msg={m} now={Date.now()} t={t} />
          ))}
        </ul>
        {inspect && (
          <BodyMapDashboard crew={inspect} tNow={now} wx={wx} onOpenAiCall={onOpenAiCall} compact />
        )}
      </Sheet>
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
    <li className="rounded-[22px] bg-stone-50 px-3 py-2 text-xs">
      <p>{msg.text}</p>
      {!delivered && (
        <p className="text-[10px] font-mono text-amber-700 mt-1">{t('hq.inTransit', { eta: formatEta(msg.deliverAt - now) })}</p>
      )}
      {delivered && <p className="text-[10px] font-mono text-emerald-700 mt-1">{t('hq.delivered')}</p>}
      {delivered && !acked && <p className="text-[10px] text-stone-400">{t('hq.ackPending')}</p>}
      {acked && msg.ackKey && (
        <p className="text-[11px] mt-1">
          {t('hq.ackFrom')}: {t(msg.ackKey)}
        </p>
      )}
    </li>
  );
}
