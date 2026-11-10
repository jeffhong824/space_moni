import { describe, expect, it } from 'vitest';
import {
  boxContains,
  FLEET_CLICK_IDS,
  FLEET_HINT_H,
  FLEET_LABEL_H,
  fleetLabelHeight,
  isFleetClickId,
  unionHitBox,
} from './fleetHit.ts';

describe('fleet map hit areas', () => {
  it('lists every ship plus Earth HQ and no decorative craft', () => {
    expect([...FLEET_CLICK_IDS].sort()).toEqual(
      ['earth-hq', 'ship-ares', 'ship-gateway', 'ship-harmony', 'ship-mare'].sort()
    );
    expect(isFleetClickId('ship-harmony')).toBe(true);
    expect(isFleetClickId('moon')).toBe(false);
  });

  it('covers the whole sprite and the label card', () => {
    const box = unionHitBox(256, 147, 1, 120);
    expect(boxContains(box, 0, 0)).toBe(true);
    expect(boxContains(box, -128, -73)).toBe(true);
    expect(boxContains(box, 127, 73)).toBe(true);
    expect(boxContains(box, 0, 147 / 2 + 6 + 4)).toBe(true);
    expect(boxContains(box, -60, 147 / 2 + 6 + FLEET_LABEL_H - 1)).toBe(true);
    expect(boxContains(box, 400, 400)).toBe(false);
  });

  it('keeps the hover “Click to enter” line inside the label card, not over nearby captions', () => {
    expect(fleetLabelHeight(false)).toBe(FLEET_LABEL_H);
    expect(fleetLabelHeight(true)).toBe(FLEET_LABEL_H + FLEET_HINT_H);
    const rest = unionHitBox(96, 64, 1, 88, fleetLabelHeight(false));
    const hover = unionHitBox(96, 64, 1, 88, fleetLabelHeight(true));
    expect(hover.h).toBeGreaterThan(rest.h);
    const hintY = 64 / 2 + 6 + FLEET_LABEL_H + 2;
    expect(boxContains(hover, 0, hintY)).toBe(true);
    expect(boxContains(rest, 0, hintY)).toBe(false);
  });

  it('grows with planet scale so Earth HQ is fully clickable', () => {
    const box = unionHitBox(96, 96, 2, 88);
    expect(boxContains(box, 0, 0)).toBe(true);
    expect(boxContains(box, -96, -96)).toBe(true);
    expect(boxContains(box, 95, 96 + 6)).toBe(true);
    expect(box.w).toBeGreaterThanOrEqual(192);
    expect(box.h).toBeGreaterThan(192);
  });
});
