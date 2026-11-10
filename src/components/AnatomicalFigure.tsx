import React from 'react';
import type { BodyRegionId, Rank } from '../world/bodyHealth';

const FILL: Record<Rank, string> = {
  0: '#34d399',
  1: '#fbbf24',
  2: '#fb7185',
};

const FILL_DIM: Record<Rank, string> = {
  0: '#065f46',
  1: '#92400e',
  2: '#9f1239',
};

export const AnatomicalFigure: React.FC<{
  side: 'front' | 'back';
  regionRank: Record<BodyRegionId, Rank>;
  selected: BodyRegionId | null;
  onSelect: (id: BodyRegionId) => void;
  pulse: BodyRegionId | null;
}> = ({ side, regionRank, selected, onSelect, pulse }) => {
  const r = (id: BodyRegionId) => regionRank[id] ?? 0;
  const cls = (id: BodyRegionId) =>
    [
      'cursor-pointer transition-colors duration-300',
      selected === id ? 'stroke-white stroke-2' : 'stroke-slate-500/80 stroke-[0.8]',
      pulse === id ? 'animate-pulse' : '',
    ].join(' ');

  const fill = (id: BodyRegionId) => (selected === id ? FILL[r(id)] : FILL_DIM[r(id)]);

  return (
    <svg viewBox="0 0 240 560" className="w-full h-full max-h-[520px]" role="img" aria-label={side}>
      <defs>
        <filter id="atlas-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="atlas-shade" x1="0" x2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* Skin / silhouette */}
      <path
        d={side === 'front' ? SILHOUETTE_FRONT : SILHOUETTE_BACK}
        fill="url(#atlas-shade)"
        stroke="#475569"
        strokeWidth="1.2"
        className={cls('skin')}
        onClick={() => onSelect('skin')}
        opacity={0.95}
      />
      {r('skin') > 0 && (
        <path
          d={side === 'front' ? SILHOUETTE_FRONT : SILHOUETTE_BACK}
          fill={FILL[r('skin')]}
          opacity={0.18}
          className={cls('skin')}
          onClick={() => onSelect('skin')}
        />
      )}

      {side === 'front' ? (
        <>
          <ellipse cx="120" cy="46" rx="28" ry="32" fill={fill('brain')} className={cls('brain')} onClick={() => onSelect('brain')} filter={pulse === 'brain' ? 'url(#atlas-glow)' : undefined} />
          <ellipse cx="108" cy="48" rx="6" ry="4" fill={fill('eyes')} className={cls('eyes')} onClick={() => onSelect('eyes')} />
          <ellipse cx="132" cy="48" rx="6" ry="4" fill={fill('eyes')} className={cls('eyes')} onClick={() => onSelect('eyes')} filter={pulse === 'eyes' ? 'url(#atlas-glow)' : undefined} />
          <path d="M86 118 C86 102 154 102 154 118 C154 168 148 196 120 198 C92 196 86 168 86 118Z" fill={fill('lungs')} className={cls('lungs')} onClick={() => onSelect('lungs')} opacity={0.85} />
          <path d="M112 128 C118 118 138 122 140 140 C138 158 122 168 114 158 C104 150 106 136 112 128Z" fill={fill('heart')} className={cls('heart')} onClick={() => onSelect('heart')} filter={pulse === 'heart' ? 'url(#atlas-glow)' : undefined} />
          <rect x="116" y="108" width="8" height="168" rx="3" fill={fill('spine')} className={cls('spine')} onClick={() => onSelect('spine')} opacity={0.55} />
          <ellipse cx="96" cy="236" rx="14" ry="18" fill={fill('kidneys')} className={cls('kidneys')} onClick={() => onSelect('kidneys')} opacity={0.9} />
          <ellipse cx="144" cy="236" rx="14" ry="18" fill={fill('kidneys')} className={cls('kidneys')} onClick={() => onSelect('kidneys')} />
          <path d="M78 268 C78 252 162 252 162 268 C164 292 150 308 120 310 C90 308 76 292 78 268Z" fill={fill('hips')} className={cls('hips')} onClick={() => onSelect('hips')} />
          <path d="M84 312 C78 360 74 410 86 430 C102 438 112 400 114 318 Z" fill={fill('quads')} className={cls('quads')} onClick={() => onSelect('quads')} />
          <path d="M126 318 C128 400 138 438 154 430 C166 410 162 360 156 312 Z" fill={fill('quads')} className={cls('quads')} onClick={() => onSelect('quads')} />
          <path d="M88 438 C84 478 88 512 98 522 C110 518 112 478 108 438 Z" fill={fill('calves')} className={cls('calves')} onClick={() => onSelect('calves')} />
          <path d="M132 438 C128 478 130 518 142 522 C152 512 156 478 152 438 Z" fill={fill('calves')} className={cls('calves')} onClick={() => onSelect('calves')} />
        </>
      ) : (
        <>
          <ellipse cx="120" cy="46" rx="28" ry="32" fill={fill('brain')} className={cls('brain')} onClick={() => onSelect('brain')} filter={pulse === 'brain' ? 'url(#atlas-glow)' : undefined} />
          <path d="M78 112 C84 96 156 96 162 112 C168 150 160 210 148 248 C140 258 100 258 92 248 C80 210 72 150 78 112Z" fill={fill('back')} className={cls('back')} onClick={() => onSelect('back')} />
          <rect x="114" y="100" width="12" height="176" rx="4" fill={fill('spine')} className={cls('spine')} onClick={() => onSelect('spine')} filter={pulse === 'spine' ? 'url(#atlas-glow)' : undefined} />
          <ellipse cx="94" cy="232" rx="16" ry="20" fill={fill('kidneys')} className={cls('kidneys')} onClick={() => onSelect('kidneys')} />
          <ellipse cx="146" cy="232" rx="16" ry="20" fill={fill('kidneys')} className={cls('kidneys')} onClick={() => onSelect('kidneys')} />
          <path d="M76 268 C78 250 162 250 164 268 C166 300 148 318 120 320 C92 318 74 300 76 268Z" fill={fill('hips')} className={cls('hips')} onClick={() => onSelect('hips')} />
          <path d="M86 322 C80 380 78 430 92 448 C108 444 114 390 116 324 Z" fill={fill('calves')} opacity={0.45} className={cls('calves')} onClick={() => onSelect('calves')} />
          <path d="M124 324 C126 390 132 444 148 448 C162 430 160 380 154 322 Z" fill={fill('calves')} opacity={0.45} className={cls('calves')} onClick={() => onSelect('calves')} />
          <path d="M90 448 C86 488 90 518 100 528 C112 522 114 486 110 448 Z" fill={fill('calves')} className={cls('calves')} onClick={() => onSelect('calves')} />
          <path d="M130 448 C126 486 128 522 140 528 C150 518 154 488 150 448 Z" fill={fill('calves')} className={cls('calves')} onClick={() => onSelect('calves')} />
        </>
      )}

      {/* Deltoids / arms — skin-linked, not a separate domain */}
      {side === 'front' ? (
        <>
          <path d="M78 108 C52 130 44 190 50 230 C62 236 74 200 80 150 Z" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
          <path d="M162 108 C188 130 196 190 190 230 C178 236 166 200 160 150 Z" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
        </>
      ) : (
        <>
          <path d="M78 108 C50 132 42 192 48 232 C60 236 74 198 80 148 Z" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
          <path d="M162 108 C190 132 198 192 192 232 C180 236 166 198 160 148 Z" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
        </>
      )}
    </svg>
  );
};

const SILHOUETTE_FRONT =
  'M120 12 C148 12 156 36 156 52 C156 64 150 74 144 80 L152 96 C176 108 188 128 194 168 C198 198 196 228 188 236 L176 232 C170 200 168 160 158 132 L158 250 C176 258 184 278 182 300 L170 302 C166 280 160 270 150 268 L152 312 C158 380 164 430 158 468 C170 476 176 500 168 530 C160 548 148 552 140 536 L136 500 C132 470 130 430 128 318 L112 318 C110 430 108 470 104 500 L100 536 C92 552 80 548 72 530 C64 500 70 476 82 468 C76 430 82 380 88 312 L90 268 C80 270 74 280 70 302 L58 300 C56 278 64 258 82 250 L82 132 C72 160 70 200 64 232 L52 236 C44 228 42 198 46 168 C52 128 64 108 88 96 L96 80 C90 74 84 64 84 52 C84 36 92 12 120 12Z';

const SILHOUETTE_BACK =
  'M120 12 C148 12 156 36 156 52 C156 64 150 74 144 80 L154 98 C178 110 190 132 196 172 C200 202 198 230 190 238 L178 234 C172 200 168 158 158 130 L158 252 C176 260 186 280 184 302 L172 304 C168 282 160 272 150 270 L152 316 C158 384 164 434 158 470 C170 478 176 502 168 532 C160 550 148 554 140 538 L136 502 C132 472 130 432 128 320 L112 320 C110 432 108 472 104 502 L100 538 C92 554 80 550 72 532 C64 502 70 478 82 470 C76 434 82 384 88 316 L90 270 C80 272 72 282 68 304 L56 302 C54 280 64 260 82 252 L82 130 C70 158 68 200 62 234 L50 238 C42 230 40 202 44 172 C50 132 62 110 86 98 L96 80 C90 74 84 64 84 52 C84 36 92 12 120 12Z';
