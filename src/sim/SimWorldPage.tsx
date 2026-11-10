import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SimBadge } from '../components/SimBadge';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { StatusPill, toneFromStatus } from '../ui/StatusPill';
import { useI18n } from '../i18n/I18nProvider';
import { statusLabel } from '../i18n/index';
import { sScaleElevated, type SpaceEnvironmentPayload } from '../domain/spaceWeather';
import { findCrewLive, overallRankFromVitals, worldStateAt, type WorldState } from '../world/worldState';
import type { SimSelect, SimView } from './FleetScene';
import { hqBoardAt } from './hqBoard';

export const SimWorldPage: React.FC = () => {
  const { t, lang } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<{
    destroy: (remove: boolean) => void;
    setWorld: (w: WorldState) => void;
    setTranslator: (t: (k: string, v?: Record<string, string | number>) => string) => void;
    openInterior: (id: string) => void;
    openHq: () => void;
    closeInterior: () => void;
  } | null>(null);
  const [view, setView] = useState<SimView>({ kind: 'map' });
  const [world, setWorld] = useState<WorldState>(() => worldStateAt(Date.now(), null));
  const [wx, setWx] = useState<SpaceEnvironmentPayload | null>(null);
  const [sel, setSel] = useState<SimSelect | null>({ kind: 'ship', id: 'ship-harmony' });
  const [engineOk, setEngineOk] = useState(true);
  const [loading, setLoading] = useState(true);
  const mobile = typeof window !== 'undefined' && window.innerWidth < 768;

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
        engine.current = bootFleetGame(host.current, {
          world: worldStateAt(Date.now(), wx),
          onSelect: setSel,
          mobile,
          t,
          onView: setView,
        });
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="min-h-14 px-4 py-2 flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold">{t('sim.title')}</h1>
            <SimBadge />
          </div>
          <p className="text-[10px] text-slate-400">{t('sim.subtitle')}</p>
          <nav className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
            <button
              type="button"
              className="hover:text-cyan-200"
              onClick={() => {
                engine.current?.closeInterior();
                setView({ kind: 'map' });
              }}
            >
              {t('sim.crumbFleet')}
            </button>
            {view.kind === 'hq' && (
              <>
                <span>›</span>
                <span className="text-cyan-200">{t('sim.crumbHq')}</span>
              </>
            )}
            {view.kind === 'interior' && (
              <>
                <span>›</span>
                <span className="text-cyan-200">{t(world.ships.find((s) => s.def.id === view.shipId)?.def.nameKey ?? 'sim.interiorTitle')}</span>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="dark" />
          <button type="button" onClick={goDash} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-600">
            {t('sim.backDash')}
          </button>
        </div>
      </header>

      <div className="flex-1 grid lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,22rem)] min-h-0">
        <div className="relative min-h-[280px] lg:min-h-0" ref={host}>
          {loading && (
            <p className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">{t('sim.loadingEngine')}</p>
          )}
          {!engineOk && (
            <p className="absolute inset-0 flex items-center justify-center text-xs text-amber-200 p-6 text-center">
              {t('sim.engineFail')}
            </p>
          )}
        </div>
        <aside className="border-t lg:border-t-0 lg:border-l border-slate-800 p-4 overflow-y-auto space-y-3 bg-slate-900">
          <p className="text-[11px] text-slate-400">{t('sim.clickHint')}</p>
          {mobile && <p className="text-[11px] text-slate-500">{t('sim.mobileHint')}</p>}
          {view.kind !== 'map' && (
            <button
              type="button"
              onClick={() => {
                engine.current?.closeInterior();
                setView({ kind: 'map' });
              }}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-cyan-700 text-cyan-200"
            >
              {t('sim.backFleet')}
            </button>
          )}
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => {
                  setSel({ kind: 'hq' });
                  engine.current?.openHq();
                  setView({ kind: 'hq' });
                }}
                className="w-full text-left text-xs px-2 py-1.5 rounded-lg hover:bg-slate-800"
              >
                {t('sim.hqLabel')} · {t('sim.earthHint')}
              </button>
            </li>
            {world.ships.map((s) => (
              <li key={s.def.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSel({ kind: 'ship', id: s.def.id });
                    engine.current?.openInterior(s.def.id);
                    setView({ kind: 'interior', shipId: s.def.id });
                  }}
                  className="w-full text-left text-xs px-2 py-1.5 rounded-lg hover:bg-slate-800"
                >
                  {t(s.def.nameKey)} · {t(s.def.kindKey)}
                </button>
              </li>
            ))}
          </ul>
          {(view.kind === 'hq' || sel?.kind === 'hq') && <HqPanel world={world} wx={wx} lang={lang} t={t} onOpenShip={(id) => {
            setSel({ kind: 'ship', id });
            engine.current?.openInterior(id);
            setView({ kind: 'interior', shipId: id });
          }} />}
          {detail && 'def' in detail && 'crew' in detail && (
            <div className="rounded-xl border border-slate-700 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">{t(detail.def.nameKey)}</h2>
                <SimBadge />
              </div>
              <p className="text-[11px] text-slate-400">{t('sim.day', { n: world.missionDay })}</p>
              {detail.crew.map((c) => {
                const st = ['Normal', 'Attention', 'Critical'][overallRankFromVitals(c.vitals)];
                return (
                  <button
                    key={c.def.id}
                    type="button"
                    onClick={() => setSel({ kind: 'crew', id: c.def.id })}
                    className="w-full text-left rounded-lg border border-slate-700 px-2 py-1.5"
                  >
                    <div className="flex justify-between">
                      <span className="text-xs font-semibold">{c.def.name}</span>
                      <StatusPill tone={toneFromStatus(st)}>{statusLabel(lang, st)}</StatusPill>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {t(c.activityKey)} · HR {c.vitals.restingHR} · SpO₂ {c.vitals.spo2}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
          {sel?.kind === 'module' && (
            <ModuleCard shipId={sel.shipId} roomId={sel.roomId} world={world} t={t} />
          )}
          {sel?.kind === 'crew' && findCrewLive(world, sel.id) && (
            <CrewCard live={findCrewLive(world, sel.id)!.crew} lang={lang} t={t} />
          )}
        </aside>
      </div>
    </div>
  );
};

function HqPanel({
  world,
  wx,
  lang,
  t,
  onOpenShip,
}: {
  world: WorldState;
  wx: SpaceEnvironmentPayload | null;
  lang: string;
  t: (k: string, vars?: Record<string, string | number>) => string;
  onOpenShip: (id: string) => void;
}) {
  const board = hqBoardAt(world, wx);
  const goFullHq = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
  return (
    <div className="rounded-xl border border-sky-700/50 bg-slate-800 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold">{t('hq.title')}</h2>
        <SimBadge />
      </div>
      <button
        type="button"
        onClick={goFullHq}
        className="w-full text-[11px] font-semibold px-2 py-1.5 rounded-lg border border-sky-600 text-sky-200"
      >
        {t('sim.openFullHq')}
      </button>
      <p className="text-[10px] text-emerald-300">{t('sim.liveWx')}</p>
      <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
        <span>{t('wx.kp')}: {board.weather.kp ?? t('wx.noObs')}</span>
        <span>
          {board.weather.gScale} · {board.weather.rScale} · {board.weather.sScale}
        </span>
      </div>
      <ul className="space-y-1">
        {board.ships.map((row) => {
          const st = row.status === 'Attention' ? 'Attention' : row.status;
          return (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => onOpenShip(row.id)}
                className="w-full text-left rounded-lg border border-slate-700 px-2 py-1.5 hover:border-cyan-600"
              >
                <div className="flex justify-between gap-2">
                  <span className="text-xs font-semibold">{t(row.nameKey)}</span>
                  <StatusPill tone={toneFromStatus(st)}>{statusLabel(lang, st)}</StatusPill>
                </div>
                <p className="text-[10px] text-slate-400">
                  {t('sim.crewCount', { n: row.crewCount })} · {t(row.activityKey)}
                </p>
                <p className="text-[10px] text-slate-500">
                  {t('hq.nextEvent')}: {t(row.nextEventKey)} · {t(row.latency.key, row.latency.vars)}
                </p>
                {row.flagged.length > 0 && (
                  <p className="text-[10px] text-amber-200">
                    {t('sim.flagged')}: {row.flagged.map((c) => c.name).join(', ')}
                  </p>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <div>
        <p className="text-[10px] font-semibold text-slate-300">{t('sim.eventsFeed')}</p>
        {board.events.length === 0 ? (
          <p className="text-[10px] text-slate-500">{t('sim.noEvents')}</p>
        ) : (
          <ul className="mt-1 space-y-0.5">
            {board.events.slice(0, 6).map((e) => (
              <li key={e.id} className="text-[10px] text-slate-400">
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
    <div className="rounded-xl border border-cyan-700/40 bg-slate-800 p-3 space-y-1">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold">{t(`sim.room.${roomId}`)}</h3>
        <SimBadge />
      </div>
      <p className="text-[11px] text-slate-400">{t(`sim.roomDesc.${roomId}`)}</p>
      {ship && (
        <p className="text-[10px] text-slate-500">
          {t(ship.def.nameKey)} · {t('sim.moduleStatus')}
          {co2 && roomId === 'eclss' ? ' · CO₂' : ''}
          {storm && (roomId === 'shelter' || roomId === 'crew_quarters') ? ' · S' : ''}
        </p>
      )}
    </div>
  );
}

function CrewCard({
  live,
  lang,
  t,
}: {
  live: NonNullable<ReturnType<typeof findCrewLive>>['crew'];
  lang: string;
  t: (k: string) => string;
}) {
  const st = ['Normal', 'Attention', 'Critical'][overallRankFromVitals(live.vitals)];
  return (
    <div className="rounded-xl border border-amber-700/50 bg-slate-800 p-3 space-y-1">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold">{live.def.name}</h3>
        <SimBadge />
      </div>
      <p className="text-[11px] text-slate-400">
        {t(live.def.occupationKey)} · {t('sim.activity')}: {t(live.activityKey)}
      </p>
      <StatusPill tone={toneFromStatus(st)}>{statusLabel(lang, st)}</StatusPill>
      <p className="text-[11px] font-mono">
        HR {live.vitals.restingHR} bpm · HRV {live.vitals.hrv} ms · SpO₂ {live.vitals.spo2}%
      </p>
      <p className="text-[10px] text-amber-200">{t('sim.vitals')}</p>
    </div>
  );
}
