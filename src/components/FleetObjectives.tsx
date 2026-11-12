import React, { useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { localizeKey, statusLabel } from '../i18n/index';
import type { StationTask } from '../types';
import type { WorldState } from '../world/worldState';
import { fleetObjectives, type CrewWorkloadRow, type FleetStationObjectives } from '../domain/stationObjectives';
import { SourceTag } from './SourceTag';
import { AvatarBubble, Sheet, StatusDot, toneFromRank } from '../ui/chrome';
import { StatusPill } from '../ui/StatusPill';

function priorityCls(priority: StationTask['priority']): string {
  switch (priority) {
    case 'Critical':
      return 'text-rose-700 bg-rose-50 border-rose-200';
    case 'High':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'Medium':
      return 'text-sky-700 bg-sky-50 border-sky-200';
    default:
      return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

function TaskRow({ task, behind }: { task: StationTask; behind: boolean }) {
  const { t, lang } = useI18n();
  const done = task.status === 'Completed';
  return (
    <li className="rounded-[16px] bg-stone-50 px-3 py-2.5 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[12px] font-semibold leading-snug ${done ? 'text-stone-400 line-through' : 'text-stone-900'}`}>
          {localizeKey(lang, task.title)}
        </p>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase font-mono shrink-0 ${priorityCls(task.priority)}`}>
          {t(`priority.${task.priority}`)}
        </span>
      </div>
      <p className="text-[11px] text-stone-500">{localizeKey(lang, task.module)}</p>
      <div className="flex justify-between items-center text-[11px] font-mono">
        <span className="text-stone-500">{t('tasks.progress')}</span>
        <span className="tabular-nums font-semibold">{task.progress}%</span>
      </div>
      <div className="w-full bg-white rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full ${done ? 'bg-emerald-500' : 'bg-sky-500'}`} style={{ width: `${task.progress}%` }} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {task.assignedCrew.map((c) => (
          <span key={c.name} className="inline-flex items-center gap-1 text-[11px] text-stone-600">
            <AvatarBubble name={c.name} seed={c.name} id={c.name} size={24} />
            {c.name.split(' ')[0]}
          </span>
        ))}
        {behind && (
          <span className="ml-auto text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-full">
            {t('tasks.behind')}
          </span>
        )}
      </div>
    </li>
  );
}

function CrewChip({
  row,
  onClick,
}: {
  row: CrewWorkloadRow;
  onClick: () => void;
}) {
  const { t, lang } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full pr-2.5 py-0.5 ${
        row.over ? 'bg-amber-50 ring-1 ring-amber-200' : 'bg-stone-50'
      }`}
    >
      <AvatarBubble name={row.name} seed={row.name} id={row.name} size={24} />
      <span className="text-[11px] font-medium">{row.name.split(' ')[0]}</span>
      <span className="text-[10px] font-mono text-stone-500">{t('tasks.openTasks', { n: row.open })}</span>
      {row.over && <StatusDot tone={toneFromRank(row.status)} label={statusLabel(lang, row.status)} />}
    </button>
  );
}

export const FleetObjectives: React.FC<{
  world: WorldState;
  extraTasks: StationTask[];
  now: number;
}> = ({ world, extraTasks, now }) => {
  const { t } = useI18n();
  const rows = useMemo(() => fleetObjectives(world, extraTasks, now), [world, extraTasks, now]);
  const [drill, setDrill] = useState<{ shipId: string; crewName?: string } | null>(null);
  const active: FleetStationObjectives | undefined = rows.find((r) => r.shipId === drill?.shipId);
  const drillTasks = active
    ? drill?.crewName
      ? active.tasks.filter((task) => task.assignedCrew.some((c) => c.name === drill.crewName))
      : active.tasks
    : [];
  const drillBehind = new Set(active?.behind.map((t) => t.id));

  return (
    <section data-hq-objectives className="rounded-[24px] bg-white px-3 py-3 shadow-[var(--sm-shadow-soft)] space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold">{t('tasks.station')}</h2>
          <p className="text-[11px] text-stone-500 mt-0.5">{t('tasks.fleetHint')}</p>
        </div>
        <SourceTag kind="SIMULATION" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
        {rows.map((row) => (
          <article key={row.shipId} className="rounded-[20px] bg-stone-50 p-3 space-y-2 min-w-0">
            <button type="button" onClick={() => setDrill({ shipId: row.shipId })} className="w-full text-left space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-semibold leading-snug">{t(row.nameKey)}</p>
                <StatusPill tone={row.behind.length ? 'warn' : 'ok'}>
                  {row.behind.length ? t('tasks.behindCount', { n: row.behind.length }) : t('tasks.onSchedule')}
                </StatusPill>
              </div>
              <p className="text-[11px] font-mono text-stone-500">
                {t('tasks.count', { n: row.tasks.length })} · {t('tasks.progress')} {row.meanProgress}%
              </p>
              <div className="w-full bg-white rounded-full h-1.5 overflow-hidden">
                <div className="h-1.5 rounded-full bg-sky-500" style={{ width: `${row.meanProgress}%` }} />
              </div>
            </button>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">{t('tasks.workload')}</p>
            <div className="flex flex-wrap gap-1.5">
              {row.crew
                .filter((c) => c.open > 0 || c.over)
                .slice(0, 6)
                .map((c) => (
                  <CrewChip key={c.name} row={c} onClick={() => setDrill({ shipId: row.shipId, crewName: c.name })} />
                ))}
              {row.crew.filter((c) => c.open > 0).length === 0 && (
                <span className="text-[11px] text-stone-400">{t('tasks.noTasks')}</span>
              )}
            </div>
            {row.crew.some((c) => c.over) && (
              <p className="text-[11px] font-semibold text-amber-900">
                {t('tasks.overAllocCount', { n: row.crew.filter((c) => c.over).length })}
              </p>
            )}
            <button
              type="button"
              onClick={() => setDrill({ shipId: row.shipId })}
              className="text-[12px] font-semibold text-[var(--sm-cobalt)]"
            >
              {t('tasks.viewObjectives')} →
            </button>
          </article>
        ))}
      </div>

      <Sheet
        open={!!drill && !!active}
        onClose={() => setDrill(null)}
        from="bottom"
        wide
        title={
          <div>
            <p className="font-display text-2xl">{active ? t(active.nameKey) : t('tasks.station')}</p>
            <p className="text-[12px] text-stone-500">
              {drill?.crewName
                ? t('tasks.crewObjectives', { name: drill.crewName })
                : t('tasks.viewObjectives')}
              {' · '}
              {t('common.simulation')}
            </p>
          </div>
        }
      >
        {active && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {active.crew.map((c) => (
                <CrewChip
                  key={c.name}
                  row={c}
                  onClick={() => setDrill({ shipId: active.shipId, crewName: c.name })}
                />
              ))}
            </div>
            {drill?.crewName && (
              <button
                type="button"
                className="text-[12px] font-semibold text-[var(--sm-cobalt)]"
                onClick={() => setDrill({ shipId: active.shipId })}
              >
                {t('tasks.viewObjectives')} →
              </button>
            )}
            <ul className="space-y-2">
              {drillTasks.length === 0 && <li className="text-[12px] text-stone-400">{t('tasks.noTasks')}</li>}
              {drillTasks.map((task) => (
                <TaskRow key={task.id} task={task} behind={drillBehind.has(task.id)} />
              ))}
            </ul>
          </div>
        )}
      </Sheet>
    </section>
  );
};
