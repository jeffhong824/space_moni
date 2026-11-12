import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SimBadge } from '../components/SimBadge';
import { LanguageGlobe, Sheet, SimChip } from '../ui/chrome';
import { StatusPill, toneFromStatus } from '../ui/StatusPill';
import { useI18n } from '../i18n/I18nProvider';
import { statusLabel } from '../i18n/index';
import { sScaleElevated, type SpaceEnvironmentPayload } from '../domain/spaceWeather';
import { WearableHud } from '../components/WearableHud';
import type { AuthUser } from '../types';
import { isGuestUser } from '../world/accounts';
import { StreakChip, useDayIso } from '../components/CrewTools';
import { findCrewLive, overallRank, worldStateAt, type WorldState } from '../world/worldState';
import type { SimSelect, SimView } from './FleetScene';
import { simFocusForUser } from './focusStation';
import { hqBoardAt } from './hqBoard';

export const SimWorldPage: React.FC<{
  user?: AuthUser | null;
  embedded?: boolean;
  onSignIn?: () => void;
}> = ({ user = null, embedded = false, onSignIn }) => {
  const { t, lang } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<{
    destroy: (remove: boolean) => void;
    setWorld: (w: WorldState) => void;
    setTranslator: (fn: (k: string, v?: Record<string, string | number>) => string) => void;
    openInterior: (id: string) => void;
    openHq: () => void;
    closeInterior: () => void;
    viewFleet: () => void;
    focusStation: () => void;
    resize: () => void;
  } | null>(null);
  const [view, setView] = useState<SimView>({ kind: 'map' });
  const [world, setWorld] = useState<WorldState>(() => worldStateAt(Date.now(), null));
  const [wx, setWx] = useState<SpaceEnvironmentPayload | null>(null);
  const [sel, setSel] = useState<SimSelect | null>(() => {
    const start = simFocusForUser(user);
    if (start.crewId) return { kind: 'crew', id: start.crewId };
    if (start.pinId === 'earth-hq') return { kind: 'hq' };
    if (start.pinId) return { kind: 'ship', id: start.pinId };
    return null;
  });
  const [engineOk, setEngineOk] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fleetOverview, setFleetOverview] = useState(() => simFocusForUser(user).mode === 'fleet');
  const guest = isGuestUser(user);
  const dayIso = useDayIso(world.t);
  const focus = simFocusForUser(user);
  const mobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  useEffect(() => {
    let cancelled = false;
    fetch('/api/nasa/space-environment')
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setWx(j);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setWorld(worldStateAt(Date.now(), wx)), 1000);
    return () => window.clearInterval(id);
  }, [wx]);

  useEffect(() => {
    setWorld(worldStateAt(Date.now(), wx));
  }, [wx]);

  useEffect(() => {
    engine.current?.setWorld(world);
  }, [world]);

  useEffect(() => {
    engine.current?.setTranslator(t);
  }, [t, lang]);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      if (!host.current) return;
      setLoading(true);
      try {
        const { bootFleetGame } = await import('./FleetScene');
        if (cancelled || !host.current) return;
        const startFocus = simFocusForUser(user);
        engine.current = bootFleetGame(host.current, {
          world: worldStateAt(Date.now(), wx),
          onSelect: (next) => {
            setSel(next);
            if (next.kind === 'crew' && mobile) setSheetOpen(true);
          },
          mobile,
          t,
          onView: setView,
          focusPinId: startFocus.pinId,
          focusCrewId: startFocus.crewId,
          fleetOverview: startFocus.mode === 'fleet',
        });
        engine.current.resize();
        setEngineOk(true);
      } catch {
        if (!cancelled) setEngineOk(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void boot();
    return () => {
      cancelled = true;
      engine.current?.destroy(true);
      engine.current = null;
    };
  }, []);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(() => engine.current?.resize());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const detail = useMemo(() => {
    if (!sel || sel.kind === 'hq') return null;
    if (sel.kind === 'ship') return world.ships.find((s) => s.def.id === sel.id) ?? null;
    if (sel.kind === 'module') return world.ships.find((s) => s.def.id === sel.shipId) ?? null;
    return findCrewLive(world, sel.id);
  }, [sel, world]);

  const goDash = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const showFleet = () => {
    engine.current?.viewFleet();
    engine.current?.closeInterior();
    setView({ kind: 'map' });
    setFleetOverview(true);
  };

  const roster = (
    <CrewRoster
      world={world}
      wx={wx}
      lang={lang}
      t={t}
      guest={guest}
      mobile={mobile}
      view={view}
      sel={sel}
      detail={detail}
      onSignIn={onSignIn}
      onOpenHq={() => {
        setSel({ kind: 'hq' });
        engine.current?.openHq();
        setView({ kind: 'hq' });
        setSheetOpen(false);
      }}
      onOpenShip={(id) => {
        setSel({ kind: 'ship', id });
        engine.current?.openInterior(id);
        setView({ kind: 'interior', shipId: id });
        setSheetOpen(false);
      }}
      onSelectCrew={(id) => {
        setSel({ kind: 'crew', id });
      }}
      onBackFleet={() => {
        engine.current?.closeInterior();
        setView({ kind: 'map' });
      }}
      onViewFleet={focus.mode === 'station' ? showFleet : undefined}
    />
  );

  return (
    <div className={`${embedded ? 'h-full' : 'h-dvh max-h-dvh'} overflow-hidden flex flex-col bg-stone-100`}>
      {!embedded && (
        <header className="min-h-14 shrink-0 px-4 py-2 flex items-center justify-between gap-3 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl">{t('sim.title')}</h1>
              <SimChip />
              <SimBadge />
            </div>
            <p className="text-[10px] text-stone-400">{t('sim.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            {guest && onSignIn && (
              <button type="button" onClick={onSignIn} className="h-10 px-4 rounded-full bg-[var(--sm-cobalt)] text-white text-xs font-semibold">
                {t('nav.signIn')}
              </button>
            )}
            <LanguageGlobe />
            <button type="button" onClick={goDash} className="h-10 px-4 rounded-full bg-white text-xs font-semibold shadow-[var(--sm-shadow-soft)]">
              {t('sim.backDash')}
            </button>
          </div>
        </header>
      )}

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className="relative flex-1 min-h-0 min-w-0 overflow-hidden bg-stone-950">
          <div className="absolute inset-0" ref={host} />
          <p className="pointer-events-none absolute top-3 left-3 z-10 max-w-[min(100%-2.5rem,28rem)] rounded-full bg-black/60 px-3 py-1 text-[10px] font-medium text-white/90">
            {t('sim.notNasa')}
          </p>
          {!guest && user?.account && (
            <div className="pointer-events-none absolute bottom-4 left-3 z-20">
              <StreakChip account={user.account} dayIso={dayIso} />
            </div>
          )}
          <div className="hidden lg:flex absolute top-3 right-3 z-20 flex-wrap justify-end gap-2">
            {focus.mode === 'station' && !fleetOverview && (
              <button
                type="button"
                onClick={showFleet}
                className="h-9 px-3 rounded-full bg-white/95 text-[11px] font-semibold text-stone-800 shadow-[var(--sm-shadow-soft)]"
              >
                {t('sim.viewFleet')}
              </button>
            )}
          </div>
          {loading && (
            <p className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">{t('sim.loadingEngine')}</p>
          )}
          {!engineOk && (
            <p className="absolute inset-0 flex items-center justify-center text-xs text-amber-200 p-6 text-center">
              {t('sim.engineFail')}
            </p>
          )}
        </div>
        <aside className="hidden lg:flex w-[min(24rem,32vw)] shrink-0 flex-col min-h-0 overflow-y-auto overscroll-contain border-l border-stone-200 bg-white p-4 space-y-3 text-stone-800">
          {guest && <p className="text-[11px] text-stone-500">{t('sim.guestHint')}</p>}
          {roster}
        </aside>
      </div>
      <div data-sim-toolbar className="lg:hidden shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-white border-t border-stone-200">
        {focus.mode === 'station' && (
          <button
            type="button"
            onClick={showFleet}
            className="h-10 px-4 rounded-full bg-stone-100 text-xs font-semibold text-stone-800"
          >
            {t('sim.viewFleet')}
          </button>
        )}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="h-10 px-5 rounded-full bg-[var(--sm-cobalt)] text-white text-xs font-semibold"
        >
          {t('sim.crewSheet')}
        </button>
      </div>
      <div className="lg:hidden shrink-0 h-[4.5rem]" aria-hidden />

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} from="bottom" title={t('sim.crewSheet')}>
        <div className="space-y-3 text-stone-800">
          {guest && <p className="text-[11px] text-stone-500">{t('sim.guestHint')}</p>}
          {roster}
        </div>
      </Sheet>
    </div>
  );
};

function CrewRoster({
  world,
  wx,
  lang,
  t,
  guest,
  mobile,
  view,
  sel,
  detail,
  onSignIn,
  onOpenHq,
  onOpenShip,
  onSelectCrew,
  onBackFleet,
  onViewFleet,
}: {
  world: WorldState;
  wx: SpaceEnvironmentPayload | null;
  lang: string;
  t: (k: string, vars?: Record<string, string | number>) => string;
  guest: boolean;
  mobile: boolean;
  view: SimView;
  sel: SimSelect | null;
  detail: ReturnType<typeof findCrewLive> | WorldState['ships'][number] | null;
  onSignIn?: () => void;
  onOpenHq: () => void;
  onOpenShip: (id: string) => void;
  onSelectCrew: (id: string) => void;
  onBackFleet: () => void;
  onViewFleet?: () => void;
}) {
  return (
    <>
      {onViewFleet && (
        <button
          type="button"
          onClick={onViewFleet}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-stone-300 text-stone-700"
        >
          {t('sim.viewFleet')}
        </button>
      )}
      <p className="text-[11px] text-stone-500">{t('sim.clickHint')}</p>
      {mobile && <p className="text-[11px] text-stone-400">{t('sim.mobileHint')}</p>}
      {view.kind !== 'map' && (
        <button
          type="button"
          onClick={onBackFleet}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-stone-300 text-stone-700"
        >
          {t('sim.backFleet')}
        </button>
      )}
      <ul className="space-y-1">
        <li>
          <button
            type="button"
            onClick={onOpenHq}
            className="w-full text-left text-xs px-2 py-1.5 rounded-lg hover:bg-stone-100"
          >
            {t('sim.hqLabel')} · {t('sim.earthHint')}
          </button>
        </li>
        {world.ships.map((s) => (
          <li key={s.def.id}>
            <button
              type="button"
              onClick={() => onOpenShip(s.def.id)}
              className="w-full text-left text-xs px-2 py-1.5 rounded-lg hover:bg-stone-100"
            >
              {t(s.def.nameKey)} · {t(s.def.kindKey)} · {t('sim.crewCount', { n: s.crew.length })}
            </button>
          </li>
        ))}
      </ul>
      {(view.kind === 'hq' || sel?.kind === 'hq') && (
        <HqPanel world={world} wx={wx} lang={lang} t={t} guest={guest} onOpenShip={onOpenShip} />
      )}
      {detail && 'def' in detail && 'crew' in detail && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold">{t(detail.def.nameKey)}</h2>
            <SimBadge />
          </div>
          <p className="text-[11px] text-stone-500">{t('sim.day', { n: world.missionDay + 1 })}</p>
          {detail.crew.map((c) => {
            const st = ['Normal', 'Attention', 'Critical'][overallRank(c)];
            return (
              <button
                key={c.def.id}
                type="button"
                onClick={() => onSelectCrew(c.def.id)}
                className="w-full text-left rounded-lg border border-stone-200 bg-white px-2 py-1.5"
              >
                <div className="flex justify-between">
                  <span className="text-xs font-semibold">{c.def.name}</span>
                  <StatusPill tone={toneFromStatus(st)}>{statusLabel(lang, st)}</StatusPill>
                </div>
                <p className="text-[10px] text-stone-500">
                  {t(c.activityKey)}
                  {!guest && ` · ♥ ${c.wearable.hr} · RR ${c.wearable.respRate} · SpO₂ ${c.wearable.spo2}`}
                </p>
              </button>
            );
          })}
        </div>
      )}
      {sel?.kind === 'module' && <ModuleCard shipId={sel.shipId} roomId={sel.roomId} world={world} t={t} />}
      {sel?.kind === 'crew' && findCrewLive(world, sel.id) && (
        guest ? (
          <PublicCrewCard
            name={findCrewLive(world, sel.id)!.crew.def.name}
            activity={t(findCrewLive(world, sel.id)!.crew.activityKey)}
            ship={t(findCrewLive(world, sel.id)!.ship.def.nameKey)}
            hint={t('sim.guestHint')}
            signIn={t('nav.signIn')}
            onSignIn={onSignIn}
          />
        ) : (
          <WearableHud live={findCrewLive(world, sel.id)!.crew} ship={findCrewLive(world, sel.id)!.ship} wx={wx} />
        )
      )}
    </>
  );
}

function PublicCrewCard({
  name,
  activity,
  ship,
  hint,
  signIn,
  onSignIn,
}: {
  name: string;
  activity: string;
  ship: string;
  hint: string;
  signIn: string;
  onSignIn?: () => void;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3 space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold">{name}</h2>
        <SimBadge />
      </div>
      <p className="text-[11px] text-stone-500">
        {ship} · {activity}
      </p>
      <p className="text-[11px] text-stone-500">{hint}</p>
      {onSignIn && (
        <button type="button" onClick={onSignIn} className="h-9 px-3 rounded-full bg-[var(--sm-cobalt)] text-white text-xs font-semibold">
          {signIn}
        </button>
      )}
    </div>
  );
}

function HqPanel({
  world,
  wx,
  lang,
  t,
  guest,
  onOpenShip,
}: {
  world: WorldState;
  wx: SpaceEnvironmentPayload | null;
  lang: string;
  t: (k: string, vars?: Record<string, string | number>) => string;
  guest: boolean;
  onOpenShip: (id: string) => void;
}) {
  const board = hqBoardAt(world, wx);
  const goFullHq = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 space-y-3 max-h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold">{t('hq.title')}</h2>
        <SimBadge />
      </div>
      {!guest && (
        <button
          type="button"
          onClick={goFullHq}
          className="w-full text-[11px] font-semibold px-2 py-1.5 rounded-lg border border-sky-300 text-sky-900"
        >
          {t('sim.openFullHq')}
        </button>
      )}
      <p className="text-[10px] text-emerald-700">{t('sim.liveWx')}</p>
      <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
        <span>
          {t('wx.kp')}: {board.weather.kp ?? t('wx.noObs')}
        </span>
        <span>
          {board.weather.gScale} · {board.weather.rScale} · {board.weather.sScale}
        </span>
      </div>
      <ul className="space-y-1 max-h-[min(28rem,calc(100dvh-16rem))] overflow-y-auto overscroll-contain pr-0.5">
        {board.ships.map((row) => {
          const st = row.status === 'Attention' ? 'Attention' : row.status;
          return (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => onOpenShip(row.id)}
                className="w-full text-left rounded-lg border border-stone-200 bg-white px-2 py-1.5 hover:border-sky-400"
              >
                <div className="flex justify-between gap-2">
                  <span className="text-xs font-semibold">{t(row.nameKey)}</span>
                  <StatusPill tone={toneFromStatus(st)}>{statusLabel(lang, st)}</StatusPill>
                </div>
                <p className="text-[10px] text-stone-500">
                  {t('sim.crewCount', { n: row.crewCount })} · {t(row.activityKey)}
                </p>
                <p className="text-[10px] text-stone-400">
                  {t('hq.nextEvent')}: {t(row.nextEventKey)} · {t(row.latency.key, row.latency.vars)}
                </p>
                {row.flagged.length > 0 && !guest && (
                  <p className="text-[10px] text-amber-800">
                    {t('sim.flagged')}: {row.flagged.map((c) => c.name).join(', ')}
                  </p>
                )}
                <ul className="mt-1 space-y-0.5">
                  {row.roster.map((c) => (
                    <li key={c.id} className="text-[10px] font-mono text-stone-500 flex justify-between gap-2">
                      <span className="truncate">{c.name}</span>
                      {!guest && (
                        <span>
                          ♥ {c.hr} · {c.spo2}%
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </button>
            </li>
          );
        })}
      </ul>
      <div>
        <p className="text-[10px] font-semibold text-stone-600">{t('sim.eventsFeed')}</p>
        {board.events.length === 0 ? (
          <p className="text-[10px] text-stone-400">{t('sim.noEvents')}</p>
        ) : (
          <ul className="mt-1 space-y-0.5">
            {board.events.slice(0, 6).map((e) => (
              <li key={e.id} className="text-[10px] text-stone-500">
                {e.source === 'live' ? t('common.official') : t('common.simulation')} · {e.titleKey ? t(e.titleKey) : e.title}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ModuleCard({
  shipId,
  roomId,
  world,
  t,
}: {
  shipId: string;
  roomId: string;
  world: WorldState;
  t: (k: string, vars?: Record<string, string | number>) => string;
}) {
  const ship = world.ships.find((s) => s.def.id === shipId);
  const co2 = ship?.crew.some((c) => c.event === 'event.co2');
  const storm = sScaleElevated(ship?.sScaleUsed);
  return (
    <div className="rounded-xl border border-cyan-200 bg-white p-3 space-y-1">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold">{t(`sim.room.${roomId}`)}</h3>
        <SimBadge />
      </div>
      <p className="text-[11px] text-stone-500">{t(`sim.roomDesc.${roomId}`)}</p>
      {ship && (
        <p className="text-[10px] text-stone-400">
          {t(ship.def.nameKey)} · {t('sim.moduleStatus')}
          {co2 && roomId === 'eclss' ? ' · CO₂' : ''}
          {storm && (roomId === 'shelter' || roomId === 'crew_quarters') ? ' · S' : ''}
        </p>
      )}
    </div>
  );
}
