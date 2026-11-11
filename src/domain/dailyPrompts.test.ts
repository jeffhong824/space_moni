import { describe, expect, it } from 'vitest';
import { DAILY_PROMPTS, SNOOZE_MS } from './dailyPrompts.ts';
import { notifyCmo } from './evaIllness.ts';
import { OSD575_GLUCOSE } from './selfLog.ts';

describe('daily prompts', () => {
  it('covers morning 07:30, pre-exercise, and evening 21:00', () => {
    expect(DAILY_PROMPTS.map((p) => p.id)).toEqual(['morning', 'preExercise', 'evening']);
    expect(DAILY_PROMPTS[0].dueMin).toBe(7 * 60 + 30);
    expect(DAILY_PROMPTS[2].dueMin).toBe(21 * 60);
    expect(SNOOZE_MS).toBe(30 * 60 * 1000);
  });
});

describe('EVA / illness', () => {
  it('notifies CMO only for moderate/severe (no numeric thresholds)', () => {
    expect(
      notifyCmo({
        at: 't',
        crewId: 'astro-alice',
        pre: {},
        post: { skinJoint: 'mild' },
        illness: { fever: 'none' },
      })
    ).toBe(false);
    expect(
      notifyCmo({
        at: 't',
        crewId: 'astro-alice',
        pre: {},
        post: { skinJoint: 'moderate' },
        illness: { fever: 'none' },
      })
    ).toBe(true);
  });
});

describe('OSD-575 glucose is sourced', () => {
  it('is 65–99 from the CMP CSV', () => {
    expect(OSD575_GLUCOSE).toMatchObject({ min: 65, max: 99, study: 'OSD-575' });
  });
});
