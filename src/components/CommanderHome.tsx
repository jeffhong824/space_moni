import React from 'react';
import { AlertTriangle, Users } from 'lucide-react';
import type { AstronautProfile, DailyHealthRecord, StationTask } from '../types';
import { interpretRecord, type SelfCheckEntry } from '../domain/healthThresholds';
import { weatherTaskConflicts } from '../domain/opsConflicts';
import { sScaleElevated, type SpaceEnvironmentPayload } from '../domain/spaceWeather';
import { StatusPill, toneFromStatus } from '../ui/StatusPill';
import { useI18n } from '../i18n/I18nProvider';
import { localizeKey, statusLabel } from '../i18n/index';
import { CrewCommsInbox } from './CrewCommsInbox';
import { SimBadge } from './SimBadge';

interface CommanderHomeProps {
  astronauts: AstronautProfile[];
  recordsByAstronaut: Record<string, DailyHealthRecord[]>;
  selfChecks: Record<string, SelfCheckEntry | undefined>;
  tasks: StationTask[];
  spaceEnvironment: SpaceEnvironmentPayload | null;
  speDemo: boolean;
  onSelectAstronaut: (astro: AstronautProfile) => void;
  onOpenConsole: () => void;
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
}) => {
  const { t, lang } = useI18n();
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

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-slate-50/80">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">{t('cmd.title')}</h1>
            <SimBadge />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{t('cmd.hint')}</p>
        </div>
        <button
          type="button"
          onClick={onOpenConsole}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700"
        >
          {t('cmd.openConsole')}
        </button>
      </header>

      {sScaleElevated(sScale) && conflicts.length > 0 && (
        <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 text-amber-950 flex gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">{t('cmd.conflictTitle', { scale: sScale })}</p>
            <p className="text-xs mt-1 leading-relaxed">
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

      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-700" />
          <h2 className="text-sm font-bold">{t('cmd.rows')}</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {rows.map(({ astro, today, interp }) => (
            <li key={astro.id}>
              <button
                type="button"
                onClick={() => {
                  onSelectAstronaut(astro);
                  onOpenConsole();
                }}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                  {astro.avatarSeed}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{astro.name}</span>
                    <span className="text-[11px] text-slate-500">{localizeKey(lang, astro.role)}</span>
                    {interp && <StatusPill tone={toneFromStatus(interp.overall)}>{statusLabel(lang, interp.overall)}</StatusPill>}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 truncate">{interp ? t('badge.simTelemetry') : t('cmd.noRecord')}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-mono text-slate-400">{t('cmd.lastUpdated')}</p>
                  <p className="text-xs font-mono text-slate-700">{interp?.lastUpdated ?? '—'}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
      {astronauts[0]?.assignedStation && <CrewCommsInbox shipId={astronauts[0].assignedStation} />}
    </div>
  );
};
