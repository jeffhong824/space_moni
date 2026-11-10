import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '../i18n/I18nProvider';
import { translate } from '../i18n/index';
import { GlossaryPanel } from './chrome';
import { bindEscapeClose, bindOutsidePointerClose, isEscapeKey } from './escapeClose';

function fakeListenable() {
  const listeners = new Map<string, Set<(e: { key?: string; target?: unknown; preventDefault?: () => void }) => void>>();
  return {
    addEventListener(type: string, listener: (e: unknown) => void) {
      const set = listeners.get(type) ?? new Set();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener(type: string, listener: (e: unknown) => void) {
      listeners.get(type)?.delete(listener);
    },
    emit(type: string, e: { key?: string; target?: unknown; preventDefault?: () => void }) {
      for (const fn of listeners.get(type) ?? []) fn(e);
    },
    count(type: string) {
      return listeners.get(type)?.size ?? 0;
    },
  };
}

describe('Escape closes glossary and AURA', () => {
  it('isEscapeKey only matches Escape', () => {
    expect(isEscapeKey({ key: 'Escape' })).toBe(true);
    expect(isEscapeKey({ key: 'Enter' })).toBe(false);
  });

  it('closes the glossary popover on Escape', () => {
    const target = fakeListenable();
    let closed = false;
    const stop = bindEscapeClose(target as never, () => {
      closed = true;
    });
    target.emit('keydown', { key: 'Tab', preventDefault() {} });
    expect(closed).toBe(false);
    target.emit('keydown', { key: 'Escape', preventDefault() {} });
    expect(closed).toBe(true);
    stop();
    expect(target.count('keydown')).toBe(0);
  });

  it('closes the AURA sheet on Escape', () => {
    const target = fakeListenable();
    let auraOpen = true;
    const stop = bindEscapeClose(target as never, () => {
      auraOpen = false;
    });
    target.emit('keydown', { key: 'Escape', preventDefault() {} });
    expect(auraOpen).toBe(false);
    stop();
  });

  it('glossary outside-click closes; inside click does not', () => {
    const inside = { id: 'in' };
    const outside = { id: 'out' };
    const root = {
      contains(node: { id?: string } | null) {
        return node?.id === 'in';
      },
    };
    const target = fakeListenable();
    let closed = false;
    const stop = bindOutsidePointerClose(root as never, target as never, () => {
      closed = true;
    });
    target.emit('pointerdown', { target: inside });
    expect(closed).toBe(false);
    target.emit('pointerdown', { target: outside });
    expect(closed).toBe(true);
    stop();
  });
});

describe('AURA sheet chrome', () => {
  it('marks the dialog for Escape-close and uses the offline greeting', async () => {
    const { AiCallModal } = await import('../components/AiCallModal');
    const html = renderToStaticMarkup(
      createElement(
        I18nProvider,
        null,
        createElement(AiCallModal, {
          isOpen: true,
          onClose: () => undefined,
          astronaut: {
            id: 'astro-ada',
            name: 'Ada',
            gender: 'Female',
            age: 40,
            role: 'occ.science',
            missionStartDate: '2026/11/10',
            missionCurrentDate: '2026/11/11',
            missionDuration: '2 days',
            missionDaysElapsed: 2,
            bloodType: 'O+',
            assignedStation: 'Harmony',
            stationModule: 'mod.columbus',
            avatarSeed: 'AD',
          },
          todayRecord: {
            date: '2026/11/11',
            isToday: true,
            restingHR: 72,
            restingHRStatus: 'Normal',
            hrv: 40,
            vo2Max: 40,
            spo2: 98,
            avgSleepMinutes: 420,
            avgExerciseMinutes: 90,
            mentalStatus: 'Normal',
            musculoskeletalStatus: 'Normal',
            nutritionStatus: 'Normal',
            dailyActivities: [],
            hourlyTimeline: [],
          },
          envMetrics: {
            oxygenPercent: 21,
            carbonDioxidePercent: 0.3,
            cabinPressureKpa: 101,
            cabinTempCelsius: 22,
            ambientRadiationMsvDay: 0.4,
            humidityPercent: 45,
            airScrubberState: 'Nominal',
          },
          tasks: [],
          onExecuteAction: () => undefined,
        })
      )
    );
    expect(html).toContain('data-escape-close="aura"');
    expect(html).toContain('role="dialog"');
    expect(html).toContain(translate('en', 'common.close'));
    expect(html).toContain('AURA is offline and using on-device threshold rules');
    expect(html).not.toContain('AURA online');
  });
});

describe('GlossaryPanel chrome', () => {
  it('renders a labeled Close button on the dialog', () => {
    const html = renderToStaticMarkup(
      createElement(I18nProvider, null, createElement(GlossaryPanel, { onClose: () => undefined }))
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('data-escape-close="glossary"');
    expect(html).toContain(`aria-label="${translate('en', 'common.close')}"`);
    expect(html).toContain(translate('en', 'nav.glossaryTitle'));
  });
});
