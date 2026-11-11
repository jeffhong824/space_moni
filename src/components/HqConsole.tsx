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
import { CREW, type CrewDef } from '../world/catalog';
import { AvatarBubble, DelayCaption, Segmented, Sheet, StatusDot, TONE_HEX, toneFromRank } from '../ui/chrome';
import { StatusPill } from '../ui/StatusPill';
import { buildRiskMatrix } from '../domain/crewSystems';
import { RiskMatrix } from './RiskMatrix';

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
  const matrixRows = useMemo(() => buildRiskMatrix(CREW, now, wx, world.ships), [now, wx, world.ships]);

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

  const alerts = world.ships.filter((row) => shipCrewStatus(row) !== 'Normal');

  return (
    <div data-page="hq" className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 pt-3 sm-page-pad sm-orb-gutter">
      <div className="mx-auto max-w-[88rem] flex flex-col gap-3 lg:gap-4">
        <header>
          <p className="text-[11px] font-semibold tracking-wide text-stone-400 uppercase">{t('ui.missionControl')}</p>
          <h1 className="font-display text-3xl sm:text-4xl mt-1">{t('ui.fourShips')}</h1>
          <p className="mt-1.5 text-[12px] text-stone-500 flex flex-wrap items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {t('ui.liveWx', { g, s, r })}
            <span className="font-mono">· {t('common.simulation')}</span>
          </p>
        </header>

        {alerts.length > 0 && (
          <div data-hq-alerts className="rounded-[20px] bg-amber-50 px-3 py-2 text-[12px] text-amber-950">
            <p className="font-semibold">{t('ui.stationAlerts')}</p>
            <p className="mt-0.5">{alerts.map((row) => t(row.def.nameKey)).join(' · ')}</p>
          </div>
        )}

        <RiskMatrix
          rows={matrixRows}
          selectedId={ship.crew[0]?.def.id}
          onSelectCrew={(id) => {
            const next = world.ships.find((s) => s.crew.some((c) => c.def.id === id));
            if (next) setShipId(next.def.id);
          }}
        />

        <div className="grid gap-3 lg:grid-cols-12 lg:items-start lg:gap-4">
          <aside data-hq-fleet className="order-1 lg:order-2 lg:col-span-3 rounded-[24px] bg-white px-3 py-3 shadow-[var(--sm-shadow-soft)]">
            <p className="text-[12px] font-semibold">{t('ui.fleetStatus')}</p>
            <ul className="mt-2 space-y-1.5">
              {world.ships.map((row) => {
                const st = shipCrewStatus(row);
                const active = ship.def.id === row.def.id;
                return (
                  <li key={row.def.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setShipId(row.def.id);
                        setSheetOpen(true);
                      }}
                      className={`w-full text-left rounded-[18px] px-2.5 py-2 ${active ? 'bg-sky-50 ring-1 ring-sky-200' : 'bg-stone-50'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold">{t(row.def.nameKey)}</span>
                        <StatusPill tone={toneFromRank(st)}>{statusLabel(lang, st)}</StatusPill>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {t('sim.crewCount', { n: row.crew.length })} · {locLine(row, t)}
                      </p>
                      <p className="text-[11px] tabular-nums text-stone-400 mt-0.5">
                        {row.radiationMsvDay.toFixed(3)} mSv/d
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <div
            data-hq-orbit
            className="order-2 lg:order-1 lg:col-span-5 relative aspect-square max-h-[14rem] lg:max-h-[20rem] w-full max-w-[14rem] lg:max-w-none mx-auto rounded-[24px] bg-white shadow-[var(--sm-shadow-soft)]"
          >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[26%] aspect-square rounded-full bg-gradient-to-br from-stone-200 to-stone-400 shadow-inner" aria-hidden />
            <div className="absolute left-[62%] top-[40%] w-[13%] aspect-square rounded-full bg-gradient-to-br from-stone-300 to-stone-500" aria-hidden />
            <div className="absolute left-[52%] top-[70%] w-[12%] aspect-square rounded-full bg-gradient-to-br from-orange-300 to-rose-400" aria-hidden />
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
                    className="block w-8 h-8 lg:w-10 lg:h-10 rounded-full shadow-[var(--sm-shadow)]"
                    style={{
                      background: pos.color,
                      boxShadow: active ? `0 0 0 6px ${pos.color}33` : undefined,
                    }}
                  />
                  <span className="mt-1 block px-2 py-0.5 rounded-full bg-white/90 text-[10px] font-medium whitespace-nowrap shadow-[var(--sm-shadow-soft)]">
                    {t(s.def.nameKey)}
                    <span className="ml-1 text-stone-400">{s.crew.length}</span>
                    <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full" style={{ background: TONE_HEX[toneFromRank(st)] }} />
                  </span>
                </button>
              );
            })}
          </div>

          <aside data-hq-station className="order-3 lg:col-span-4 rounded-[24px] bg-white px-3 py-3 shadow-[var(--sm-shadow-soft)]">
            <p className="text-[13px] font-semibold">
              {t(ship.def.nameKey)} · {ship.crew.length} {t('hq.crew').toLowerCase()}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">{locLine(ship, t)}</p>
            <p className="text-[11px] tabular-nums text-stone-500 mt-1">
              {t('hq.radiation')}: {ship.radiationMsvDay.toFixed(3)} mSv/d
              {ship.sScaleUsed ? ` · S ${ship.sScaleUsed}` : ''}
              {' · '}
              O₂ {ship.cabin.oxygenPercent.toFixed(1)}% · CO₂ {ship.cabin.carbonDioxidePercent.toFixed(2)}%
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {ship.crew.map((c) => (
                <button
                  key={c.def.id}
                  type="button"
                  onClick={() => {
                    setInspect(c.def);
                    setSheetOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-stone-50 pr-2.5"
                >
                  <AvatarBubble name={c.def.name} seed={c.def.avatarSeed} id={c.def.id} size={28} />
                  <span className="text-[11px] font-medium">{c.def.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
            <div className="mt-2">
              <Segmented
                value={delivered >= sent && sent > 0 ? 'onBoard' : 'sent'}
                onChange={() => undefined}
                options={[
                  { id: 'sent', label: `${t('ui.sent')} ${sent}` },
                  { id: 'onBoard', label: `${t('ui.onBoard')} ${delivered}` },
                  { id: 'replied', label: `${t('ui.replied')} ${acked}` },
                ]}
              />
            </div>
            <p className="mt-2">
              <DelayCaption sec={ship.commLatencySec} />
            </p>
            <ul className="mt-2 space-y-1.5 max-h-36 overflow-y-auto">
              {messages.length === 0 && <li className="text-[11px] text-stone-400">{t('hq.noMessages')}</li>}
              {messages.slice(0, 3).map((m) => (
                <MessageRow key={m.id} msg={m} now={Date.now()} t={t} />
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <input
                className="flex-1 h-10 rounded-full bg-stone-50 px-4 text-sm"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t('hq.messagePlaceholder')}
              />
              <button
                type="button"
                onClick={send}
                className="h-10 px-3.5 rounded-full bg-[var(--sm-cobalt)] text-white text-xs font-semibold inline-flex items-center gap-1"
              >
                {t('ui.transmit')}
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="mt-2 text-[12px] font-semibold text-[var(--sm-cobalt)]"
            >
              {t('hq.drill')} →
            </button>
          </aside>

          <section data-hq-crew className="order-4 lg:col-span-12 rounded-[24px] bg-white px-3 py-3 shadow-[var(--sm-shadow-soft)]">
            <p className="text-[12px] font-semibold">
              {t(ship.def.nameKey)} · {t('hq.crew')}
            </p>
            <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5">
              {ship.crew.map((c) => (
                <li key={c.def.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setInspect(c.def);
                      setSheetOpen(true);
                    }}
                    className="w-full text-left rounded-[16px] bg-stone-50 px-2.5 py-2 flex items-center gap-2"
                  >
                    <AvatarBubble name={c.def.name} seed={c.def.avatarSeed} id={c.def.id} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold truncate">{c.def.name}</p>
                      <p className="text-[11px] text-stone-500 truncate">
                        {t(c.def.occupationKey)} · {t(c.activityKey)}
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
          </section>
        </div>
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
