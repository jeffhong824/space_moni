import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, Globe2, HeartPulse, LogOut, Star, UserRound, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { LANGUAGES } from '../i18n/registry';
import { allDemoAccounts } from '../world/accounts';
import type { AuthUser } from '../types';
import { taipeiHour } from '../world/worldState';

export type AppView = 'home' | 'console' | 'sources' | 'hq';

const LANG_SHORT: Record<string, string> = {
  en: 'EN',
  'zh-Hant-TW': '繁',
  es: 'ES',
  ja: 'JA',
};

export type RankTone = 'ok' | 'warn' | 'crit' | 'lilac' | 'info';

export const TONE_HEX: Record<RankTone, string> = {
  ok: '#7ddfc3',
  warn: '#f3b184',
  crit: '#f08a80',
  lilac: '#c4b5fd',
  info: '#2b3bff',
};

export function toneFromRank(status?: string): RankTone {
  if (!status) return 'info';
  if (status === 'Critical' || status === 'Severe' || status === 'unavailable' || status === '危急' || status === '危険' || status === 'Crítico')
    return 'crit';
  if (
    status === 'Attention' ||
    status === 'Attention Required' ||
    status === 'Caution' ||
    status === 'High' ||
    status === 'Moderate' ||
    status === 'partial' ||
    status === 'Elevated' ||
    status === '注意' ||
    status === 'Precaución'
  )
    return 'warn';
  if (status === 'Nominal' || status === 'Normal' || status === 'Low' || status === 'ok' || status === '正常') return 'ok';
  return 'info';
}

export function greetingKey(nowMs: number = Date.now()): 'ui.goodMorning' | 'ui.goodAfternoon' | 'ui.goodEvening' {
  const h = Math.floor(taipeiHour(nowMs));
  if (h < 12) return 'ui.goodMorning';
  if (h < 18) return 'ui.goodAfternoon';
  return 'ui.goodEvening';
}

export function firstName(name: string): string {
  return name.split(/\s+/)[0] || name;
}

export function initials(name: string, seed?: string): string {
  const fromSeed = (seed ?? '').replace(/[^A-Za-z]/g, '').toUpperCase();
  if (fromSeed.length >= 2) return fromSeed.slice(0, 2);
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return (letters || '??').slice(0, 2);
}

const BUBBLE = ['#2b3bff', '#1c1b18', '#0f9f8a', '#c45c2a', '#6d4fd6', '#c43c3c', '#3d4fd8', '#4a6a1f'];

export function avatarTone(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return BUBBLE[h % BUBBLE.length];
}

export function AvatarBubble({
  name,
  seed,
  id,
  size = 36,
  className = '',
}: {
  name: string;
  seed?: string;
  id?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0 leading-none ${className}`}
      style={{
        width: size,
        height: size,
        background: avatarTone(id || name),
        fontSize: Math.max(10, size * 0.34),
      }}
      aria-hidden
    >
      {initials(name, seed)}
    </span>
  );
}

export function formatDelay(sec: number, t: (k: string, v?: Record<string, string | number>) => string): string {
  if (sec >= 60) return t('ui.lightDelay', { n: Math.round(sec / 60) });
  return t('ui.lightDelaySec', { n: Math.round(sec) });
}

export function DelayCaption({ sec, className = '' }: { sec: number; className?: string }) {
  const { t } = useI18n();
  const minutes = sec >= 60;
  const n = minutes ? Math.round(sec / 60) : Math.round(sec);
  return (
    <span className={`inline-flex items-baseline gap-1.5 font-sans ${className}`}>
      <span className="text-4xl font-semibold tabular-nums tracking-tight">{n}</span>
      <span className="text-lg font-medium text-stone-500 tabular-nums">{minutes ? t('ui.minUnit') : t('ui.secUnit')}</span>
      <span className="text-base font-medium text-stone-500">{t('ui.delayCaption')}</span>
    </span>
  );
}

export const SimChip: React.FC<{ live?: boolean; className?: string }> = ({ live = false, className = '' }) => {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold tracking-wide rounded-full ${
        live ? 'bg-emerald-50 text-emerald-800' : 'bg-white/80 text-stone-500'
      } ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-emerald-500' : 'bg-stone-400'}`} />
      {live ? t('ui.liveChip') : t('common.simulation')}
    </span>
  );
};

export const StatusDot: React.FC<{ tone?: RankTone; label?: string; className?: string }> = ({
  tone = 'ok',
  label,
  className = '',
}) => (
  <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-600 ${className}`}>
    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TONE_HEX[tone] }} />
    {label}
  </span>
);

export function RingGauge({
  value,
  max,
  label,
  unit,
  tone = 'ok',
  size = 92,
}: {
  value: number;
  max: number;
  label: string;
  unit: string;
  tone?: RankTone;
  size?: number;
}) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const dash = `${c * pct} ${c}`;
  const color = TONE_HEX[tone];
  return (
    <div className="sm-orb flex items-center gap-3" style={{ minWidth: size + 64 }}>
      <svg width={size} height={size} viewBox="0 0 88 88" className="shrink-0" aria-hidden>
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(28,27,24,0.08)" strokeWidth="7" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={dash}
          transform="rotate(-90 44 44)"
        />
      </svg>
      <div className="min-w-0">
        <p className="text-[11px] text-stone-500">{label}</p>
        <p className="text-2xl font-semibold tabular-nums leading-tight">
          {Number.isFinite(value) ? value : '—'}
          <span className="ml-1 text-xs font-medium text-stone-400">{unit}</span>
        </p>
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
  ariaLabel?: string;
}) {
  const lid = useId();
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="relative inline-flex items-center gap-0.5 p-1 rounded-full bg-white/80 shadow-[inset_0_0_0_1px_rgba(28,27,24,0.04)]"
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`relative z-10 px-3.5 py-1.5 text-[12px] font-semibold rounded-full transition-colors ${
              active ? 'text-white' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {active && (
              <motion.span
                layoutId={lid}
                className="absolute inset-0 rounded-full bg-[var(--sm-cobalt)]"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export const Sheet: React.FC<{
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}> = ({ open, onClose, title, children, wide }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex justify-end" role="presentation">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 sm-scrim"
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            initial={{ x: 28, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className={`relative h-full ${wide ? 'w-full max-w-[38.75rem]' : 'w-full max-w-md'} sm-sheet-panel rounded-l-[32px] p-5 overflow-y-auto`}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">{title}</div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-stone-500 shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {children}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};

export const LanguageGlobe: React.FC<{ variant?: 'light' | 'dark' }> = ({ variant = 'light' }) => {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.id === lang) ?? LANGUAGES[0];
  const dark = variant === 'dark';
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t('lang.label')}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`h-10 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold ${
          dark ? 'bg-white/15 text-white' : 'bg-white text-stone-700 shadow-[var(--sm-shadow-soft)]'
        }`}
      >
        <Globe2 className="w-4 h-4" />
        <span>{LANG_SHORT[current.id] ?? current.id.slice(0, 2).toUpperCase()}</span>
      </button>
      {open && (
        <ul className="absolute right-0 mt-2 z-50 min-w-[10rem] p-1.5 rounded-3xl bg-white shadow-[var(--sm-shadow)]">
          {LANGUAGES.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => {
                  setLang(l.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-2xl text-sm ${
                  l.id === lang ? 'bg-[var(--sm-cobalt)] text-white' : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                {l.nativeName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const AvatarMenu: React.FC<{
  user: AuthUser;
  onLogout: () => void;
  onSwitchUser: (user: AuthUser) => void;
  speDemo?: boolean;
  onToggleSpeDemo?: () => void;
  isRightPanelCollapsed?: boolean;
  onToggleRightPanel?: () => void;
}> = ({ user, onLogout, onSwitchUser, speDemo, onToggleSpeDemo, isRightPanelCollapsed, onToggleRightPanel }) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const roleLabel =
    user.role === 'NASA' ? t('role.nasa') : user.role === 'Commander' ? t('role.commander') : t('role.astronaut');
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t('nav.loggedIn', { name: user.name, role: roleLabel })}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          setSwitchOpen(false);
        }}
        className="w-10 h-10 rounded-full bg-white shadow-[var(--sm-shadow-soft)] flex items-center justify-center text-stone-800 font-semibold text-xs"
      >
        {initials(user.name)}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 z-50 w-64 p-2 rounded-[28px] bg-white shadow-[var(--sm-shadow)]">
          <div className="px-3 py-2">
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-[11px] text-stone-500">{roleLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => setSwitchOpen((v) => !v)}
            className="w-full text-left px-3 py-2 rounded-2xl text-sm text-stone-700 hover:bg-stone-50"
          >
            {t('ui.accountSwitch')}
          </button>
          {switchOpen && (
            <ul className="max-h-48 overflow-y-auto px-1 pb-1">
              {allDemoAccounts().map((a) => (
                <li key={a.account}>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchUser(a);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-2xl text-[12px] ${
                      a.account === user.account ? 'bg-stone-100 font-semibold' : 'hover:bg-stone-50'
                    }`}
                  >
                    {a.name}
                    <span className="block text-[10px] text-stone-400 font-normal">{a.account}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {onToggleSpeDemo && (
            <button
              type="button"
              onClick={onToggleSpeDemo}
              className="w-full text-left px-3 py-2 rounded-2xl text-sm text-stone-700 hover:bg-stone-50"
            >
              {speDemo ? t('nav.speOn') : t('nav.speOff')}
            </button>
          )}
          {onToggleRightPanel && (
            <button
              type="button"
              onClick={onToggleRightPanel}
              className="w-full text-left px-3 py-2 rounded-2xl text-sm text-stone-700 hover:bg-stone-50"
            >
              {isRightPanelCollapsed ? t('nav.showTasks') : t('nav.hideTasks')}
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="w-full text-left px-3 py-2 rounded-2xl text-sm text-stone-700 hover:bg-stone-50 flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t('nav.logout')}
          </button>
        </div>
      )}
    </div>
  );
};

export const PillDock: React.FC<{
  role: AuthUser['role'];
  view: AppView;
  onChangeView: (v: AppView) => void;
}> = ({ role, view, onChangeView }) => {
  const { t } = useI18n();
  const items: { id: string; label: string; icon: React.ReactNode; action: () => void; active: boolean }[] = [
    {
      id: 'today',
      label: t('nav.today'),
      icon: <span className="text-[11px] font-semibold">{t('nav.today')}</span>,
      action: () => onChangeView(role === 'NASA' ? 'hq' : 'home'),
      active: role === 'NASA' ? view === 'hq' : view === 'home',
    },
    {
      id: 'console',
      label: t('nav.console'),
      icon: <HeartPulse className="w-4 h-4" />,
      action: () => onChangeView('console'),
      active: view === 'console',
    },
    {
      id: 'people',
      label: role === 'NASA' ? t('nav.homeNasa') : role === 'Commander' ? t('nav.homeCommander') : t('nav.homeAstronaut'),
      icon: <UserRound className="w-4 h-4" />,
      action: () => onChangeView('home'),
      active: false,
    },
    {
      id: 'sources',
      label: t('nav.sources'),
      icon: <BookOpen className="w-4 h-4" />,
      action: () => onChangeView('sources'),
      active: view === 'sources',
    },
    {
      id: 'sim',
      label: t('nav.sim'),
      icon: <Star className="w-4 h-4" />,
      action: () => {
        window.history.pushState({}, '', '/sim');
        window.dispatchEvent(new PopStateEvent('popstate'));
      },
      active: false,
    },
  ];

  if (role === 'NASA') {
    items[0].active = view === 'hq';
    items[2].active = view === 'home';
  } else {
    items[0].active = view === 'home';
    items[2].active = false;
  }

  return (
    <nav
      aria-label="Primary"
      className="fixed md:absolute z-40 left-1/2 -translate-x-1/2 bottom-3 md:bottom-auto md:top-3 flex items-center gap-1 p-1.5 rounded-full bg-white/85 backdrop-blur-xl shadow-[var(--sm-shadow)]"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-label={item.label}
          aria-current={item.active ? 'page' : undefined}
          onClick={item.action}
          className={`relative h-10 min-w-10 px-3 rounded-full flex items-center justify-center text-sm ${
            item.active ? 'text-white' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          {item.active && (
            <motion.span
              layoutId="dock-pill"
              className="absolute inset-0 rounded-full bg-[var(--sm-cobalt)]"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1">{item.icon}</span>
        </button>
      ))}
    </nav>
  );
};

export const AskAuraOrb: React.FC<{ onClick: () => void; label?: string }> = ({ onClick, label }) => {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? t('ui.askAura')}
      className="fixed z-30 right-4 bottom-[5.75rem] md:right-5 md:bottom-6 inline-flex items-center gap-3 pl-3 sm:pl-5 pr-2 py-2 rounded-full bg-white/90 shadow-[var(--sm-shadow)] text-stone-800"
    >
      <span className="hidden sm:inline font-display text-lg italic">{label ?? t('ui.askAura')}</span>
      <span className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-200 via-violet-200 to-fuchsia-200 shadow-inner" />
    </button>
  );
};

export const PinnedAlert: React.FC<{
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, body, actionLabel, onAction }) => (
  <div className="mx-auto max-w-3xl px-4 pt-2">
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/90 shadow-[var(--sm-shadow-soft)]">
      <span className="w-2.5 h-2.5 rounded-full bg-[var(--sm-lilac)] shrink-0" />
      <p className="text-[12px] text-stone-700 flex-1 min-w-0 truncate">
        {title}
        {body ? ` — ${body}` : ''}
      </p>
      {onAction && actionLabel && (
        <button type="button" onClick={onAction} className="text-[12px] font-semibold text-[var(--sm-cobalt)] shrink-0">
          {actionLabel} →
        </button>
      )}
    </div>
  </div>
);

export function WaveScrubber({
  points,
  onAsk,
}: {
  points: { hour: string; hr: number; spo2: number; hrv?: number; spike?: boolean; note?: string }[];
  onAsk?: (hour: string) => void;
}) {
  const { t } = useI18n();
  const wrap = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(() => {
    const spike = points.findIndex((p) => p.spike);
    return spike >= 0 ? spike : Math.floor(points.length / 2);
  });
  const dragging = useRef(false);
  const uid = useId();

  const setFromClientX = (clientX: number) => {
    const el = wrap.current;
    if (!el || points.length === 0) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setIdx(Math.round(x * (points.length - 1)));
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (dragging.current) setFromClientX(e.clientX);
    };
    const up = () => {
      dragging.current = false;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [points.length]);

  if (points.length === 0) return null;
  const w = 640;
  const h = 160;
  const maxHr = Math.max(140, ...points.map((p) => p.hr));
  const minHr = Math.min(50, ...points.map((p) => p.hr));
  const xy = (i: number) => {
    const x = (i / Math.max(1, points.length - 1)) * w;
    const y = h - ((points[i].hr - minHr) / (maxHr - minHr)) * (h - 24) - 8;
    return [x, y] as const;
  };
  const d = points
    .map((_, i) => {
      const [x, y] = xy(i);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  const pt = points[idx];
  const [cx, cy] = xy(idx);

  return (
    <div className="relative">
      <div
        ref={wrap}
        className="relative h-32 cursor-ew-resize select-none"
        onPointerDown={(e) => {
          dragging.current = true;
          setFromClientX(e.clientX);
        }}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={points.length - 1}
        aria-valuenow={idx}
        aria-label={t('records.hr')}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setIdx((n) => Math.max(0, n - 1));
          if (e.key === 'ArrowRight') setIdx((n) => Math.min(points.length - 1, n + 1));
        }}
      >
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id={`${uid}-wave`} x1="0" x2="1">
              <stop offset="0%" stopColor="#7ddfc3" />
              <stop offset="55%" stopColor="#9ee0c8" />
              <stop offset="100%" stopColor="#c4b5fd" />
            </linearGradient>
          </defs>
          <path d={d} fill="none" stroke={`url(#${uid}-wave)`} strokeWidth="10" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r="14" fill="white" stroke="#7ddfc3" strokeWidth="6" />
        </svg>
        <div
          className="absolute -translate-x-1/2 -translate-y-full rounded-full bg-white px-3 py-1 text-[11px] font-semibold shadow-[var(--sm-shadow-soft)]"
          style={{ left: `${(idx / Math.max(1, points.length - 1)) * 100}%`, top: `${(cy / h) * 100}%` }}
        >
          {pt.hour} · {pt.hr} bpm
        </div>
      </div>
      {pt.spike && onAsk && (
        <button type="button" onClick={() => onAsk(pt.hour)} className="mt-2 text-[11px] font-semibold text-[var(--sm-cobalt)]">
          {t('ui.askAuraToday')}
        </button>
      )}
    </div>
  );
}

export function FilterChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium shrink-0 ${
        active ? 'bg-white shadow-[var(--sm-shadow-soft)] text-stone-800' : 'text-stone-500 hover:text-stone-800'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export const AuraOrbMark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-block w-8 h-8 rounded-full bg-gradient-to-br from-sky-200 via-violet-200 to-fuchsia-200 ${className}`} />
);

export const IconCircle: React.FC<{
  active?: boolean;
  onClick?: () => void;
  label: string;
  children: React.ReactNode;
}> = ({ active, onClick, label, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    aria-label={label}
    className={`w-[4.5rem] flex flex-col items-center gap-2`}
  >
    <span
      className={`w-14 h-14 rounded-full flex items-center justify-center transition-shadow ${
        active ? 'ring-[3px] ring-[var(--sm-cobalt)] bg-white shadow-[var(--sm-shadow)]' : 'bg-white/70 text-stone-500'
      }`}
    >
      {children}
    </span>
    <span className="text-[12px] text-stone-600">{label}</span>
  </button>
);

export const PageWordmark: React.FC<{ title?: string }> = ({ title }) => {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2 min-w-0">
      <h1 className="font-display text-[1.35rem] sm:text-xl text-stone-900 truncate">{title ?? t('app.title')}</h1>
    </div>
  );
};

