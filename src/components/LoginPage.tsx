import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, Plus, UserRound } from 'lucide-react';
import { AuthUser, UserRole } from '../types';
import { LanguageGlobe, IconCircle } from '../ui/chrome';
import { useI18n } from '../i18n/I18nProvider';
import {
  DEMO_PASSWORD,
  GUEST_ACCOUNT,
  NASA_ACCOUNT,
  accountByLogin,
  allDemoAccounts,
  loginConfirmVars,
  parseLoginQuery,
} from '../world/accounts';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { t } = useI18n();
  const [role, setRole] = useState<UserRole>('Astronaut');
  const [account, setAccount] = useState<string>('alice_smith');
  const [password, setPassword] = useState<string>(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ name: string; roleKey: string; shipNameKey: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== DEMO_PASSWORD) {
      setError(t('login.errorPassword'));
      return;
    }

    const cleanAccount = account.trim().toLowerCase();
    const accounts = allDemoAccounts();
    const matched =
      accounts.find((p) => p.account.toLowerCase() === cleanAccount && p.role === role) ||
      accountByLogin(cleanAccount);

    if (matched) {
      onLogin(matched);
      return;
    }

    const formattedName = cleanAccount
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    onLogin({
      account: cleanAccount,
      name: formattedName,
      role,
      title: role === 'Commander' ? t('role.commander') : role === 'NASA' ? t('role.nasa') : t('role.astronaut'),
      astronautId: role === 'Commander' ? 'astro-marcus' : 'astro-alice',
    });
  };

  const pickRole = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'Commander') setAccount('marcus_vance');
    else if (newRole === 'NASA') setAccount('nasa_mission_control');
    else setAccount('alice_smith');
  };

  useEffect(() => {
    const parsed = parseLoginQuery(window.location.search);
    if (!parsed) return;
    const user = accountByLogin(parsed.account);
    const vars = loginConfirmVars(parsed.account);
    setAccount(parsed.account);
    setPassword(DEMO_PASSWORD);
    if (user) setRole(user.role);
    if (vars && parsed.showConfirm) setConfirm(vars);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden relative text-stone-900">
      <div className="absolute top-4 right-4 z-50">
        <LanguageGlobe />
      </div>

      <div className="h-full w-full grid md:grid-cols-2 items-center gap-8 px-6 sm:px-12 lg:px-16">
        <div className="hidden md:flex flex-col items-center justify-center">
          <div className="relative w-[min(78vw,420px)] aspect-square">
            <div className="absolute inset-0 rounded-full bg-white/50 shadow-[0_40px_80px_rgba(40,36,28,0.12)]" />
            <div className="absolute inset-[6%] rounded-full overflow-hidden shadow-inner">
              <img
                src="/assets/aistudio/190207123342-xl-nasa-archives-p176_2f1b8d2d.jpg"
                alt=""
                className="w-full h-full object-cover scale-110"
              />
            </div>
            <div className="absolute inset-0 rounded-full pointer-events-none shadow-[inset_0_0_40px_rgba(255,255,255,0.55)]" />
          </div>
          <p className="mt-5 text-[13px] text-stone-500">{t('ui.archiveImagery')}</p>
        </div>

        <div className="max-w-md w-full mx-auto py-10 max-h-full overflow-y-auto">
          <h1 className="font-display text-4xl sm:text-5xl text-stone-900">{t('login.welcome')}</h1>
          <p className="mt-2 text-sm text-stone-500">{t('login.subtitle')}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="flex items-start justify-center gap-6" role="radiogroup" aria-label={t('login.role')}>
              <IconCircle
                label={t('role.astronaut')}
                active={role === 'Astronaut'}
                onClick={() => pickRole('Astronaut')}
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M7 14c0-4 2.2-7 5-7s5 3 5 7" />
                  <path d="M6 15h12v2.2c0 .6-.5 1.1-1.1 1.3C15.4 19.2 13.8 20 12 20s-3.4-.8-4.9-1.5c-.6-.2-1.1-.7-1.1-1.3V15Z" />
                  <path d="M8.5 11.5h7" />
                </svg>
              </IconCircle>
              <IconCircle
                label={t('role.commander')}
                active={role === 'Commander'}
                onClick={() => pickRole('Commander')}
              >
                <UserRound className="w-6 h-6" />
              </IconCircle>
              <IconCircle
                label={t('ui.flightSurgeon')}
                active={role === 'NASA'}
                onClick={() => pickRole('NASA')}
              >
                <Plus className="w-6 h-6" strokeWidth={2.4} />
              </IconCircle>
            </div>
            <select id="login-role" className="sr-only" value={role} onChange={(e) => pickRole(e.target.value as UserRole)}>
              <option value="Astronaut">{t('role.astronaut')}</option>
              <option value="Commander">{t('role.commander')}</option>
              <option value="NASA">{t('role.nasa')}</option>
            </select>

            <label className="block">
              <span className="sr-only">{t('login.account')}</span>
              <input
                id="login-account"
                type="text"
                autoComplete="username"
                required
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder={t('login.accountPlaceholder')}
                className="w-full h-12 px-5 bg-white rounded-full text-sm shadow-[var(--sm-shadow-soft)] placeholder:text-stone-400"
              />
            </label>
            <label className="block">
              <span className="sr-only">{t('login.password')}</span>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="12345"
                className="w-full h-12 px-5 bg-white rounded-full text-sm shadow-[var(--sm-shadow-soft)]"
              />
            </label>

            {error && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-rose-50 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full h-12 rounded-full bg-[var(--sm-cobalt)] text-white text-sm font-semibold flex items-center justify-center gap-2"
            >
              {t('ui.continue')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => onLogin(GUEST_ACCOUNT)}
              className="text-[13px] text-stone-500 hover:text-stone-800"
            >
              {t('ui.exploreHq')} →
            </button>
            <p className="mt-5 text-[11px] text-stone-400">{t('login.quickRoles')}</p>
            <div className="mt-2 grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => onLogin(accountByLogin('alice_smith')!)}
                className="h-10 w-full px-4 rounded-full bg-white text-[12px] font-semibold whitespace-nowrap"
              >
                {t('login.quickAstronaut')}
              </button>
              <button
                type="button"
                onClick={() => onLogin(accountByLogin('marcus_vance')!)}
                className="h-10 w-full px-4 rounded-full bg-white text-[12px] font-semibold whitespace-nowrap"
              >
                {t('login.quickCommander')}
              </button>
              <button
                type="button"
                onClick={() => onLogin(NASA_ACCOUNT)}
                className="h-10 w-full px-4 rounded-full bg-white text-[12px] font-semibold whitespace-nowrap"
              >
                {t('login.quickNasa')}
              </button>
            </div>
            <p className="mt-4 text-[11px] text-stone-400">{t('login.footer')}</p>
            <p className="mt-1 text-[11px] text-stone-400 font-mono">{t('login.passwordHint')}</p>
          </div>
        </div>
      </div>

      {confirm && (
        <div className="absolute inset-0 z-[60] bg-stone-900/30 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-[32px] bg-white p-6 space-y-4 shadow-[var(--sm-shadow)]">
            <p className="font-display text-2xl">
              {t('login.confirmTitle', { name: confirm.name, role: t(confirm.roleKey), ship: t(confirm.shipNameKey) })}
            </p>
            <p className="text-[13px] text-stone-500">{t('login.confirmHint')}</p>
            <p className="text-[12px] font-mono text-stone-400">
              {account} · {t('login.passwordHint')}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const user = accountByLogin(account);
                  setConfirm(null);
                  if (user) onLogin(user);
                }}
                className="flex-1 h-11 rounded-full bg-[var(--sm-cobalt)] text-white text-sm font-semibold"
              >
                {t('login.confirm')}
              </button>
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="flex-1 h-11 rounded-full bg-stone-100 text-sm font-semibold"
              >
                {t('login.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
