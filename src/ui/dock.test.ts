import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { dockItemsForRole } from '../app/routing';
import { I18nProvider } from '../i18n/I18nProvider';
import type { UserRole } from '../types';
import { PillDock } from './chrome';

const ROLES: UserRole[] = ['Astronaut', 'Commander', 'NASA'];

function renderDock(role: UserRole, view: ReturnType<typeof dockItemsForRole>[number]['view']) {
  return renderToStaticMarkup(
    createElement(I18nProvider, null, createElement(PillDock, { role, view, onChangeView: () => undefined }))
  );
}

describe('PillDock aria-current per role', () => {
  it('gives every dock item a distinct destination and marks only that item current', () => {
    for (const role of ROLES) {
      const items = dockItemsForRole(role);
      const views = items.map((i) => i.view);
      expect(new Set(views).size).toBe(items.length);
      expect(new Set(items.map((i) => i.path)).size).toBe(items.length);

      for (const item of items) {
        const html = renderDock(role, item.view);
        const currentCount = (html.match(/aria-current="page"/g) ?? []).length;
        expect(currentCount, `${role} ${item.view} aria-current count`).toBe(1);
        expect(html).toContain(`data-dock="${item.id}"`);
        const others = items.filter((i) => i.id !== item.id);
        for (const other of others) {
          const re = new RegExp(`data-dock="${other.id}"[^>]*aria-current="page"`);
          expect(re.test(html), `${role} ${other.id} should not be current on ${item.view}`).toBe(false);
        }
        expect(html).toContain(`title="`);
        expect(html).toContain(item.id);
      }
    }
  });

  it('marks Fleet sim current on /sim for every role', () => {
    for (const role of ROLES) {
      const html = renderDock(role, 'sim');
      expect(html).toMatch(/data-dock="sim"[^>]*aria-current="page"/);
    }
  });
});
