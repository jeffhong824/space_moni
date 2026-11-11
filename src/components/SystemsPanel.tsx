import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { CrewPanel, SystemGroup, SystemMetric } from '../domain/crewSystems';
import { useI18n } from '../i18n/I18nProvider';
import { statusLabel } from '../i18n/index';
import { StatusDot, toneFromRank } from '../ui/chrome';

function MiniSpark({ points, color }: { points: number[]; color: string }) {
  const w = 48;
  const h = 16;
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - 2 - ((v - min) / span) * (h - 4);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-12 h-4 shrink-0" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function displayMetric(m: SystemMetric, t: (k: string, v?: Record<string, string | number>) => string): string {
  if (m.id === 'ecg') return t(`panel.ecg.${m.display}` as 'panel.ecg.sinus');
  if (m.id === 'ortho') return m.numericValue ? t('panel.ortho.flag') : t('panel.ortho.stable');
  if (m.id === 'speShelter') return m.numericValue ? t('panel.shelter.enter') : t('panel.shelter.clear');
  return m.display;
}

export function MetricRow({ m }: { m: SystemMetric }) {
  const { t, lang } = useI18n();
  const warn = m.status !== 'Normal';
  return (
    <li
      data-metric={m.id}
      className={`grid grid-cols-[minmax(0,1.3fr)_auto_auto] sm:grid-cols-[minmax(0,1.2fr)_auto_auto_auto] items-center gap-x-2 gap-y-0.5 px-2 py-1 rounded-[10px] ${
        warn ? 'bg-amber-50' : ''
      }`}
    >
      <p className="text-[12px] font-medium truncate">
        {t(m.labelKey)}
        {m.source === 'noaa' ? <span className="ml-1 text-[9px] font-semibold text-emerald-700">{t('panel.noaaLive')}</span> : null}
      </p>
      <p className="text-[12px] tabular-nums font-semibold text-right">
        {displayMetric(m, t)}
        {m.unit ? <span className="ml-0.5 text-[10px] font-medium text-stone-400">{m.unit}</span> : null}
      </p>
      <StatusDot tone={toneFromRank(m.status)} label={statusLabel(lang, m.status)} />
      <p className="col-span-3 sm:col-span-1 sm:text-right text-[10px] text-stone-500 tabular-nums flex items-center gap-2 justify-end">
        <span>
          {t('panel.range', { band: m.range })}
          {m.delta != null ? (
            <>
              {' · '}
              {m.delta > 0 ? '+' : ''}
              {m.delta} {t('panel.vsBaseline')}
            </>
          ) : null}
        </span>
        {m.series.length > 1 && <MiniSpark points={m.series} color={warn ? '#c45c2a' : '#2b3bff'} />}
      </p>
    </li>
  );
}

export function SystemGroupBlock({ group, defaultOpen }: { group: SystemGroup; defaultOpen?: boolean }) {
  const { t, lang } = useI18n();
  const off = group.metrics.filter((m) => m.status !== 'Normal').length;
  return (
    <details data-system={group.id} open={defaultOpen ?? group.status !== 'Normal'} className="rounded-[16px] bg-white px-2 py-1.5 shadow-[var(--sm-shadow-soft)]">
      <summary className="flex items-center gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <span className="text-[13px] font-semibold">{t(`panel.sys.${group.id}`)}</span>
        <StatusDot tone={toneFromRank(group.status)} label={statusLabel(lang, group.status)} />
        {off > 0 && <span className="text-[10px] text-amber-800">{t('panel.offCount', { n: off })}</span>}
        <span className="ml-auto text-[10px] text-stone-400 truncate max-w-[45%]">{t(group.hrpKey)}</span>
      </summary>
      <p className="text-[10px] text-stone-400 px-2 mt-1">{t('panel.simNote')}</p>
      <ul className="mt-1 space-y-0.5">
        {group.metrics.map((m) => (
          <MetricRow key={m.id} m={m} />
        ))}
      </ul>
      {group.prompts.length > 0 && (
        <ul className="mt-1 px-2 space-y-0.5">
          {group.prompts.map((p) => (
            <li key={p.id} className="text-[11px] text-amber-950">
              {t(p.key)}
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}

export function AbnormalStrip({ panel }: { panel: CrewPanel }) {
  const { t } = useI18n();
  const top = panel.flagged.slice(0, 4);
  if (top.length === 0) {
    return (
      <section data-today-vitals className="order-2 lg:col-span-12 rounded-[16px] bg-white px-3 py-2 shadow-[var(--sm-shadow-soft)]">
        <p className="text-[12px] font-semibold">{t('today.allInRange')}</p>
        <p className="text-[10px] text-stone-400">{t('panel.simNote')}</p>
      </section>
    );
  }
  return (
    <section data-today-vitals data-today-abnormal className="order-2 lg:col-span-12 rounded-[16px] bg-white px-2 py-2 shadow-[var(--sm-shadow-soft)]">
      <p className="text-[11px] font-semibold px-1 mb-1">
        {t('panel.abnormalFirst')} · {t('common.simulation')}
      </p>
      <ul className="space-y-0.5">
        {top.map((m) => (
          <MetricRow key={m.id} m={m} />
        ))}
      </ul>
    </section>
  );
}

export function SystemsAccordion({ panel }: { panel: CrewPanel }) {
  const { t } = useI18n();
  return (
    <section data-today-systems className="lg:col-span-12 space-y-1.5">
      <p className="text-[11px] font-semibold text-stone-500 px-1">
        {t('panel.systems')} · {t('panel.hrpCite')}
      </p>
      {panel.groups.map((g) => (
        <SystemGroupBlock key={g.id} group={g} />
      ))}
    </section>
  );
}
