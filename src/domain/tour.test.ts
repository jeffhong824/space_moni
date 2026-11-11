import { describe, expect, it } from 'vitest';
import { coerceView, pathForView, viewFromPath } from '../app/routing.ts';
import { accountByLogin, GUEST_ACCOUNT } from '../world/accounts.ts';
import {
  TOUR_PATH,
  TOUR_STEPS,
  tourActions,
  walkTourSteps,
  wantsTour,
} from './tour.ts';

describe('tour location', () => {
  it('starts from /tour and ?tour=1, not from login /', () => {
    expect(wantsTour('/tour', '')).toBe(true);
    expect(wantsTour('/tour/', '?tour=1')).toBe(true);
    expect(wantsTour('/', '?tour=1')).toBe(true);
    expect(wantsTour('/', '')).toBe(false);
    expect(wantsTour('/today', '')).toBe(false);
    expect(TOUR_PATH).toBe('/tour?tour=1');
  });
});

describe('tour steps', () => {
  it('covers Today, Body, SPE, Delay, Science, Crew, HQ without repeating a setState-only step', () => {
    expect(TOUR_STEPS.map((s) => s.view)).toEqual(['today', 'body', 'today', 'today', 'science', 'crew', 'hq']);
    expect(TOUR_STEPS.map((s) => s.account)).toEqual([
      'alice_smith',
      'alice_smith',
      'alice_smith',
      'alice_smith',
      'alice_smith',
      'marcus_vance',
      'nasa_mission_control',
    ]);
    expect(TOUR_STEPS[1].view).toBe('body');
    for (const step of TOUR_STEPS) {
      expect(accountByLogin(step.account)?.account).toBe(step.account);
      const again = tourActions(step, { account: step.account, view: step.view });
      expect(again, `${step.view} must be idempotent`).toEqual({ signIn: null, go: null });
    }
  });

  it('walks every tour step from a guest /tour landing without an update-depth loop', () => {
    const frames = walkTourSteps(GUEST_ACCOUNT.account, '/tour');
    expect(frames).toHaveLength(TOUR_STEPS.length);
    for (let i = 0; i < TOUR_STEPS.length; i++) {
      const step = TOUR_STEPS[i];
      const frame = frames[i];
      expect(frame.account, `step ${i} account`).toBe(step.account);
      expect(frame.path, `step ${i} path`).toBe(pathForView(step.view));
      expect(viewFromPath(frame.path)).toBe(step.view);
      expect(frame.renders, `step ${i} (${step.view}) looped`).toBeLessThan(10);
      const role = accountByLogin(frame.account)!.role;
      expect(coerceView(frame.path, role)).toBe(step.view);
    }
    expect(frames[1].path).toBe('/body');
    expect(frames[1].account).toBe('alice_smith');
  });

  it('also settles when the login CTA lands on /tour?tour=1 with no session yet', () => {
    const frames = walkTourSteps(GUEST_ACCOUNT.account, '/tour');
    expect(frames[0].path).toBe('/today');
    expect(frames[0].account).toBe('alice_smith');
    expect(frames.every((f) => f.renders < 10)).toBe(true);
  });
});
