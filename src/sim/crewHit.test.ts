import { describe, expect, it } from 'vitest';
import {
  CREW_FRAME,
  boxContains,
  crewHitBox,
  crewHitContains,
  crewWorldHit,
  cursorForPick,
  pickCrewOrRoom,
} from './crewHit.ts';

describe('interior crew hit areas', () => {
  it('is larger than the 32×32 sprite so nearby clicks still count', () => {
    const box = crewHitBox();
    expect(box.w).toBeGreaterThan(CREW_FRAME);
    expect(box.h).toBeGreaterThan(CREW_FRAME);
    expect(crewHitContains(0, 0)).toBe(true);
    expect(crewHitContains(31, 31)).toBe(true);
    expect(crewHitContains(-10, -12)).toBe(true);
    expect(crewHitContains(40, 40)).toBe(true);
    expect(crewHitContains(-40, 0)).toBe(false);
  });

  it('wins over an overlapping room floor', () => {
    const crew = crewWorldHit(64, 64);
    const room = { x: 32, y: 32, w: 160, h: 96 };
    expect(boxContains(room, 70, 70)).toBe(true);
    expect(pickCrewOrRoom([crew], room, 70, 70)).toBe('crew');
    expect(pickCrewOrRoom([crew], room, 40, 40)).toBe('room');
    expect(pickCrewOrRoom([crew], room, 0, 0)).toBe('none');
  });

  it('uses the pointer cursor only for crew, not for room floors', () => {
    expect(cursorForPick('crew')).toBe('pointer');
    expect(cursorForPick('room')).toBe('default');
    expect(cursorForPick('none')).toBe('default');
  });
});
