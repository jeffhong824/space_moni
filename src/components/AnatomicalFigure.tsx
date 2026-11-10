import React, { useEffect, useMemo, useState } from 'react';
import type { BodyRegionId, Rank } from '../world/bodyHealth';

const W = 720;
const H = 1280;

const TINT: Record<Rank, string> = {
  0: 'rgba(125, 223, 195, 0.42)',
  1: 'rgba(243, 177, 132, 0.5)',
  2: 'rgba(240, 138, 128, 0.55)',
};
const RING: Record<Rank, string> = {
  0: '#7ddfc3',
  1: '#f3b184',
  2: '#f08a80',
};
const AURA: Record<Rank, { inner: string; outer: string }> = {
  0: { inner: 'rgba(125, 223, 195, 0)', outer: 'rgba(125, 223, 195, 0.28)' },
  1: { inner: 'rgba(243, 177, 132, 0)', outer: 'rgba(243, 177, 132, 0.32)' },
  2: { inner: 'rgba(240, 138, 128, 0)', outer: 'rgba(240, 138, 128, 0.36)' },
};

interface Hit {
  id: BodyRegionId;
  cx: number;
  cy: number;
  labelSide: 'left' | 'right';
  shapes: string[];
}

/** Silhouette traced from the 720×1280 holographic plates (includes arms). */
const SKIN_FRONT =
  'M360 32 C418 32 422 82 412 132 C412 162 398 186 390 200 L448 234 C528 272 554 375 558 505 C564 590 568 650 566 698 L498 706 C490 620 476 495 450 328 L454 558 C472 574 500 616 508 672 L488 684 C466 640 430 622 408 628 L416 858 C420 958 428 1072 416 1152 C432 1174 448 1208 418 1214 C388 1222 368 1208 358 1184 L354 1150 C350 1070 346 958 342 858 L312 628 C288 622 252 640 232 684 L212 672 C222 616 248 574 266 558 L270 328 C244 495 230 620 222 706 L154 698 C152 650 156 590 162 505 C166 375 192 272 272 234 L330 200 C322 186 308 162 308 132 C298 82 302 32 360 32Z';

const SKIN_BACK =
  'M360 30 C420 30 424 80 414 130 C414 160 400 184 392 198 L452 232 C532 270 558 372 562 500 C568 588 572 650 570 702 L500 710 C492 622 478 492 450 322 L454 552 C474 570 504 612 512 668 L492 680 C468 636 432 618 410 624 L416 862 C420 968 430 1080 418 1168 C436 1190 452 1220 422 1224 C390 1230 368 1214 358 1188 L354 1164 C350 1078 346 968 342 862 L310 624 C286 618 250 636 228 680 L208 668 C218 612 246 570 266 552 L270 322 C244 492 228 622 220 710 L150 702 C148 650 152 588 158 500 C162 372 188 270 268 232 L328 198 C320 184 306 160 306 130 C296 80 300 30 360 30Z';

/** Coordinates in the 720×1280 holographic plates. */
const FRONT_HITS: Hit[] = [
  {
    id: 'brain',
    cx: 360,
    cy: 108,
    labelSide: 'left',
    shapes: ['M308 46 C308 20 412 20 412 46 C414 94 400 164 360 176 C320 164 306 94 308 46Z'],
  },
  {
    id: 'eyes',
    cx: 360,
    cy: 104,
    labelSide: 'right',
    shapes: [
      'M314 96 C314 86 350 86 350 104 C350 118 314 118 314 104Z',
      'M370 96 C370 86 406 86 406 104 C406 118 370 118 370 104Z',
    ],
  },
  {
    id: 'lungs',
    cx: 360,
    cy: 340,
    labelSide: 'left',
    shapes: [
      'M248 268 C252 242 332 246 354 282 C350 358 328 416 294 424 C256 410 246 328 248 268Z',
      'M472 268 C468 242 388 246 366 282 C370 358 392 416 426 424 C464 410 474 328 472 268Z',
    ],
  },
  {
    id: 'heart',
    cx: 412,
    cy: 344,
    labelSide: 'right',
    shapes: ['M380 312 C400 288 454 298 458 344 C454 388 424 410 400 390 C378 370 364 336 380 312Z'],
  },
  {
    id: 'hips',
    cx: 360,
    cy: 600,
    labelSide: 'right',
    shapes: [
      'M268 538 C274 508 446 508 452 538 C460 578 430 628 360 636 C290 628 260 578 268 538Z',
      'M316 622 C298 682 292 742 306 758 C330 760 342 692 350 628Z',
      'M404 622 C422 682 428 742 414 758 C390 760 378 692 370 628Z',
    ],
  },
  {
    id: 'quads',
    cx: 360,
    cy: 752,
    labelSide: 'left',
    shapes: [
      'M248 638 C240 728 246 842 274 870 C318 874 338 772 342 640Z',
      'M472 638 C480 728 474 842 446 870 C402 874 382 772 378 640Z',
    ],
  },
  {
    id: 'calves',
    cx: 360,
    cy: 1020,
    labelSide: 'right',
    shapes: [
      'M256 888 C248 978 256 1100 284 1146 C322 1140 336 1000 334 890Z',
      'M464 888 C472 978 464 1100 436 1146 C398 1140 384 1000 386 890Z',
    ],
  },
  { id: 'skin', cx: 360, cy: 640, labelSide: 'left', shapes: [SKIN_FRONT] },
];

const BACK_HITS: Hit[] = [
  {
    id: 'brain',
    cx: 360,
    cy: 108,
    labelSide: 'left',
    shapes: ['M308 44 C308 18 412 18 412 44 C414 92 400 162 360 174 C320 162 306 92 308 44Z'],
  },
  {
    id: 'back',
    cx: 360,
    cy: 330,
    labelSide: 'left',
    shapes: ['M252 232 C274 204 446 204 468 232 C490 304 470 428 426 464 C396 482 324 482 294 464 C250 428 230 304 252 232Z'],
  },
  {
    id: 'spine',
    cx: 360,
    cy: 390,
    labelSide: 'right',
    shapes: ['M350 208 L370 208 L375 572 C375 584 345 584 345 572Z'],
  },
  {
    id: 'kidneys',
    cx: 360,
    cy: 458,
    labelSide: 'right',
    shapes: [
      'M298 438 C298 416 338 412 344 444 C338 476 298 480 298 450Z',
      'M422 438 C422 416 382 412 376 444 C382 476 422 480 422 450Z',
    ],
  },
  {
    id: 'hips',
    cx: 360,
    cy: 610,
    labelSide: 'left',
    shapes: [
      'M262 548 C268 514 452 514 458 548 C466 592 432 646 360 654 C288 646 254 592 262 548Z',
      'M314 640 C296 700 290 760 304 776 C328 778 340 710 348 646Z',
      'M406 640 C424 700 430 760 416 776 C392 778 380 710 372 646Z',
    ],
  },
  {
    id: 'calves',
    cx: 360,
    cy: 900,
    labelSide: 'right',
    shapes: [
      'M250 650 C240 760 246 860 274 892 C318 886 338 762 340 652Z',
      'M470 650 C480 760 474 860 446 892 C402 886 382 762 380 652Z',
      'M256 900 C248 992 254 1118 284 1152 C322 1146 336 1008 334 902Z',
      'M464 900 C472 992 466 1118 436 1152 C398 1146 384 1008 386 902Z',
    ],
  },
  { id: 'skin', cx: 360, cy: 640, labelSide: 'left', shapes: [SKIN_BACK] },
];

function labelAnchor(hit: Hit): { x: number; y: number } {
  return hit.labelSide === 'left' ? { x: 16, y: hit.cy } : { x: W - 16, y: hit.cy };
}

export const AnatomicalFigure: React.FC<{
  side: 'front' | 'back';
  regionRank: Record<BodyRegionId, Rank>;
  selected: BodyRegionId | null;
  onSelect: (id: BodyRegionId) => void;
  pulse: BodyRegionId | null;
  auraRank: Rank;
  labelFor: (id: BodyRegionId) => string;
  hero?: boolean;
}> = ({ side, regionRank, selected, onSelect, pulse, auraRank, labelFor, hero = false }) => {
  const [hover, setHover] = useState<BodyRegionId | null>(null);
  useEffect(() => {
    setHover(null);
  }, [side]);
  const hits = side === 'front' ? FRONT_HITS : BACK_HITS;
  const src = side === 'front' ? 'body-front' : 'body-back';
  const ranked = useMemo(() => [...hits].sort((a, b) => (a.id === 'skin' ? -1 : b.id === 'skin' ? 1 : 0)), [hits]);
  const aura = AURA[auraRank];
  const gid = `atlas-${side}`;

  return (
    <div
      className={`relative mx-auto select-none overflow-visible bodymap-frost ${
        hero ? 'max-h-56 sm:max-h-80 lg:max-h-[26rem]' : 'max-h-72'
      }`}
      style={{
        aspectRatio: '9 / 16',
        width: hero ? 'min(100%, 16.5rem)' : 'min(100%, 13.5rem)',
        height: 'auto',
      }}
    >
      <div className="absolute inset-0 bg-[#f6f5f1]" aria-hidden />
      <picture>
        <source type="image/webp" srcSet={`/bodymap/${src}.webp`} />
        <img
          src={`/bodymap/${src}.jpg`}
          alt=""
          width={W}
          height={H}
          draggable={false}
          decoding="async"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
      </picture>

      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" role="img" aria-label={side}>
        <defs>
          <radialGradient id={`${gid}-aura`} cx="50%" cy="48%" r="54%">
            <stop offset="48%" stopColor={aura.inner} />
            <stop offset="100%" stopColor={aura.outer} />
          </radialGradient>
          <filter id={`${gid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse
          cx={360}
          cy={640}
          rx={248}
          ry={610}
          fill={`url(#${gid}-aura)`}
          style={{ mixBlendMode: 'multiply' }}
          className="pointer-events-none"
        />

        {ranked.map((hit) => {
          const rank = regionRank[hit.id] ?? 0;
          const active = selected === hit.id || hover === hit.id;
          const pulsing = pulse === hit.id;
          return (
            <g
              key={hit.id}
              className="cursor-pointer"
              onMouseEnter={() => setHover(hit.id)}
              onMouseLeave={() => setHover((h) => (h === hit.id ? null : h))}
              onClick={() => onSelect(hit.id)}
            >
              {hit.shapes.map((d, i) => (
                <path
                  key={`${hit.id}-${i}`}
                  d={d}
                  fill={TINT[rank]}
                  fillOpacity={hit.id === 'skin' ? (active ? 0.18 : 0.06) : active ? 0.58 : rank > 0 ? 0.38 : 0.26}
                  stroke={active ? RING[rank] : rank > 0 ? RING[rank] : 'transparent'}
                  strokeOpacity={active ? 1 : 0.35}
                  strokeWidth={active ? 3 : rank > 0 ? 1.2 : 0}
                  pointerEvents="visibleFill"
                  style={{ mixBlendMode: hit.id === 'skin' ? 'normal' : 'multiply' }}
                  filter={pulsing || rank === 2 ? `url(#${gid}-glow)` : undefined}
                />
              ))}
              {(active || pulsing) && hit.id !== 'skin' && (
                <g className="pointer-events-none">
                  <circle
                    cx={hit.cx}
                    cy={hit.cy}
                    r={pulsing ? 26 : 18}
                    fill="none"
                    stroke={RING[rank]}
                    strokeWidth="2"
                    className={pulsing ? 'atlas-ring' : ''}
                  />
                  <circle cx={hit.cx} cy={hit.cy} r={5} fill={RING[rank]} />
                </g>
              )}
            </g>
          );
        })}

        {hits
          .filter((hit) => hit.id !== 'skin')
          .map((hit) => {
            const rank = regionRank[hit.id] ?? 0;
            const active = selected === hit.id || hover === hit.id || pulse === hit.id;
            const dest = labelAnchor(hit);
            const midX = hit.labelSide === 'left' ? hit.cx - 78 : hit.cx + 78;
            return (
              <g key={`lead-${hit.id}`} className="pointer-events-none" opacity={active ? 1 : 0.32}>
                <path
                  d={`M${hit.cx} ${hit.cy} L${midX} ${hit.cy} L${dest.x} ${dest.y}`}
                  fill="none"
                  stroke={RING[rank]}
                  strokeWidth={active ? 1.6 : 0.8}
                  strokeLinejoin="miter"
                />
                <circle cx={dest.x} cy={dest.y} r={active ? 3.5 : 2} fill={RING[rank]} />
                <text
                  x={dest.x}
                  y={dest.y - 8}
                  textAnchor={hit.labelSide === 'left' ? 'start' : 'end'}
                  fill={active ? '#1c1b18' : '#6b6a66'}
                  fontSize={active ? 22 : 17}
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                  fontWeight={active ? 700 : 500}
                >
                  {labelFor(hit.id)}
                </text>
              </g>
            );
          })}
      </svg>

      <div className="atlas-scan pointer-events-none absolute left-[22%] right-[22%] top-0 h-px bg-sky-300/40" />

      {hover && (
        <div className="absolute right-2 top-2 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-stone-700 shadow-[var(--sm-shadow-soft)]">
          {labelFor(hover)}
        </div>
      )}
    </div>
  );
};
