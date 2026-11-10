import React from 'react';
import { Radio, Satellite } from 'lucide-react';
import { SimBadge } from './SimBadge';
import { StatusPill, toneFromStatus } from '../ui/StatusPill';
import { useI18n } from '../i18n/I18nProvider';
import { statusLabel } from '../i18n/index';
import { formatEta } from '../world/comms';
import { latencyKey, locationVars, shipCrewStatus } from '../world/shipStatus';
import type { CrewLive, ShipLive, WorldState } from '../world/worldState';

interface ShipStatusCardProps {
  world: WorldState;
  ship: ShipLive;
  me?: CrewLive | null;
  showFleetStrip?: boolean;
}

export const ShipStatusCard: React.FC<ShipStatusCardProps> = ({ world, ship, me, showFleetStrip = true }) => {
  const { t, lang } = useI18n();
  const loc = locationVars(ship);
  const fleetStatus = shipCrewStatus(ship);
  const activityKey = me?.activityKey ?? ship.crew[0]?.activityKey;
  const nextKey = me?.nextActivityKey ?? ship.nextEventKey;
  const nextAt = me?.nextActivityAt ?? ship.nextEventAt;
  const eta = formatEta(Math.max(0, nextAt - world.t));
  const delay = latencyKey(ship);
  const others = world.ships.filter((s) => s.def.id !== ship.def.id);

  return (
    <section className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-slate-50 p-4 shadow-2xs space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Satellite className="w-4 h-4 text-sky-700 shrink-0" />
            <h2 className="text-sm font-bold text-slate-900">{t(ship.def.nameKey)}</h2>
            <SimBadge />
            <StatusPill tone={toneFromStatus(fleetStatus)}>{statusLabel(lang, fleetStatus)}</StatusPill>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{t(ship.def.kindKey)}</p>
        </div>
        <p className="text-[11px] font-mono text-slate-500">
          {t('sim.day', { n: world.missionDay })} · {t('shipCard.since')}
        </p>
      </div>

      <p className="text-xs text-slate-700 leading-relaxed">{t(loc.key, loc.vars)}</p>

      <dl className="grid sm:grid-cols-3 gap-2 text-xs">
        <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2">
          <dt className="text-[10px] font-mono uppercase tracking-wide text-slate-400">{t('shipCard.now')}</dt>
          <dd className="font-semibold text-slate-900 mt-0.5">{activityKey ? t(activityKey) : t('common.unknown')}</dd>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2">
          <dt className="text-[10px] font-mono uppercase tracking-wide text-slate-400">{t('hq.nextEvent')}</dt>
          <dd className="font-semibold text-slate-900 mt-0.5">
            {t(nextKey)} · {eta}
          </dd>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2">
          <dt className="text-[10px] font-mono uppercase tracking-wide text-slate-400 flex items-center gap-1">
            <Radio className="w-3 h-3" />
            {t('hq.latency')}
          </dt>
          <dd className="font-semibold text-slate-900 mt-0.5">{t(delay.key, delay.vars)}</dd>
        </div>
      </dl>

      {showFleetStrip && others.length > 0 && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1.5">{t('shipCard.others')}</p>
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {others.map((s) => {
              const st = shipCrewStatus(s);
              const otherDelay = latencyKey(s);
              return (
                <li
                  key={s.def.id}
                  className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 min-w-[10.5rem]"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-800">{t(s.def.nameKey)}</span>
                    <StatusPill tone={toneFromStatus(st)}>{statusLabel(lang, st)}</StatusPill>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{t(s.def.kindKey)}</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{t(otherDelay.key, otherDelay.vars)}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
};
