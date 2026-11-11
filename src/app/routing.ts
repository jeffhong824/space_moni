import type { UserRole } from '../types';

/** In-app destinations that correspond 1:1 with URL paths. */
export type AppView = 'today' | 'day' | 'body' | 'crew' | 'ops' | 'hq' | 'cases' | 'sources' | 'sim';

export type DockItemId = AppView;

export interface DockItemDef {
  id: DockItemId;
  view: AppView;
  path: string;
  labelKey: string;
  shortKey: string;
}

const PATH_BY_VIEW: Record<AppView, string> = {
  today: '/today',
  day: '/day',
  body: '/body',
  crew: '/crew',
  ops: '/ops',
  hq: '/hq',
  cases: '/cases',
  sources: '/sources',
  sim: '/sim',
};

const VIEW_BY_PATH: Record<string, AppView> = Object.fromEntries(
  Object.entries(PATH_BY_VIEW).map(([view, path]) => [path, view as AppView])
) as Record<string, AppView>;

VIEW_BY_PATH['/world'] = 'sim';
VIEW_BY_PATH['/console'] = 'ops';
VIEW_BY_PATH['/home'] = 'today';

export const SESSION_KEY = 'spacemoni.demoSession';

export function pathForView(view: AppView): string {
  return PATH_BY_VIEW[view];
}

export function viewFromPath(pathname: string): AppView | null {
  const p = (pathname.replace(/\/+$/, '') || '/') as string;
  if (p === '/') return null;
  return VIEW_BY_PATH[p] ?? null;
}

export function defaultView(role: UserRole): AppView {
  if (role === 'Guest') return 'sim';
  if (role === 'NASA') return 'hq';
  if (role === 'Commander') return 'crew';
  return 'today';
}

export function dockItemsForRole(role: UserRole): DockItemDef[] {
  if (role === 'Guest') {
    return [{ id: 'sim', view: 'sim', path: '/sim', labelKey: 'nav.sim', shortKey: 'nav.simShort' }];
  }
  if (role === 'Commander') {
    return [
      { id: 'crew', view: 'crew', path: '/crew', labelKey: 'nav.crew', shortKey: 'nav.crew' },
      { id: 'ops', view: 'ops', path: '/ops', labelKey: 'nav.ops', shortKey: 'nav.opsShort' },
      { id: 'sources', view: 'sources', path: '/sources', labelKey: 'nav.sources', shortKey: 'nav.sourcesShort' },
      { id: 'sim', view: 'sim', path: '/sim', labelKey: 'nav.sim', shortKey: 'nav.simShort' },
    ];
  }
  if (role === 'NASA') {
    return [
      { id: 'hq', view: 'hq', path: '/hq', labelKey: 'nav.hq', shortKey: 'nav.hqShort' },
      { id: 'cases', view: 'cases', path: '/cases', labelKey: 'nav.cases', shortKey: 'nav.cases' },
      { id: 'sources', view: 'sources', path: '/sources', labelKey: 'nav.sources', shortKey: 'nav.sourcesShort' },
      { id: 'sim', view: 'sim', path: '/sim', labelKey: 'nav.sim', shortKey: 'nav.simShort' },
    ];
  }
  return [
    { id: 'today', view: 'today', path: '/today', labelKey: 'nav.today', shortKey: 'nav.today' },
    { id: 'day', view: 'day', path: '/day', labelKey: 'nav.day', shortKey: 'nav.dayShort' },
    { id: 'body', view: 'body', path: '/body', labelKey: 'nav.body', shortKey: 'nav.bodyShort' },
    { id: 'sources', view: 'sources', path: '/sources', labelKey: 'nav.sources', shortKey: 'nav.sourcesShort' },
    { id: 'sim', view: 'sim', path: '/sim', labelKey: 'nav.sim', shortKey: 'nav.simShort' },
  ];
}

export function allowedViews(role: UserRole): Set<AppView> {
  return new Set(dockItemsForRole(role).map((item) => item.view));
}

/** Map a URL to a view this role may open; otherwise the role home. */
export function coerceView(pathname: string, role: UserRole): AppView {
  const raw = viewFromPath(pathname);
  const allowed = allowedViews(role);
  if (raw && allowed.has(raw)) return raw;
  if (raw === 'ops' && allowed.has('day')) return 'day';
  if (raw === 'day' && allowed.has('ops')) return 'ops';
  return defaultView(role);
}

export function pushView(view: AppView): void {
  const path = pathForView(view);
  if (typeof window === 'undefined') return;
  if (window.location.pathname === path) return;
  window.history.pushState({ view }, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function replaceView(view: AppView): void {
  const path = pathForView(view);
  if (typeof window === 'undefined') return;
  if (window.location.pathname === path) return;
  window.history.replaceState({ view }, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function isConsoleView(view: AppView): boolean {
  return view === 'day' || view === 'ops';
}

export function isRoleHome(view: AppView, role: UserRole): boolean {
  return view === defaultView(role);
}
