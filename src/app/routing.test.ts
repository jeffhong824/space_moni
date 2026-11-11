import { describe, expect, it } from 'vitest';
import {
  allowedViews,
  coerceView,
  defaultView,
  dockItemsForRole,
  pathForView,
  viewFromPath,
  type AppView,
} from './routing';
import type { UserRole } from '../types';

const ROLES: UserRole[] = ['Astronaut', 'Commander', 'NASA'];

describe('dock destinations per role', () => {
  it('gives every dock item a distinct view, path, and label key', () => {
    for (const role of ROLES) {
      const items = dockItemsForRole(role);
      expect(items.length).toBeGreaterThanOrEqual(4);
      const views = items.map((i) => i.view);
      const paths = items.map((i) => i.path);
      const labels = items.map((i) => i.labelKey);
      expect(new Set(views).size, `${role} duplicate view`).toBe(views.length);
      expect(new Set(paths).size, `${role} duplicate path`).toBe(paths.length);
      expect(new Set(labels).size, `${role} duplicate label`).toBe(labels.length);
      expect(paths.every((p) => p.startsWith('/'))).toBe(true);
      expect(items.some((i) => i.view === 'sim' && i.path === '/sim')).toBe(true);
      expect(items.some((i) => i.view === 'sources')).toBe(true);
    }
  });

  it('astronaut dock is Today / Day report / Body / Sources / Fleet sim', () => {
    expect(dockItemsForRole('Astronaut').map((i) => i.view)).toEqual(['today', 'day', 'body', 'sources', 'sim']);
  });

  it('commander dock is Crew / Ops / Sources / Fleet sim', () => {
    expect(dockItemsForRole('Commander').map((i) => i.view)).toEqual(['crew', 'ops', 'sources', 'sim']);
  });

  it('NASA dock is Mission control / Cases / Sources / Fleet sim', () => {
    expect(dockItemsForRole('NASA').map((i) => i.view)).toEqual(['hq', 'cases', 'sources', 'sim']);
  });

  it('never reuses Today’s destination for another dock item', () => {
    const astro = dockItemsForRole('Astronaut');
    const today = astro.find((i) => i.id === 'today')!;
    expect(astro.filter((i) => i.path === today.path)).toHaveLength(1);
    const cmd = dockItemsForRole('Commander');
    const crew = cmd.find((i) => i.id === 'crew')!;
    expect(cmd.filter((i) => i.path === crew.path)).toHaveLength(1);
  });
});

describe('path ↔ view', () => {
  it('round-trips every dock path', () => {
    for (const role of ROLES) {
      for (const item of dockItemsForRole(role)) {
        expect(viewFromPath(item.path)).toBe(item.view);
        expect(pathForView(item.view)).toBe(item.path);
        expect(coerceView(item.path, role)).toBe(item.view);
      }
    }
  });

  it('maps /sim as the active fleet-sim view', () => {
    expect(viewFromPath('/sim')).toBe('sim');
    expect(coerceView('/sim', 'Astronaut')).toBe('sim');
    expect(coerceView('/sim', 'Commander')).toBe('sim');
    expect(coerceView('/sim', 'NASA')).toBe('sim');
  });

  it('guest HQ simulation entry reaches /sim without a crew login', () => {
    expect(defaultView('Guest')).toBe('sim');
    expect(coerceView('/sim', 'Guest')).toBe('sim');
    expect(coerceView('/world', 'Guest')).toBe('sim');
    expect(coerceView('/', 'Guest')).toBe('sim');
    expect(coerceView('/today', 'Guest')).toBe('sim');
    expect(dockItemsForRole('Guest').map((i) => i.view)).toEqual(['sim']);
    expect(allowedViews('Guest').has('sim')).toBe(true);
    expect(allowedViews('Guest').has('today')).toBe(false);
  });

  it('falls back to the role home for unknown or foreign paths', () => {
    expect(defaultView('Astronaut')).toBe('today');
    expect(defaultView('Commander')).toBe('crew');
    expect(defaultView('NASA')).toBe('hq');
    expect(coerceView('/', 'Astronaut')).toBe('today');
    expect(coerceView('/cases', 'Astronaut')).toBe('today');
    expect(coerceView('/today', 'Commander')).toBe('crew');
    expect(coerceView('/hq', 'Commander')).toBe('crew');
    expect(coerceView('/crew', 'NASA')).toBe('hq');
  });

  it('marks exactly one dock item current for a given view', () => {
    for (const role of ROLES) {
      const items = dockItemsForRole(role);
      const seen = new Set<AppView>();
      for (const item of items) {
        const current = items.filter((i) => i.view === item.view);
        expect(current).toHaveLength(1);
        seen.add(item.view);
      }
      expect(seen.size).toBe(items.length);
      expect(allowedViews(role).size).toBe(items.length);
    }
  });
});
