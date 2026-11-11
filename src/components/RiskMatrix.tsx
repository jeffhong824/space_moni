import React from 'react';
import type { RiskRow, SystemId } from '../domain/crewSystems';
import { SYSTEM_IDS } from '../domain/crewSystems';
import { useI18n } from '../i18n/I18nProvider';
import { statusLabel } from '../i18n/index';

const CELL: Record<string, string> = {
  ok: 'bg-emerald-100 text-emerald-900',
  warn: 'bg-amber-100 text-amber-950',
  crit: 'bg-rose-100 text-rose-950',
};

function cellClass(status: string): string {
  if (status === 'Critical') return CELL.crit;
  if (status === 'Attention') return CELL.warn;
  return CELL.ok;
}

export function RiskMatrix({
  rows,
  onSelectCrew,
  selectedId,
}: {
  rows: RiskRow[];
  onSelectCrew?: (crewId: string) => void;
  selectedId?: string | null;
}) {
  const { t, lang } = useI18n();
  return (
    <section data-risk-matrix className="rounded-[20px] bg-white px-3 py-3 shadow-[var(--sm-shadow-soft)] overflow-x-auto">
      <p className="text-[13px] font-semibold">{t('panel.matrixTitle')}</p>
      <p className="text-[11px] text-stone-500 mt-0.5">{t('panel.matrixHint')}</p>
      {rows[0]?.prompts.length ? (
        <ul className="mt-2 space-y-1" data-risk-prompts>
          {rows
            .filter((r) => r.prompts.length)
            .slice(0, 4)
            .flatMap((r) =>
              r.prompts.slice(0, 2).map((p) => (
                <li key={`${r.crewId}-${p.id}`} className="text-[12px] rounded-[12px] bg-amber-50 px-2.5 py-1.5 text-amber-950">
                  <span className="font-semibold">{r.name.split(' ')[0]}</span>
                  {' — '}
                  {t(p.key)}
                </li>
              ))
            )}
        </ul>
      ) : (
        <p className="mt-2 text-[11px] text-stone-400">{t('today.allInRange')}</p>
      )}
      <div className="mt-2 max-h-[min(40vh,22rem)] overflow-auto">
      <table className="w-full min-w-[40rem] text-[10px] border-separate border-spacing-0.5">
        <thead>
          <tr>
            <th className="text-left font-semibold px-1 py-1 sticky left-0 top-0 bg-white z-[1]">{t('panel.sortBaseline')}</th>
            {SYSTEM_IDS.map((id) => (
              <th key={id} className="font-semibold px-1 py-1 text-center whitespace-nowrap sticky top-0 bg-white z-[1]">
                {t(`panel.sys.${id}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.crewId} className={selectedId === row.crewId ? 'outline outline-1 outline-sky-300 rounded' : ''}>
              <th className="text-left font-medium px-1 py-0.5 sticky left-0 bg-white">
                <button type="button" className="text-left hover:underline" onClick={() => onSelectCrew?.(row.crewId)}>
                  {row.name.split(' ')[0]}
                </button>
              </th>
              {SYSTEM_IDS.map((id: SystemId) => {
                const cell = row.cells.find((c) => c.system === id);
                const st = cell?.status ?? 'Normal';
                return (
                  <td key={id} className="p-0">
                    <span className={`block text-center rounded-[8px] px-1 py-1 tabular-nums ${cellClass(st)}`} title={statusLabel(lang, st)}>
                      {st === 'Normal' ? '·' : st === 'Critical' ? '!' : '•'}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <p className="mt-1 text-[10px] text-stone-400">{t('panel.simNote')}</p>
    </section>
  );
}
