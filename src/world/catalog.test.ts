import { describe, expect, it } from 'vitest';
import { CREW, CREW_SIZE_BY_SHIP, crewByLogin, SHIPS } from './catalog.ts';

describe('research-based crew composition', () => {
  it('sizes Harmony 7, Gateway 4, Ares 6, Mare 4', () => {
    expect(CREW_SIZE_BY_SHIP).toEqual({
      'ship-harmony': 7,
      'ship-gateway': 4,
      'ship-ares': 6,
      'ship-mare': 4,
    });
    for (const ship of SHIPS) {
      expect(CREW.filter((c) => c.shipId === ship.id)).toHaveLength(CREW_SIZE_BY_SHIP[ship.id]);
    }
  });

  it('keeps demo logins on the original people', () => {
    expect(crewByLogin('alice_smith')?.id).toBe('astro-alice');
    expect(crewByLogin('marcus_vance')?.id).toBe('astro-marcus');
    expect(crewByLogin('elena_rostova')?.id).toBe('astro-elena');
    expect(crewByLogin('kenji_sato')?.id).toBe('astro-kenji');
    expect(crewByLogin('alice_smith')?.shipId).toBe('ship-harmony');
    expect(crewByLogin('kenji_sato')?.shipId).toBe('ship-gateway');
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
