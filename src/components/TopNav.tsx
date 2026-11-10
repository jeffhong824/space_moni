import React from 'react';
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

  return (
    <>
      <header className="relative shrink-0 px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <PageWordmark title={wordmark} onHome={onGoHome} />
          <SimChip />
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
          <GlossaryButton />
          <LanguageGlobe />
          {currentUser && (
            <AvatarMenu
              user={currentUser}
              onLogout={onLogout}
              onSwitchUser={onSwitchUser ?? (() => undefined)}
              speDemo={speDemo}
              onToggleSpeDemo={onToggleSpeDemo}
              isRightPanelCollapsed={isRightPanelCollapsed}
              onToggleRightPanel={onToggleRightPanel}
            />
          )}
        </div>
      </header>
      {speDemo && (
        <PinnedAlert
          title={t('ui.spePin')}
          actionLabel={t('ui.review')}
          onAction={onOpenAiCall}
        />
      )}
      {currentUser && view !== 'sim' && <AskAuraOrb onClick={onOpenAiCall} />}
    </>
  );
};
