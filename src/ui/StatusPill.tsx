import React from 'react';
import { StatusDot, toneFromRank, type RankTone } from './chrome';

type Tone = RankTone | 'neutral';

export function StatusPill({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const mapped: RankTone = tone === 'neutral' ? 'info' : tone;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/80 text-[11px] font-medium text-stone-700 ${className}`}
    >
      <StatusDot tone={mapped} />
      {children}
    </span>
  );
}

export function toneFromStatus(status?: string): Tone {
  return toneFromRank(status);
}
