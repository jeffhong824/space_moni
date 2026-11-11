import React, { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { AstronautProfile, DailyHealthRecord, StationTask } from '../types';
import { interpretRecord, type SelfCheckEntry } from '../domain/healthThresholds';
import { weatherTaskConflicts } from '../domain/opsConflicts';
import { sScaleElevated, type SpaceEnvironmentPayload } from '../domain/spaceWeather';
import { useI18n } from '../i18n/I18nProvider';
import { localizeKey, statusLabel } from '../i18n/index';
import { CrewCommsInbox } from './CrewCommsInbox';
import { ShipStatusCard } from './ShipStatusCard';
import { BodyMapDashboard } from './BodyMapDashboard';
import { CREW } from '../world/catalog';
import { calendarDayNumber, findCrewLive, type WorldState } from '../world/worldState';
import { buildRiskMatrix } from '../domain/crewSystems';
import { RiskMatrix } from './RiskMatrix';
import { AvatarBubble, Segmented, Sheet, StatusDot, TONE_HEX, toneFromRank } from '../ui/chrome';
import { StatusPill } from '../ui/StatusPill';

interface CommanderHomeProps {
  astronauts: AstronautProfile[];
  recordsByAstronaut: Record<string, DailyHealthRecord[]>;
  selfChecks: Record<string, SelfCheckEntry | undefined>;
  tasks: StationTask[];
  spaceEnvironment: SpaceEnvironmentPayload | null;
  speDemo: boolean;
  onSelectAstronaut: (astro: AstronautProfile) => void;
  onOpenConsole: () => void;
  onOpenAiCall: (prompt?: string) => void;
  world: WorldState;
  commanderId?: string;
}

const RANK = { Critical: 0, Attention: 1, Normal: 2 } as const;

export const CommanderHome: React.FC<CommanderHomeProps> = ({
  astronauts,
  recordsByAstronaut,
  selfChecks,
  tasks,
  spaceEnvironment,
  speDemo,
  onSelectAstronaut,
  onOpenConsole,
  onOpenAiCall,
  world,
  commanderId,
}) => {
  const { t, lang } = useI18n();
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [mode, setMode] = useState<'orbit' | 'list'>('orbit');
  const inspectCrew = inspectId ? CREW.find((c) => c.id === inspectId) : null;
  const inspectAstro = astronauts.find((a) => a.id === inspectId);
  const inspectToday =
    inspectAstro &&
    ((recordsByAstronaut[inspectAstro.id] || []).find((r) => r.isToday) || recordsByAstronaut[inspectAstro.id]?.[0]);
  const inspectInterp =
    inspectAstro && inspectToday ? interpretRecord(inspectToday, selfChecks[inspectAstro.id] ?? null) : null;
  const rows = astronauts
    .map((astro) => {
      const records = recordsByAstronaut[astro.id] || [];
      const today = records.find((r) => r.isToday) || records[0];
      const interp = today ? interpretRecord(today, selfChecks[astro.id] ?? null) : null;
      return { astro, today, interp };
    })
    .sort((a, b) => {
      const ra = a.interp ? RANK[a.interp.overall] : 3;
      const rb = b.interp ? RANK[b.interp.overall] : 3;
      return ra - rb;
    });

  const sScale = spaceEnvironment?.scales.sScale ?? 'S?';
  const conflicts = weatherTaskConflicts(tasks, sScale);
  const live = findCrewLive(world, commanderId || astronauts[0]?.id);
  const n = rows.length;
  const matrixRows = useMemo(() => {
    const defs = astronauts.map((a) => CREW.find((c) => c.id === a.id)).filter((c): c is NonNullable<typeof c> => Boolean(c));
    return buildRiskMatrix(defs, world.t, spaceEnvironment, world.ships);
  }, [astronauts, world.t, world.ships, spaceEnvironment]);

  const openCrew = (id: string) => {
    const astro = astronauts.find((a) => a.id === id);
    if (astro) onSelectAstronaut(astro);
    setInspectId(id);
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 pt-3 sm-page-pad">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl">
            {t('ui.crewAboard', { n })}
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            {t('ui.leoDay', { n: calendarDayNumber(world.missionDay) })} · {t('cmd.hint')}
          </p>
        </div>
        <div className={`flex items-center gap-2 ${inspectId ? 'lg:invisible lg:pointer-events-none' : ''}`}>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { id: 'orbit' as const, label: t('ui.orbitView') },
              { id: 'list' as const, label: t('ui.listView') },
            ]}
            ariaLabel={t('cmd.rows')}
          />
          <button
            type="button"
            onClick={onOpenConsole}
            className="h-10 px-4 rounded-full bg-white text-xs font-semibold"
          >
            {t('cmd.openConsole')}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <RiskMatrix rows={matrixRows} onSelectCrew={openCrew} selectedId={inspectId} />
      </div>

      {sScaleElevated(sScale) && conflicts.length > 0 && (
        <div className="mt-4 px-4 py-3 rounded-[28px] bg-amber-50 text-amber-950 flex gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">{t('cmd.conflictTitle', { scale: sScale })}</p>
            <p className="text-xs mt-1">
              {t('cmd.conflictBody')}
              {speDemo ? t('astro.shelterSpe') : ''}
            </p>
            <ul className="mt-2 text-xs list-disc pl-4 space-y-0.5">
              {conflicts.map((task) => (
                <li key={task.id}>
                  {localizeKey(lang, task.title)}（{task.assignedCrew.map((c) => c.name).join(', ')} · {t(`taskStatus.${task.status}`)}）
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {mode === 'orbit' ? (
        <div
          className={`relative mt-4 aspect-square max-h-[min(42vh,22rem)] transition-all duration-300 ${
            inspectId
              ? 'w-[min(100%,calc(100%-min(38.75rem,52vw)))] ml-0 mr-auto'
              : 'w-full max-w-3xl mx-auto'
          }`}
        >
          <div className="absolute inset-[12%] rounded-full border border-stone-200/80" />
          {rows.map((row, i) => {
            const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
            const r = 38;
            const x = 50 + r * Math.cos(angle);
            const y = 50 + r * Math.sin(angle);
            const rank = row.interp ? RANK[row.interp.overall] : 2;
            const tone = toneFromRank(row.interp?.overall);
            const size = 56 + (2 - rank) * 14;
            const selected = inspectId === row.astro.id;
            return (
              <button
                key={row.astro.id}
                type="button"
                onClick={() => openCrew(row.astro.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: size,
                  height: size,
                  boxShadow: selected ? `0 0 0 4px ${TONE_HEX[tone]}` : `0 0 0 3px ${TONE_HEX[tone]}`,
                }}
                aria-label={`${row.astro.name} ${row.interp ? statusLabel(lang, row.interp.overall) : ''}`}
              >
                <AvatarBubble name={row.astro.name} seed={row.astro.avatarSeed} id={row.astro.id} size={size} />
              </button>
            );
          })}
        </div>
      ) : (
        <ul className="mt-6 space-y-2 max-w-2xl">
          {rows.map(({ astro, interp }) => (
            <li key={astro.id}>
              <button
                type="button"
                onClick={() => openCrew(astro.id)}
                className="w-full text-left px-4 py-3 rounded-[28px] bg-white/90 flex items-center gap-3"
              >
                <AvatarBubble name={astro.name} seed={astro.avatarSeed} id={astro.id} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{astro.name}</span>
                    <span className="text-[11px] text-stone-500">{localizeKey(lang, astro.role)}</span>
                    {interp && <StatusPill tone={toneFromRank(interp.overall)}>{statusLabel(lang, interp.overall)}</StatusPill>}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {live && (
        <div className="mt-6">
          <ShipStatusCard world={world} ship={live.ship} me={live.crew} showFleetStrip />
        </div>
      )}
      {astronauts[0]?.assignedStation && <CrewCommsInbox shipId={astronauts[0].assignedStation} />}

      <Sheet
        open={!!inspectCrew}
        onClose={() => setInspectId(null)}
        title={
          inspectCrew ? (
            <div>
              <p className="font-display text-2xl">{inspectCrew.name}</p>
              <p className="text-[12px] text-stone-500">{t(inspectCrew.occupationKey)}</p>
              {inspectInterp && (
                <StatusDot
                  className="mt-2"
                  tone={toneFromRank(inspectInterp.overall)}
                  label={inspectInterp.overall === 'Normal' ? t('status.normal') : t('ui.watch')}
                />
              )}
            </div>
          ) : null
        }
        wide
      >
        {inspectInterp && inspectAstro && (
          <div className="space-y-3 mb-4 text-sm">
            <p>
              <span className="text-stone-400">{t('ui.whyPrefix')}</span>
              {' · '}
              {inspectInterp.metrics.find((m) => m.status !== 'Normal')
                ? `${t(`metric.${inspectInterp.metrics.find((m) => m.status !== 'Normal')!.id}`)} ${inspectInterp.metrics.find((m) => m.status !== 'Normal')!.valueLabel}`
                : t('reason.allNormal')}
            </p>
            <p>
              <span className="text-stone-400">{t('ui.nextPrefix')}</span>
              {' · '}
              {t('body.askAura')}
            </p>
          </div>
        )}
        {inspectCrew && (
          <BodyMapDashboard crew={inspectCrew} tNow={world.t} wx={spaceEnvironment} onOpenAiCall={onOpenAiCall} />
        )}
      </Sheet>
    </div>
  );
};
