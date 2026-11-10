import React from 'react';
import { AlertTriangle, Users } from 'lucide-react';
import type { AstronautProfile, DailyHealthRecord, StationTask } from '../types';
import { interpretRecord, type SelfCheckEntry } from '../domain/healthThresholds';
import { weatherTaskConflicts } from '../domain/opsConflicts';
import { sScaleElevated, type SpaceEnvironmentPayload } from '../domain/spaceWeather';
import { StatusPill, toneFromStatus } from '../ui/StatusPill';

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
          <h1 className="text-lg font-bold text-slate-900">組員總覽</h1>
          <p className="text-xs text-slate-500 mt-0.5">依 危急 → 注意 → 正常 排序。生理為示範遙測。</p>
        </div>
        <button
          type="button"
          onClick={onOpenConsole}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700"
        >
          開啟作業台
        </button>
      </header>

      {sScaleElevated(sScale) && conflicts.length > 0 && (
        <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 text-amber-950 flex gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">空間天氣與任務衝突 · {sScale}</p>
            <p className="text-xs mt-1 leading-relaxed">
              S1 以上不建議執行艙外活動或高負荷運動。
              {speDemo ? ' 目前 S 尺度來自標示「示範」的太陽質子事件，不是 NOAA 即時質子讀數。' : ''}
            </p>
            <ul className="mt-2 text-xs list-disc pl-4 space-y-0.5">
              {conflicts.map((t) => (
                <li key={t.id}>
                  {t.title}（{t.assignedCrew.map((c) => c.name).join('、')} · {t.status}）
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-700" />
          <h2 className="text-sm font-bold">組員列</h2>
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
                    <span className="text-[11px] text-slate-500">{astro.role}</span>
                    {interp && <StatusPill tone={toneFromStatus(interp.overall)}>{interp.overallZh}</StatusPill>}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 truncate">{interp?.reasonZh ?? '無今日紀錄'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-mono text-slate-400">最後更新</p>
                  <p className="text-xs font-mono text-slate-700">{interp?.lastUpdated ?? '—'}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
