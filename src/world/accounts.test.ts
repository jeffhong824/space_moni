import { describe, expect, it } from 'vitest';
import { CREW } from './catalog.ts';
import {
  DEMO_PASSWORD,
  GUEST_ACCOUNT,
  NASA_ACCOUNT,
  accountByLogin,
  accountForCrew,
  allDemoAccounts,
  isGuestUser,
  loginConfirmVars,
  loginSlug,
  parseLoginQuery,
} from './accounts.ts';

describe('demo crew accounts', () => {
  it('gives every crew member a unique login; keeps alice/marcus/elena/kenji/nasa', () => {
    const accounts = allDemoAccounts();
    expect(DEMO_PASSWORD).toBe('12345');
    expect(accountByLogin('alice_smith')?.astronautId).toBe('astro-alice');
    expect(accountByLogin('marcus_vance')?.role).toBe('Commander');
    expect(accountByLogin('elena_rostova')?.astronautId).toBe('astro-elena');
    expect(accountByLogin('kenji_sato')?.astronautId).toBe('astro-kenji');
    expect(accountByLogin('nasa_mission_control')?.role).toBe('NASA');
    expect(accounts.filter((a) => a.account === NASA_ACCOUNT.account)).toHaveLength(1);
    expect(CREW.every((c) => c.loginAccount && accountByLogin(c.loginAccount)?.astronautId === c.id)).toBe(true);
    const slugs = CREW.map((c) => c.loginAccount);
    expect(new Set(slugs).size).toBe(CREW.length);
    expect(accounts).toHaveLength(CREW.length + 1);
    expect(accountForCrew(CREW.find((c) => c.id === 'astro-sofia')!).role).toBe('Commander');
    expect(accountForCrew(CREW.find((c) => c.id === 'astro-noah')!).role).toBe('Astronaut');
    expect(GUEST_ACCOUNT.role).toBe('Guest');
    expect(accountByLogin('guest')?.role).toBe('Guest');
    expect(isGuestUser(GUEST_ACCOUNT)).toBe(true);
    expect(allDemoAccounts().some((a) => a.role === 'Guest')).toBe(false);
  });

  it('slugifies accented and hyphenated names', () => {
    expect(loginSlug('Inés Vargas')).toBe('ines_vargas');
    expect(loginSlug('Samira Al-Farsi')).toBe('samira_al_farsi');
    expect(CREW.find((c) => c.id === 'astro-ines')?.loginAccount).toBe('ines_vargas');
    expect(CREW.find((c) => c.id === 'astro-samira')?.loginAccount).toBe('samira_al_farsi');
  });

  it('parses /?as= prefill and builds confirm copy without auto-login', () => {
    expect(parseLoginQuery('')).toBeNull();
    expect(parseLoginQuery('?as=noah_okonkwo')).toEqual({ account: 'noah_okonkwo', showConfirm: true });
    const vars = loginConfirmVars('noah_okonkwo');
    expect(vars?.name).toBe('Noah Okonkwo');
    expect(vars?.roleKey).toBe('role.astronaut');
    expect(vars?.shipNameKey).toBe('ship.harmony.name');
    expect(loginConfirmVars('sofia_berg')?.roleKey).toBe('role.commander');
  });
});
