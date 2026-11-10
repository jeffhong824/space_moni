import type { AuthUser } from '../types.ts';
import { CREW, SHIPS, type CrewDef } from './catalog.ts';

export const DEMO_PASSWORD = '12345';

export const NASA_ACCOUNT: AuthUser = {
  account: 'nasa_mission_control',
  name: 'NASA Flight Surgeon',
  role: 'NASA',
  title: 'NASA Flight Surgeon & Bio-Medical Ground Control',
};

/** Stable username slug: "Inés Vargas" → ines_vargas, "Samira Al-Farsi" → samira_al_farsi. */
export function loginSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function accountForCrew(crew: CrewDef): AuthUser {
  return {
    account: crew.loginAccount,
    name: crew.name,
    role: crew.roleOnShip === 'commander' ? 'Commander' : 'Astronaut',
    astronautId: crew.id,
    title: crew.occupationKey,
  };
}

export function allDemoAccounts(): AuthUser[] {
  return [...CREW.map(accountForCrew), NASA_ACCOUNT];
}

export function accountByLogin(account: string): AuthUser | undefined {
  const clean = account.trim().toLowerCase();
  return allDemoAccounts().find((a) => a.account.toLowerCase() === clean);
}

export function parseLoginQuery(search: string): { account: string; showConfirm: boolean } | null {
  const q = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(q);
  const account = (params.get('as') || params.get('account') || '').trim().toLowerCase();
  if (!account) return null;
  return { account, showConfirm: true };
}

export function loginConfirmVars(account: string): { name: string; roleKey: string; shipNameKey: string } | null {
  const user = accountByLogin(account);
  if (!user || user.role === 'NASA') {
    if (account === NASA_ACCOUNT.account) {
      return { name: NASA_ACCOUNT.name, roleKey: 'role.nasa', shipNameKey: 'hq.title' };
    }
    return null;
  }
  const crew = CREW.find((c) => c.loginAccount === user.account);
  if (!crew) return null;
  const ship = SHIPS.find((s) => s.id === crew.shipId);
  return {
    name: crew.name,
    roleKey: user.role === 'Commander' ? 'role.commander' : 'role.astronaut',
    shipNameKey: ship?.nameKey ?? 'ship.harmony.name',
  };
}
