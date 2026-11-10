/** Pure hit-box helpers for fleet-map sprites + label cards. Sprite origin is center. */

export const FLEET_LABEL_H = 36;
export const FLEET_LABEL_GAP = 6;
export const FLEET_CLICK_IDS = ['ship-harmony', 'ship-gateway', 'ship-ares', 'ship-mare', 'earth-hq'] as const;
export type FleetClickId = (typeof FLEET_CLICK_IDS)[number];

export interface HitBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Union of the scaled sprite (centered at 0,0) and the label card under it. */
export function unionHitBox(
  spriteW: number,
  spriteH: number,
  scale: number,
  labelW: number,
  labelH = FLEET_LABEL_H,
  labelGap = FLEET_LABEL_GAP
): HitBox {
  const sw = Math.max(1, spriteW * scale);
  const sh = Math.max(1, spriteH * scale);
  const lw = Math.max(1, labelW);
  const sx = -sw / 2;
  const sy = -sh / 2;
  const lx = -lw / 2;
  const ly = sh / 2 + labelGap;
  const x = Math.min(sx, lx);
  const y = Math.min(sy, ly);
  const r = Math.max(sx + sw, lx + lw);
  const b = Math.max(sy + sh, ly + labelH);
  return { x, y, w: r - x, h: b - y };
}

export function boxContains(box: HitBox, localX: number, localY: number): boolean {
  return localX >= box.x && localX <= box.x + box.w && localY >= box.y && localY <= box.y + box.h;
}

export function isFleetClickId(id: string): id is FleetClickId {
  return (FLEET_CLICK_IDS as readonly string[]).includes(id);
}
