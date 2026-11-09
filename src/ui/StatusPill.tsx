import React from 'react';

type Tone = 'ok' | 'warn' | 'crit' | 'info' | 'neutral';

const TONE: Record<Tone, string> = {
  ok: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warn: 'bg-amber-50 text-amber-900 border-amber-200',
  crit: 'bg-rose-50 text-rose-800 border-rose-200',
  info: 'bg-sky-50 text-sky-800 border-sky-200',
  neutral: 'bg-slate-50 text-slate-700 border-slate-200',
};

export function StatusPill({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold tracking-wide ${TONE[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function toneFromStatus(status?: string): Tone {
  if (!status) return 'neutral';
  if (status === 'Critical' || status === 'Severe' || status === 'unavailable') return 'crit';
  if (
    status === 'Attention' ||
    status === 'Attention Required' ||
    status === 'High' ||
    status === 'Moderate' ||
    status === 'partial' ||
    status === 'Elevated'
  ) {
    return 'warn';
  }
  if (status === 'Nominal' || status === 'Normal' || status === 'Low' || status === 'ok') return 'ok';
  return 'info';
}
