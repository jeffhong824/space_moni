import {
  coerceView,
  pathForView,
  viewFromPath,
  type AppView,
} from '../app/routing';
import { accountByLogin } from '../world/accounts';

export interface TourStep {
  view: AppView;
  account: string;
  titleKey: string;
  bodyKey: string;
}

/** Judge coach-mark tour: Today → Body → SPE → Delay → Science → Crew → HQ. */
export const TOUR_STEPS: TourStep[] = [
  { view: 'today', account: 'alice_smith', titleKey: 'tour.todayTitle', bodyKey: 'tour.todayBody' },
  { view: 'body', account: 'alice_smith', titleKey: 'tour.bodyTitle', bodyKey: 'tour.bodyBody' },
  { view: 'today', account: 'alice_smith', titleKey: 'tour.speTitle', bodyKey: 'tour.speBody' },
  { view: 'today', account: 'alice_smith', titleKey: 'tour.delayTitle', bodyKey: 'tour.delayBody' },
  { view: 'science', account: 'alice_smith', titleKey: 'tour.scienceTitle', bodyKey: 'tour.scienceBody' },
  { view: 'crew', account: 'marcus_vance', titleKey: 'tour.crewTitle', bodyKey: 'tour.crewBody' },
  { view: 'hq', account: 'nasa_mission_control', titleKey: 'tour.hqTitle', bodyKey: 'tour.hqBody' },
];

export const TOUR_PATH = '/tour?tour=1';

export function wantsTour(pathname: string, search = ''): boolean {
  const p = pathname.replace(/\/+$/, '') || '/';
  const q = search.startsWith('?') ? search.slice(1) : search;
  return p === '/tour' || new URLSearchParams(q).get('tour') === '1';
}

export interface TourSession {
  account: string | null;
  view: AppView | null;
}

/** Idempotent delta for one step. Repeating it with the result applied is a no-op. */
export function tourActions(step: TourStep, session: TourSession): { signIn: string | null; go: AppView | null } {
  return {
    signIn: session.account === step.account ? null : step.account,
    go: session.view === step.view ? null : step.view,
  };
}

export interface TourSettleFrame {
  i: number;
  account: string;
  path: string;
  view: AppView;
  renders: number;
}

/**
 * Walk every tour step the way App + TourPage settle (sign-in, navigate, coerceView).
 * Throws if a step fails to stabilize — the React #185 setState loop.
 */
export function walkTourSteps(startAccount: string, startPath: string, maxRenders = 25): TourSettleFrame[] {
  let account = startAccount;
  let path = startPath;
  return TOUR_STEPS.map((step, i) => {
    let renders = 0;
    for (; renders < maxRenders; renders++) {
      const view = viewFromPath(path);
      const actions = tourActions(step, { account, view });
      let changed = false;
      if (actions.signIn) {
        const user = accountByLogin(actions.signIn);
        if (!user) throw new Error(`tour step ${i}: unknown account ${actions.signIn}`);
        account = user.account;
        changed = true;
      }
      if (actions.go) {
        const nextPath = pathForView(actions.go);
        if (nextPath !== (path.replace(/\/+$/, '') || '/')) {
          path = nextPath;
          changed = true;
        }
      }
      const user = accountByLogin(account);
      if (user) {
        const coerced = coerceView(path, user.role);
        const coercedPath = pathForView(coerced);
        const cur = path.replace(/\/+$/, '') || '/';
        if (coercedPath !== cur) {
          path = coercedPath;
          changed = true;
        }
      }
      if (!changed) {
        return { i, account, path, view: step.view, renders };
      }
    }
    throw new Error(`tour step ${i} (${step.view}) did not settle — update-depth loop`);
  });
}
