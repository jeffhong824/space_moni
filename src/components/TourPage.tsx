import React, { useEffect, useRef, useState } from 'react';
import { accountByLogin } from '../world/accounts';
import type { AuthUser } from '../types';
import { useI18n } from '../i18n/I18nProvider';
import type { AppView } from '../app/routing';
import { TOUR_STEPS, tourActions } from '../domain/tour';

export const TourPage: React.FC<{
  currentAccount: string;
  currentView: AppView | null;
  onSignIn: (user: AuthUser) => void;
  onGo: (view: AppView) => void;
  onExit?: () => void;
}> = ({ currentAccount, currentView, onSignIn, onGo, onExit }) => {
  const { t } = useI18n();
  const [i, setI] = useState(0);
  const step = TOUR_STEPS[i];
  const signInRef = useRef(onSignIn);
  const goRef = useRef(onGo);
  signInRef.current = onSignIn;
  goRef.current = onGo;

  useEffect(() => {
    const actions = tourActions(step, { account: currentAccount, view: currentView });
    if (!actions.signIn && !actions.go) return;
    if (actions.signIn) {
      const user = accountByLogin(actions.signIn);
      if (user) signInRef.current(user);
    }
    if (actions.go) goRef.current(actions.go);
  }, [i, step, currentAccount, currentView]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit?.();
      if (e.key === 'ArrowRight') setI((n) => Math.min(TOUR_STEPS.length - 1, n + 1));
      if (e.key === 'ArrowLeft') setI((n) => Math.max(0, n - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex justify-center px-3">
      <div className="pointer-events-auto w-full max-w-md rounded-[24px] bg-white/95 p-4 shadow-[var(--sm-shadow)] space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">
          {t('tour.step', { n: i + 1, total: TOUR_STEPS.length })}
        </p>
        <h2 className="font-display text-xl">{t(step.titleKey)}</h2>
        <p className="text-[13px] text-stone-600">{t(step.bodyKey)}</p>
        <div className="flex gap-2">
          <button type="button" className="flex-1 h-9 rounded-full bg-stone-100 text-[12px] font-semibold" onClick={() => setI((n) => Math.max(0, n - 1))}>
            {t('tour.back')}
          </button>
          {i < TOUR_STEPS.length - 1 ? (
            <button
              type="button"
              className="flex-1 h-9 rounded-full bg-[var(--sm-cobalt)] text-white text-[12px] font-semibold"
              onClick={() => setI((n) => n + 1)}
            >
              {t('tour.next')}
            </button>
          ) : (
            <button
              type="button"
              className="flex-1 h-9 rounded-full bg-[var(--sm-cobalt)] text-white text-[12px] font-semibold"
              onClick={() => onGo('sources')}
            >
              {t('tour.sources')}
            </button>
          )}
          <button
            type="button"
            className="h-9 px-3 rounded-full bg-white text-[12px] font-semibold"
              onClick={() => onExit?.()}
          >
            {t('tour.exit')}
          </button>
        </div>
      </div>
    </div>
  );
};
