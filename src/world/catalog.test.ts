import { describe, expect, it } from 'vitest';
import { CREW, CREW_SIZE_BY_SHIP, crewByLogin, SHIPS } from './catalog.ts';

describe('research-based crew composition', () => {
  it('sizes Harmony 7, Moon Base south pole 4, Ares 6, Mare 4', () => {
    expect(CREW_SIZE_BY_SHIP).toEqual({
      'ship-harmony': 7,
      'ship-gateway': 4,
      'ship-ares': 6,
      'ship-mare': 4,
    });
    for (const ship of SHIPS) {
      expect(CREW.filter((c) => c.shipId === ship.id)).toHaveLength(CREW_SIZE_BY_SHIP[ship.id]);
    }
    expect(SHIPS.find((s) => s.id === 'ship-gateway')?.kind).toBe('lunar-south-pole');
  });

  it('keeps demo logins on the original people', () => {
    expect(crewByLogin('alice_smith')?.id).toBe('astro-alice');
    expect(crewByLogin('marcus_vance')?.id).toBe('astro-marcus');
    expect(crewByLogin('elena_rostova')?.id).toBe('astro-elena');
    expect(crewByLogin('kenji_sato')?.id).toBe('astro-kenji');
    expect(crewByLogin('alice_smith')?.shipId).toBe('ship-harmony');
    expect(crewByLogin('kenji_sato')?.shipId).toBe('ship-gateway');
  });

  it('assigns a loginAccount to every crew member', () => {
    expect(CREW.every((c) => typeof c.loginAccount === 'string' && c.loginAccount.length > 0)).toBe(true);
    expect(new Set(CREW.map((c) => c.loginAccount)).size).toBe(CREW.length);
  });

  it('gives unique 2-letter avatar seeds per ship and globally', () => {
    expect(CREW.every((c) => /^[A-Z]{2}$/.test(c.avatarSeed))).toBe(true);
    expect(new Set(CREW.map((c) => c.avatarSeed)).size).toBe(CREW.length);
    for (const ship of SHIPS) {
      const seeds = CREW.filter((c) => c.shipId === ship.id).map((c) => c.avatarSeed);
      expect(new Set(seeds).size).toBe(seeds.length);
    }
    expect(CREW.find((c) => c.id === 'astro-irina')?.avatarSeed).toBe('IK');
    expect(CREW.find((c) => c.id === 'astro-ines')?.avatarSeed).toBe('IV');
  });

  it('gives each ship a commander and mixed duties', () => {
    for (const ship of SHIPS) {
      const crew = CREW.filter((c) => c.shipId === ship.id);
      expect(crew.filter((c) => c.roleOnShip === 'commander')).toHaveLength(1);
      expect(new Set(crew.map((c) => c.duty)).size).toBeGreaterThan(1);
      expect(new Set(crew.map((c) => c.nationKey)).size).toBeGreaterThan(1);
    }
  });
});
