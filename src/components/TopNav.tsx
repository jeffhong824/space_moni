import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Radio, Satellite, HeartPulse, LogOut, User, Shield, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { EnvironmentalMetrics, AuthUser } from '../types';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useI18n } from '../i18n/I18nProvider';

export type AppView = 'home' | 'console' | 'sources' | 'hq';

interface TopNavProps {
  envMetrics: EnvironmentalMetrics;
  onOpenAiCall: () => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  isRightPanelCollapsed?: boolean;
  onToggleRightPanel?: () => void;
  view?: AppView;
  onChangeView?: (view: AppView) => void;
  speDemo?: boolean;
  onToggleSpeDemo?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  envMetrics,
  onOpenAiCall,
  currentUser,
  onLogout,
  isRightPanelCollapsed = false,
  onToggleRightPanel,
  view = 'home',
  onChangeView,
  speDemo = false,
  onToggleSpeDemo,
}) => {
  const { t } = useI18n();
  const [utcTime, setUtcTime] = useState<string>('');
  const [metString, setMetString] = useState<string>('T+289D:01H:00M');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');

      // Calculate MET from mission launch date 2026/01/21
      const launch = new Date(Date.UTC(2026, 0, 21, 0, 0, 0));
      const diffMs = Math.max(0, now.getTime() - launch.getTime());
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      setMetString(`T+${days}D:${hours}H:${mins}M`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'NASA':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Commander':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-sky-100 text-sky-800 border-sky-300';
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 lg:gap-8 shrink-0 select-none">
      {/* Zone 1: Single text element wordmark with clean icon */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shadow-2xs">
          <Satellite className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-slate-900 leading-tight">
            SpaceMoni
          </span>
          <span className="text-[11px] font-mono text-slate-500 tracking-wide hidden sm:inline">
            {t('app.tagline')}
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation & Telemetry Readouts */}
      <div className="hidden lg:flex items-center gap-6 text-xs text-slate-600 font-mono">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200/60 rounded-md">
          <span className="text-slate-400">MET:</span>
          <span className="font-semibold text-slate-800 tabular-nums">{metString}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">{t('nav.stationTime')}：</span>
          <span className="font-semibold text-slate-800 tabular-nums">{utcTime || '07:45:00 UTC'}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('nav.eclssDemo')}</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>{t('nav.orbitLeo')}</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>{t('nav.speed')}</span>
        </div>
      </div>

      {onChangeView && currentUser && (
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
          {(
            [
              ...(currentUser.role === 'NASA' ? [['hq', t('nav.hq')] as [AppView, string]] : []),
              [
                'home',
                currentUser.role === 'NASA'
                  ? t('nav.homeNasa')
                  : currentUser.role === 'Commander'
                    ? t('nav.homeCommander')
                    : t('nav.homeAstronaut'),
              ],
              ['console', t('nav.console')],
              ['sources', t('nav.sources')],
            ] as Array<[AppView, string]>
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onChangeView(id)}
              className={`px-2.5 py-1 rounded-lg border ${
                view === id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      )}

      {/* Zone 3: User Info, Primary Action & Logout */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {onToggleSpeDemo && (
          <button
            type="button"
            onClick={onToggleSpeDemo}
            className={`hidden sm:flex items-center px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border ${
              speDemo ? 'bg-amber-100 text-amber-950 border-amber-400' : 'bg-white text-slate-600 border-slate-200'
            }`}
            title={t('nav.speTitle')}
          >
            {speDemo ? t('nav.speOn') : t('nav.speOff')}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            window.history.pushState({}, '', '/sim');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="hidden sm:flex items-center px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-slate-200 bg-white text-slate-700"
        >
          {t('nav.sim')}
        </button>
        <LanguageSwitcher />
        {currentUser && (
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getRoleBadge(currentUser.role)}`}>
              {currentUser.role === 'NASA' ? t('role.nasa') : currentUser.role === 'Commander' ? t('role.commander') : t('role.astronaut')}
            </span>
            <span className="font-semibold text-slate-800 max-w-[120px] truncate hidden sm:inline">
              {currentUser.name}
            </span>
          </div>
        )}

        {onToggleRightPanel && (
          <button
            onClick={onToggleRightPanel}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all shadow-2xs active:scale-98 cursor-pointer ${
              isRightPanelCollapsed
                ? 'bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-300'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
            aria-pressed={!isRightPanelCollapsed}
            title={isRightPanelCollapsed ? t('nav.showTitle') : t('nav.hideTitle')}
          >
            {isRightPanelCollapsed ? (
              <>
                <PanelRightOpen className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden md:inline">{t('nav.showTasks')}</span>
              </>
            ) : (
              <>
                <PanelRightClose className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden md:inline">{t('nav.hideTasks')}</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={onOpenAiCall}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-sky-900 bg-sky-100 hover:bg-sky-200 border border-sky-300/80 rounded-lg transition-all shadow-2xs active:scale-98 cursor-pointer"
          title={t('nav.aiTitle')}
        >
          <Radio className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
          <span className="hidden sm:inline">{t('nav.aiSurgeon')}</span>
        </button>

        <button
          onClick={onLogout}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          title={t('nav.logoutTitle')}
        >
          <LogOut className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">{t('nav.logout')}</span>
        </button>
      </div>
    </header>
  );
};
