import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, BookText, ClipboardList, Globe2, HeartPulse, LayoutGrid, LogOut, Orbit, UserRound, Users, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { LANGUAGES } from '../i18n/registry';
import { allDemoAccounts } from '../world/accounts';
import type { AuthUser } from '../types';
import { taipeiHour } from '../world/worldState';
import { dockItemsForRole, type AppView } from '../app/routing';
import { bindEscapeClose, bindOutsidePointerClose } from './escapeClose';

export type { AppView };

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

export function avatarFontSize(size: number): number {
  return Math.max(11, size * 0.38);
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
        fontSize: avatarFontSize(size),
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
      className="relative inline-flex flex-wrap items-center gap-0.5 p-1 rounded-full bg-white/80 shadow-[inset_0_0_0_1px_rgba(28,27,24,0.04)] max-w-full"
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
            className={`relative z-10 px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-[12px] font-semibold rounded-full transition-colors whitespace-normal leading-tight text-center ${
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
  from?: 'right' | 'bottom';
}> = ({ open, onClose, title, children, wide, from = 'right' }) => {
  const { t } = useI18n();
  const bottom = from === 'bottom';
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
        <div className={`fixed inset-0 z-[80] flex ${bottom ? 'items-end justify-center' : 'justify-end'}`} role="presentation">
          <button
            type="button"
            aria-label={t('common.close')}
            title={t('common.close')}
            className="absolute inset-0 sm-scrim"
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            initial={bottom ? { y: 36, opacity: 0 } : { x: 28, opacity: 0 }}
            animate={bottom ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
            exit={bottom ? { y: 28, opacity: 0 } : { x: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className={`relative ${
              bottom
                ? 'w-full max-h-[min(78dvh,40rem)] rounded-t-[32px] pb-8'
                : `h-full ${wide ? 'w-full max-w-[38.75rem]' : 'w-full max-w-md'} rounded-l-[32px] pb-36`
            } sm-sheet-panel p-5 overflow-y-auto sm-page-pad`}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">{title}</div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-stone-500 shrink-0"
                aria-label={t('common.close')}
                title={t('common.close')}
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
        className={`h-9 w-9 sm:h-10 sm:w-auto sm:px-3 rounded-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold shrink-0 ${
          dark ? 'bg-white/15 text-white' : 'bg-white text-stone-700 shadow-[var(--sm-shadow-soft)]'
        }`}
      >
        <Globe2 className="w-4 h-4" />
        <span className="hidden sm:inline">{LANG_SHORT[current.id] ?? current.id.slice(0, 2).toUpperCase()}</span>
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
  onOpenGlossary?: () => void;
}> = ({ user, onLogout, onSwitchUser, speDemo, onToggleSpeDemo, isRightPanelCollapsed, onToggleRightPanel, onOpenGlossary }) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [speAsk, setSpeAsk] = useState(false);
  const roleLabel =
    user.role === 'NASA'
      ? t('role.nasa')
      : user.role === 'Commander'
        ? t('role.commander')
        : user.role === 'Guest'
          ? t('role.guest')
          : t('role.astronaut');
  const guest = user.role === 'Guest';
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
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white shadow-[var(--sm-shadow-soft)] flex items-center justify-center text-stone-800 font-semibold text-[11px] shrink-0"
      >
        {initials(user.name)}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 z-50 w-64 p-2 rounded-[28px] bg-white shadow-[var(--sm-shadow)]">
          <div className="px-3 py-2">
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-[11px] text-stone-500">{roleLabel}</p>
            <p className="mt-1 inline-flex px-2 py-0.5 rounded-full bg-violet-50 text-[10px] font-semibold text-violet-800">
              {guest ? t('common.simulation') : t('nav.demoSession')}
            </p>
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
          {onToggleSpeDemo && !guest && (
            <button
              type="button"
              title={t('nav.speTitle')}
              onClick={() => {
                if (speDemo) {
                  onToggleSpeDemo();
                  setOpen(false);
                } else {
                  setSpeAsk(true);
                  setOpen(false);
                }
              }}
              className="w-full text-left px-3 py-2 rounded-2xl text-sm text-stone-700 hover:bg-stone-50"
            >
              {speDemo ? t('nav.speStop') : t('nav.speSimulate')}
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
          {onOpenGlossary && (
            <button
              type="button"
              data-avatar-glossary
              onClick={() => {
                setOpen(false);
                onOpenGlossary();
              }}
              className="w-full text-left px-3 py-2 rounded-2xl text-sm text-stone-700 hover:bg-stone-50 flex items-center gap-2"
            >
              <BookText className="w-3.5 h-3.5" />
              {t('nav.glossary')}
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="w-full text-left px-3 py-2 rounded-2xl text-sm text-stone-700 hover:bg-stone-50 flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            {guest ? t('nav.signIn') : t('nav.logout')}
          </button>
        </div>
      )}
      <OverlayDialog
        open={speAsk}
        onClose={() => setSpeAsk(false)}
        titleId="spe-confirm-title"
        title={<h2 id="spe-confirm-title" className="font-display text-2xl">{t('nav.speConfirmTitle')}</h2>}
      >
        <p className="text-sm text-stone-600">{t('nav.speTitle')}</p>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              onToggleSpeDemo?.();
              setSpeAsk(false);
            }}
            className="flex-1 h-11 rounded-full bg-[var(--sm-cobalt)] text-white text-sm font-semibold"
          >
            {t('nav.speConfirm')}
          </button>
          <button
            type="button"
            onClick={() => setSpeAsk(false)}
            className="flex-1 h-11 rounded-full bg-stone-100 text-sm font-semibold"
          >
            {t('common.cancel')}
          </button>
        </div>
      </OverlayDialog>
    </div>
  );
};

export const PillDock: React.FC<{
  role: AuthUser['role'];
  view: AppView;
  onChangeView: (v: AppView) => void;
}> = ({ role, view, onChangeView }) => {
  const { t } = useI18n();
  const items = dockItemsForRole(role);

  return (
    <nav
      aria-label="Primary"
      className="fixed z-40 left-3 right-3 bottom-[max(0.5rem,env(safe-area-inset-bottom))] lg:left-1/2 lg:right-auto lg:translate-x-[-50%] lg:bottom-auto lg:top-3 flex items-stretch lg:items-center justify-around lg:justify-center gap-0.5 p-1.5 rounded-[28px] lg:rounded-full bg-white/90 backdrop-blur-xl shadow-[var(--sm-shadow)] max-w-[calc(100%-1.5rem)] lg:max-w-[min(42rem,calc(100vw-11rem))]"
    >
      {items.map((item) => {
        const label = t(item.labelKey);
        const short = t(item.shortKey);
        const active = item.view === view;
        return (
          <button
            key={item.id}
            type="button"
            data-dock={item.id}
            title={label}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            onClick={() => onChangeView(item.view)}
            className={`relative min-w-0 flex-1 lg:flex-none shrink-0 h-12 lg:h-10 px-1.5 lg:px-2.5 rounded-[22px] lg:rounded-full flex flex-col lg:flex-row items-center justify-center gap-0.5 lg:gap-1.5 text-sm ${
              active ? 'text-white' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {active && (
              <motion.span
                layoutId="dock-pill"
                className="absolute inset-0 rounded-[22px] lg:rounded-full bg-[var(--sm-cobalt)]"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10 flex flex-col lg:flex-row items-center gap-0.5 lg:gap-1 min-w-0">
              {DOCK_ICON[item.id]}
              <span className="text-[10px] lg:text-[11px] font-semibold leading-tight whitespace-nowrap">
                {short}
              </span>
            </span>
          </button>
        );
      })}
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
      className="sm-ask-aura fixed z-30 right-3 bottom-[7.25rem] lg:right-5 lg:bottom-6 inline-flex items-center gap-3 pl-3 sm:pl-5 pr-2 py-2 rounded-full bg-white/90 shadow-[var(--sm-shadow)] text-stone-800"
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
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium shrink-0 whitespace-nowrap ${
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

export const PageWordmark: React.FC<{ title?: string; onHome?: () => void }> = ({ title, onHome }) => {
  const { t } = useI18n();
  const label = title ?? t('app.title');
  if (onHome) {
    return (
      <button
        type="button"
        onClick={onHome}
        title={t('nav.homeLink')}
        aria-label={t('nav.homeLink')}
        className="flex items-center gap-2 shrink-0 text-left"
      >
        <h1 data-wordmark className="font-display text-[1.2rem] sm:text-xl text-stone-900 whitespace-nowrap">{label}</h1>
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2 shrink-0">
      <h1 data-wordmark className="font-display text-[1.2rem] sm:text-xl text-stone-900 whitespace-nowrap">{label}</h1>
    </div>
  );
};

const DOCK_ICON: Record<string, React.ReactNode> = {
  today: <HeartPulse className="w-4 h-4" />,
  day: <ClipboardList className="w-4 h-4" />,
  body: <UserRound className="w-4 h-4" />,
  crew: <Users className="w-4 h-4" />,
  ops: <HeartPulse className="w-4 h-4" />,
  hq: <LayoutGrid className="w-4 h-4" />,
  cases: <ClipboardList className="w-4 h-4" />,
  sources: <BookOpen className="w-4 h-4" />,
  sim: <Orbit className="w-4 h-4" />,
};

const GLOSSARY_KEYS = [
  'met',
  'spe',
  'kp',
  'gScale',
  'sScale',
  'rScale',
  'ared',
  'cevis',
  't2',
  'eclss',
  'donki',
  'msv',
  'hrv',
  'spo2',
  'sans',
  'pvt',
  'ppco2',
  'ppo2',
  'bmd',
  'bhp',
  'orthostatic',
  'logmar',
  'careerDose',
] as const;

export const GlossaryPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useI18n();
  return (
    <>
      <button
        type="button"
        className="sm:hidden fixed inset-0 z-40 sm-scrim"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('nav.glossaryTitle')}
        data-escape-close="glossary"
        data-glossary-panel
        className="fixed z-50 left-3 right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] max-h-[min(70vh,32rem)] w-auto max-w-[calc(100vw-24px)] overflow-y-auto p-3 rounded-[24px] bg-white shadow-[var(--sm-shadow)] text-[12px] leading-snug space-y-2 sm:absolute sm:inset-auto sm:left-auto sm:right-0 sm:bottom-auto sm:mt-2 sm:w-80"
      >
        <div className="flex items-start justify-between gap-2 px-1">
          <p className="font-semibold text-sm">{t('nav.glossaryTitle')}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            title={t('common.close')}
            className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-500 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {GLOSSARY_KEYS.map((k) => (
          <p key={k} className="px-1 text-stone-600">
            {t(`glossary.${k}`)}
          </p>
        ))}
      </div>
    </>
  );
};

export const GlossaryButton: React.FC<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}> = ({ open: openProp, onOpenChange }) => {
  const { t } = useI18n();
  const [uncontrolled, setUncontrolled] = useState(false);
  const open = openProp ?? uncontrolled;
  const setOpen = useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (openProp === undefined) setUncontrolled(next);
    },
    [onOpenChange, openProp]
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), [setOpen]);
  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);

  useEffect(() => {
    if (!open) return;
    return bindEscapeClose(window, close);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    return bindOutsidePointerClose(rootRef.current, document, close);
  }, [open, close]);

  return (
    <div className="relative" ref={rootRef} data-glossary-root>
      <button
        type="button"
        data-glossary-mobile
        title={t('nav.glossaryTitle')}
        aria-expanded={open}
        aria-label={t('nav.glossary')}
        onClick={toggle}
        className="inline-flex sm:hidden w-9 h-9 rounded-full bg-white/80 items-center justify-center text-stone-600 hover:text-stone-800"
      >
        <BookText className="w-4 h-4" />
      </button>
      <button
        type="button"
        data-glossary-desktop
        title={t('nav.glossaryTitle')}
        aria-expanded={open}
        aria-label={t('nav.glossary')}
        onClick={toggle}
        className="hidden sm:inline-flex h-8 px-2.5 rounded-full bg-white/80 text-[11px] font-semibold text-stone-500 hover:text-stone-800"
      >
        {t('nav.glossary')}
      </button>
      {open && <GlossaryPanel onClose={close} />}
    </div>
  );
};

export function OverlayDialog({
  open,
  onClose,
  title,
  titleId,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  titleId: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const focusables = () => {
      const root = panelRef.current;
      if (!root) return [] as HTMLElement[];
      return [
        ...root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ),
      ].filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
    };
    const id = window.setTimeout(() => (closeRef.current ?? focusables()[0])?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const list = focusables();
      if (list.length === 0) return;
      const i = list.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey) {
        if (i <= 0) {
          e.preventDefault();
          list[list.length - 1]?.focus();
        }
      } else if (i === list.length - 1 || i === -1) {
        e.preventDefault();
        list[0]?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="presentation">
      <button type="button" className="absolute inset-0 sm-scrim" aria-label={t('common.close')} onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-lg rounded-[32px] bg-white p-6 shadow-[var(--sm-shadow)] space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">{title}</div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            title={t('common.close')}
            className="w-9 h-9 rounded-full bg-stone-50 flex items-center justify-center text-stone-500 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

