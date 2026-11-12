/** Generous local-space hit box around a 32×32 crew sprite (origin top-left). */
export const CREW_FRAME = 32;
export const CREW_HIT_PAD_X = 14;
export const CREW_HIT_PAD_Y = 18;

export interface HitBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function crewHitBox(): HitBox {
  return {
    x: -CREW_HIT_PAD_X,
    y: -CREW_HIT_PAD_Y,
    w: CREW_FRAME + CREW_HIT_PAD_X * 2,
    h: CREW_FRAME + CREW_HIT_PAD_Y * 2,
  };
}

export function boxContains(box: HitBox, x: number, y: number): boolean {
  return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}

export function crewHitContains(localX: number, localY: number): boolean {
  return boxContains(crewHitBox(), localX, localY);
}

/** World-space box for a crew sprite whose top-left is at (wx, wy). */
export function crewWorldHit(wx: number, wy: number): HitBox {
  const b = crewHitBox();
  return { x: wx + b.x, y: wy + b.y, w: b.w, h: b.h };
}

/**
 * Interior picking: crew wins over a room whenever the pointer is inside the
 * generous crew box, even if that box also overlaps the room floor.
 */
export function pickCrewOrRoom(
  crews: HitBox[],
  room: HitBox | null,
  px: number,
  py: number
): 'crew' | 'room' | 'none' {
  if (crews.some((c) => boxContains(c, px, py))) return 'crew';
  if (room && boxContains(room, px, py)) return 'room';
  return 'none';
}

export function cursorForPick(pick: 'crew' | 'room' | 'none'): 'pointer' | 'default' {
  return pick === 'crew' ? 'pointer' : 'default';
}
