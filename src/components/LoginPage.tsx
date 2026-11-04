import React, { useState } from 'react';
import { AuthUser, UserRole } from '../types';
import { PRESET_ACCOUNTS } from '../data/mockData';
import { Lock, User, Shield, AlertCircle, ArrowRight, Satellite, KeyRound } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>('Astronaut');
  const [account, setAccount] = useState<string>('alice_smith');
  const [password, setPassword] = useState<string>('12345');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password (default demo password is 12345)
    if (password !== '12345') {
      setError('Invalid password. For demo testing, default password is 12345');
      return;
    }

    const cleanAccount = account.trim().toLowerCase();

    // Check if account matches preset or custom
    const matched = PRESET_ACCOUNTS.find(
      (p) => p.account.toLowerCase() === cleanAccount && p.role === role
    ) || PRESET_ACCOUNTS.find((p) => p.account.toLowerCase() === cleanAccount);

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
      title: role === 'Commander' ? 'Station Commander' : role === 'NASA' ? 'NASA Flight Operations' : 'Mission Specialist',
      astronautId: role === 'Commander' ? 'astro-marcus' : 'astro-alice',
    });
  };

  const handleQuickLogin = (preset: AuthUser) => {
    setRole(preset.role);
    setAccount(preset.account);
    setPassword('12345');
    onLogin(preset);
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-black text-white font-sans overflow-hidden select-none">
      {/* LEFT COLUMN: Login Form (Strictly adhering to wireframe Log-in_9d0eec67.png) */}
      <div className="w-full md:w-1/2 lg:w-2/5 xl:w-[38%] h-full flex flex-col justify-between p-6 sm:p-10 lg:p-14 z-10 bg-black overflow-y-auto">
        {/* Brand Header */}
        <div className="space-y-1 pt-2">
          <div className="flex items-center gap-2.5 text-sky-400">
            <Satellite className="w-5 h-5 text-sky-400" />
            <span className="text-xl font-bold tracking-tight text-white">SpaceMoni</span>
          </div>
          <p className="text-xs font-mono text-neutral-400">
            Orbital Bio-Telemetry & Station Task Command
          </p>
        </div>

        {/* Form Container */}
        <div className="my-auto py-6 max-w-sm w-full mx-auto space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Field 1: Role (As shown in wireframe) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white tracking-wide">
                Role
              </label>
              <div className="relative">
                <select
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
                  <option value="Astronaut">Astronaut</option>
                  <option value="Commander">Commander</option>
                  <option value="NASA">NASA</option>
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
              <label className="block text-sm font-medium text-white tracking-wide">
                Account
              </label>
              <input
                type="text"
                required
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="e.g. alice_smith"
                className="w-full h-12 px-4 py-2 bg-white text-black font-medium text-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-neutral-400 shadow-sm"
              />
            </div>

            {/* Field 3: Password (As shown in wireframe, default 12345) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-white tracking-wide">
                  Password
                </label>
                <span className="text-[11px] font-mono text-neutral-400">
                  Demo: 12345
                </span>
              </div>
              <input
                type="password"
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
              <span>Log In as {role}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials for Reviewers */}
          <div className="pt-4 border-t border-neutral-800 space-y-2.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 text-center">
              One-Click Demo Roles:
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin(PRESET_ACCOUNTS[0])}
                className="w-full text-left px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-semibold text-white">Astronaut: alice_smith</span>
                  <div className="text-[10px] text-neutral-400 font-mono">Personal view · 24h health access</div>
                </div>
                <span className="text-[10px] font-mono bg-sky-950 text-sky-400 px-2 py-0.5 rounded border border-sky-800">
                  Astronaut
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin(PRESET_ACCOUNTS[1])}
                className="w-full text-left px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-semibold text-white">Commander: marcus_vance</span>
                  <div className="text-[10px] text-neutral-400 font-mono">All members list · No 24h details</div>
                </div>
                <span className="text-[10px] font-mono bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800">
                  Commander
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin(PRESET_ACCOUNTS[2])}
                className="w-full text-left px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-semibold text-white">NASA: nasa_mission_control</span>
                  <div className="text-[10px] text-neutral-400 font-mono">All members list · Full 24h details</div>
                </div>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                  NASA
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 text-center text-[11px] font-mono text-neutral-500">
          ISS Expedition 76 · Secured Flight Telemetry Link
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
          <span>NASA's history in pictures - the first 60 years | CNN</span>
        </div>

        {/* Bottom subtle mission caption */}
        <div className="absolute bottom-6 left-8 right-8 flex items-center justify-between text-xs font-mono text-white/80">
          <div className="bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
            <span>ORBIT: 418 KM · LEO INCLINATION: 51.6°</span>
          </div>
          <div className="bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
            <span>NASA EXPEDITION 76 SPACE HABITAT</span>
          </div>
        </div>
      </div>
    </div>
  );
};
