import React, { useState } from 'react';
import { AuthUser } from '../types';
import { useI18n } from '../i18n/I18nProvider';
import {
  AppView,
  AskAuraOrb,
  AvatarMenu,
  GlossaryButton,
  LanguageGlobe,
  PageWordmark,
  PillDock,
  PinnedAlert,
  SimChip,
} from '../ui/chrome';

export type { AppView };

interface TopNavProps {
  envMetrics?: unknown;
  onOpenAiCall: () => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  onSwitchUser?: (user: AuthUser) => void;
  isRightPanelCollapsed?: boolean;
  onToggleRightPanel?: () => void;
  view?: AppView;
  onChangeView?: (view: AppView) => void;
  speDemo?: boolean;
  onToggleSpeDemo?: () => void;
  wordmark?: string;
  clockLabel?: string;
  onGoHome?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenAiCall,
  currentUser,
  onLogout,
  onSwitchUser,
  isRightPanelCollapsed = false,
  onToggleRightPanel,
  view = 'today',
  onChangeView,
  speDemo = false,
  onToggleSpeDemo,
  wordmark,
  clockLabel,
  onGoHome,
}) => {
  const { t } = useI18n();
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  return (
    <>
      <header className="relative shrink-0 px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <PageWordmark title={wordmark} onHome={onGoHome} />
          <span className="hidden sm:inline-flex">
            <SimChip />
          </span>
          {clockLabel && (
            <span
              title={t('glossary.met')}
              className="hidden xl:inline text-[11px] text-stone-500 font-sans tabular-nums tracking-tight truncate max-w-[22rem]"
            >
              {clockLabel}
            </span>
          )}
        </div>

        {onChangeView && currentUser && <PillDock role={currentUser.role} view={view} onChangeView={onChangeView} />}

        <div className="flex items-center gap-2 shrink-0">
          {currentUser?.role === 'Guest' && (
            <button
              type="button"
              onClick={onLogout}
              className="h-9 sm:h-10 px-3 sm:px-4 rounded-full bg-[var(--sm-cobalt)] text-white text-[11px] sm:text-xs font-semibold shrink-0"
            >
              {t('nav.signIn')}
            </button>
          )}
          <GlossaryButton open={glossaryOpen} onOpenChange={setGlossaryOpen} />
          <LanguageGlobe />
          {currentUser && (
            <AvatarMenu
              user={currentUser}
              onLogout={onLogout}
              onSwitchUser={onSwitchUser ?? (() => undefined)}
              speDemo={speDemo}
              onToggleSpeDemo={currentUser.role === 'Guest' ? undefined : onToggleSpeDemo}
              isRightPanelCollapsed={isRightPanelCollapsed}
              onToggleRightPanel={currentUser.role === 'Guest' ? undefined : onToggleRightPanel}
              onOpenGlossary={() => setGlossaryOpen(true)}
            />
          )}
        </div>
      </header>
      {speDemo && currentUser?.role !== 'Guest' && (
        <PinnedAlert
          title={t('ui.spePin')}
          actionLabel={t('ui.review')}
          onAction={onOpenAiCall}
        />
      )}
      {currentUser && currentUser.role !== 'Guest' && view !== 'sim' && <AskAuraOrb onClick={onOpenAiCall} />}
    </>
  );
};
