import { describe, expect, it } from 'vitest';
import { isEvaOrHighExertion, weatherTaskConflicts } from './opsConflicts';
import type { StationTask } from '../types';

function task(partial: Partial<StationTask>): StationTask {
  return {
    id: 't1',
    title: 'act.science',
    module: 'mod.columbus',
    priority: 'Medium',
    status: 'Scheduled',
    progress: 0,
    assignedCrew: [],
    deadline: '',
    description: 'act.science',
    ...partial,
  };
}

describe('weather vs timeline conflicts', () => {
  it('flags exterior / EVA module keys and ignores completed work', () => {
    expect(isEvaOrHighExertion(task({ module: 'mod.exterior' }))).toBe(true);
    expect(isEvaOrHighExertion(task({ title: 'act.eva' }))).toBe(true);
    expect(isEvaOrHighExertion(task({ module: 'mod.exterior', status: 'Completed' }))).toBe(false);
    expect(isEvaOrHighExertion(task({ module: 'mod.columbus', title: 'act.science' }))).toBe(false);
  });

  it('only lists conflicts when S-scale is elevated', () => {
    const eva = task({ title: 'act.eva', module: 'mod.exterior' });
    expect(weatherTaskConflicts([eva], 'S0')).toEqual([]);
    expect(weatherTaskConflicts([eva], 'S1').map((x) => x.id)).toEqual(['t1']);
  });
});
