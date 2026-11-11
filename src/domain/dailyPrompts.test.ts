import { describe, expect, it } from 'vitest';
import { DAILY_PROMPTS, PROMPT_WINDOW_MIN, SNOOZE_MS, duePrompts, nextScheduledPrompt } from './dailyPrompts.ts';
import { notifyCmo } from './evaIllness.ts';
import { OSD575_GLUCOSE } from './selfLog.ts';

describe('daily prompts', () => {
  it('covers morning 07:30, pre-exercise, and evening 21:00', () => {
    expect(DAILY_PROMPTS.map((p) => p.id)).toEqual(['morning', 'preExercise', 'evening']);
    expect(DAILY_PROMPTS[0].dueMin).toBe(7 * 60 + 30);
    expect(DAILY_PROMPTS[2].dueMin).toBe(21 * 60);
    expect(SNOOZE_MS).toBe(30 * 60 * 1000);
    expect(PROMPT_WINDOW_MIN).toBe(90);
  });

  it('keeps the 90-min due window and names the next check-in outside it', () => {
    expect(duePrompts('qa-prompt', '2026-11-11', 8 * 60).map((p) => p.id)).toEqual(['morning']);
    expect(duePrompts('qa-prompt', '2026-11-11', 12 * 60)).toEqual([]);
    expect(duePrompts('qa-prompt', '2026-11-11', 18 * 60)).toEqual([]);
    expect(nextScheduledPrompt(12 * 60).id).toBe('preExercise');
    expect(nextScheduledPrompt(12 * 60).whenKey).toBe('prompt.when.preExercise');
    expect(nextScheduledPrompt(18 * 60).id).toBe('evening');
    expect(nextScheduledPrompt(18 * 60).whenKey).toBe('prompt.when.evening');
    expect(nextScheduledPrompt(23 * 60).id).toBe('morning');
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
