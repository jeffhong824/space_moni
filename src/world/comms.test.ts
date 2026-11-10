import { describe, expect, it } from 'vitest';
import { ackKeyForActivity, ackVisible, etaMs, formatEta, visibleToCrew, type HqMessage } from './comms';

describe('HQ comms light delay', () => {
  const base: HqMessage = {
    id: 'm1',
    shipId: 'ship-ares',
    from: 'hq',
    text: 'Hello',
    sentAt: 1_000,
    deliverAt: 1_000 + 12 * 60 * 1000,
    ackAt: 1_000 + 12 * 60 * 1000 + 8_000,
    ackKey: 'comms.ackGeneric',
  };

  it('hides the message from the ship until deliverAt', () => {
    expect(visibleToCrew(base, 1_000)).toBe(false);
    expect(visibleToCrew(base, base.deliverAt - 1)).toBe(false);
    expect(visibleToCrew(base, base.deliverAt)).toBe(true);
  });

  it('shows canned ack only after ackAt', () => {
    expect(ackVisible(base, base.deliverAt)).toBe(false);
    expect(ackVisible(base, base.ackAt!)).toBe(true);
  });

  it('formats remaining delay and picks ack by activity', () => {
    expect(formatEta(etaMs(base, 1_000))).toMatch(/12m/);
    expect(ackKeyForActivity('act.eva')).toBe('comms.ackEva');
    expect(ackKeyForActivity('act.sleep')).toBe('comms.ackSleep');
  });
});
