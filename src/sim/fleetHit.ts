/** Pure hit-box helpers for fleet-map sprites + label cards. Sprite origin is center. */

export const FLEET_LABEL_H = 36;
export const FLEET_HINT_H = 16;
export const FLEET_LABEL_GAP = 6;

/** Resting vs hover card height. Hover adds an in-card “Click to enter” line. */
export function fleetLabelHeight(hovered: boolean): number {
  return hovered ? FLEET_LABEL_H + FLEET_HINT_H : FLEET_LABEL_H;
}
export const FLEET_CLICK_IDS = ['ship-harmony', 'ship-gateway', 'ship-ares', 'ship-mare', 'earth-hq'] as const;
export type FleetClickId = (typeof FLEET_CLICK_IDS)[number];

/** Native PNG size × map scale. Origin is the sprite center. */
export const FLEET_SPRITE_SIZE: Record<string, { w: number; h: number; scale: number }> = {
  'earth-hq': { w: 96, h: 96, scale: 2 },
  'ship-harmony': { w: 256, h: 147, scale: 1 },
  'ship-gateway': { w: 192, h: 109, scale: 1 },
  'ship-ares': { w: 288, h: 81, scale: 1 },
  'ship-mare': { w: 256, h: 159, scale: 1 },
};

export const OVERVIEW_SAFE_PAD = 40;

/** Axis-aligned box covering the sprite, its label, and extra camera padding. */
export function pinVisualBounds(
  id: string,
  pos: { x: number; y: number },
  extraPad = OVERVIEW_SAFE_PAD
): HitBox {
  const s = FLEET_SPRITE_SIZE[id] ?? { w: 160, h: 100, scale: 1 };
  const hw = (s.w * s.scale) / 2;
  const hh = (s.h * s.scale) / 2;
  const label = FLEET_LABEL_GAP + FLEET_LABEL_H;
  return {
    x: pos.x - hw - extraPad,
    y: pos.y - hh - extraPad,
    w: hw * 2 + extraPad * 2,
    h: hh * 2 + extraPad * 2 + label,
  };
}

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
