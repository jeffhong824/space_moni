import React, { useEffect, useState } from 'react';
import { AuthUser, UserRole } from '../types';
import { AlertCircle, ArrowRight, Satellite } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SimBadge } from './SimBadge';
import { useI18n } from '../i18n/I18nProvider';
import {
  DEMO_PASSWORD,
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
      onLogin({
        ...matched,
        role, // Allow setting chosen role
      });
      return;
    }

    // Default fallback user creation for custom account name
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

  const handleQuickLogin = (preset: AuthUser) => {
    setRole(preset.role);
    setAccount(preset.account);
    setPassword(DEMO_PASSWORD);
    onLogin(preset);
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
    <div className="h-screen w-screen flex flex-col md:flex-row bg-black text-white font-sans overflow-hidden select-none relative">
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            window.history.pushState({}, '', '/sim');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/30 bg-black/50"
        >
          {t('login.openSim')}
        </button>
        <LanguageSwitcher variant="dark" />
      </div>
      {/* LEFT COLUMN: Login Form (Strictly adhering to wireframe Log-in_9d0eec67.png) */}
      <div className="w-full md:w-1/2 lg:w-2/5 xl:w-[38%] h-full flex flex-col justify-between p-6 sm:p-10 lg:p-14 z-10 bg-black overflow-y-auto">
        {/* Brand Header */}
        <div className="space-y-1 pt-2">
          <div className="flex items-center gap-2.5 text-sky-400">
            <Satellite className="w-5 h-5 text-sky-400" />
            <span className="text-xl font-bold tracking-tight text-white">SpaceMoni</span>
            <SimBadge />
          </div>
          <p className="text-xs font-mono text-neutral-400">
            {t('login.subtitle')}
          </p>
        </div>

        {/* Form Container */}
        <div className="my-auto py-6 max-w-sm w-full mx-auto space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Field 1: Role (As shown in wireframe) */}
            <div className="space-y-2">
              <label htmlFor="login-role" className="block text-sm font-medium text-white tracking-wide">
                {t('login.role')}
              </label>
              <div className="relative">
                <select
                  id="login-role"
                  value={role}
                  onChange={(e) => {
                    const newRole = e.target.value as UserRole;
                    setRole(newRole);
                    if (newRole === 'Commander') setAccount('marcus_vance');
                    else if (newRole === 'NASA') setAccount('nasa_mission_control');
                    else setAccount('alice_smith');
                  }}
                  className="w-full h-12 px-4 py-2 bg-white text-black font-semibold text-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none cursor-pointer shadow-sm"
                >
                  <option value="Astronaut">{t('role.astronaut')}</option>
                  <option value="Commander">{t('role.commander')}</option>
                  <option value="NASA">{t('role.nasa')}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-600">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Field 2: Account (As shown in wireframe) */}
            <div className="space-y-2">
              <label htmlFor="login-account" className="block text-sm font-medium text-white tracking-wide">
                {t('login.account')}
              </label>
              <input
                id="login-account"
                type="text"
                autoComplete="username"
                required
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder={t('login.accountPlaceholder')}
                className="w-full h-12 px-4 py-2 bg-white text-black font-medium text-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-neutral-400 shadow-sm"
              />
            </div>

            {/* Field 3: Password (As shown in wireframe, default 12345) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" className="block text-sm font-medium text-white tracking-wide">
                  {t('login.password')}
                </label>
                <span className="text-[11px] font-mono text-neutral-400">
                  {t('login.passwordHint')}
                </span>
              </div>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="12345"
                className="w-full h-12 px-4 py-2 bg-white text-black font-medium text-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-neutral-400 shadow-sm font-mono"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-950/80 border border-rose-700/80 rounded-xl text-rose-200 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Submit Button */}
            <button
              type="submit"
              className="w-full h-12 mt-2 bg-sky-500 hover:bg-sky-400 text-black font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <span>
                {role === 'NASA' ? t('login.submitNasa') : role === 'Commander' ? t('login.submitCommander') : t('login.submitAstronaut')}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials for Reviewers */}
          <div className="pt-4 border-t border-neutral-800 space-y-2.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 text-center">
              {t('login.quickRoles')}
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin(accountByLogin('alice_smith')!)}
                className="w-full text-left px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-semibold text-white">{t('login.quickAstronaut')}</span>
                  <div className="text-[10px] text-neutral-400 font-mono">{t('login.quickAstronautHint')}</div>
                </div>
                <span className="text-[10px] font-mono bg-sky-950 text-sky-400 px-2 py-0.5 rounded border border-sky-800">
                  {t('role.astronaut')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin(accountByLogin('marcus_vance')!)}
                className="w-full text-left px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-semibold text-white">{t('login.quickCommander')}</span>
                  <div className="text-[10px] text-neutral-400 font-mono">{t('login.quickCommanderHint')}</div>
                </div>
                <span className="text-[10px] font-mono bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800">
                  {t('role.commander')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin(NASA_ACCOUNT)}
                className="w-full text-left px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-semibold text-white">{t('login.quickNasa')}</span>
                  <div className="text-[10px] text-neutral-400 font-mono">{t('login.quickNasaHint')}</div>
                </div>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                  {t('role.nasa')}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 text-center text-[11px] font-mono text-neutral-500">
          {t('login.footer')}
        </div>
      </div>

      {/* RIGHT COLUMN: Photo with Top-Right Caption (Strictly adhering to wireframe) */}
      <div className="hidden md:block md:w-1/2 lg:w-3/5 xl:w-[62%] h-full relative overflow-hidden bg-neutral-950">
        <img
          src="/assets/aistudio/190207123342-xl-nasa-archives-p176_2f1b8d2d.jpg"
          alt="Astronaut spacewalk over Earth"
          className="w-full h-full object-cover"
        />

        {/* Dark subtle gradient overlay to ensure legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

        {/* Caption in Top Right (Strictly matching wireframe) */}
        <div className="absolute top-6 right-8 text-right font-sans text-xs lg:text-sm text-white/90 drop-shadow-md select-text">
          <span>{t('login.heroCaption')}</span>
        </div>

        {/* Bottom subtle mission caption */}
        <div className="absolute bottom-6 left-8 right-8 flex items-center justify-between text-xs font-mono text-white/80">
          <div className="bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
            <span>{t('login.orbitCaption')}</span>
          </div>
          <div className="bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
            <span>{t('login.archiveCaption')}</span>
          </div>
        </div>
      </div>

      {confirm && (
        <div className="absolute inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border border-sky-700 bg-neutral-950 p-5 space-y-4">
            <p className="text-sm font-semibold text-white">
              {t('login.confirmTitle', { name: confirm.name, role: t(confirm.roleKey), ship: t(confirm.shipNameKey) })}
            </p>
            <p className="text-[11px] text-neutral-400">{t('login.confirmHint')}</p>
            <p className="text-[11px] font-mono text-sky-300">
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
                className="flex-1 h-10 rounded-xl bg-sky-500 text-black text-sm font-bold"
              >
                {t('login.confirm')}
              </button>
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="flex-1 h-10 rounded-xl border border-neutral-700 text-sm font-semibold text-white"
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
