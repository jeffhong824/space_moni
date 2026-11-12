import { describe, expect, it } from 'vitest';
import type { StationTask } from '../types.ts';
import { worldStateAt } from '../world/worldState.ts';
import { SHIPS } from '../world/catalog.ts';
import {
  OVER_ALLOC_CAUTION,
  OVER_ALLOC_OFF,
  crewOpenCounts,
  fleetObjectives,
  inferShipId,
  isBehindSchedule,
  isOverAllocated,
  workloadStatus,
} from './stationObjectives.ts';

function task(partial: Partial<StationTask>): StationTask {
  return {
    id: 't',
    title: 'act.eva',
    module: 'mod.exterior',
    priority: 'High',
    status: 'In Progress',
    progress: 40,
    assignedCrew: [{ name: 'Alice Smith', role: 'occ.botanist', avatarBg: 'bg-cyan-600' }],
    deadline: '2099-01-01T00:00:00.000Z',
    description: 'act.eva',
    ...partial,
  };
}

describe('station objectives', () => {
  it('flags behind schedule only when an ISO deadline has passed and the task is open', () => {
    const now = Date.parse('2026-11-12T00:00:00.000Z');
    expect(isBehindSchedule(task({ deadline: '2026-11-11T00:00:00.000Z' }), now)).toBe(true);
    expect(isBehindSchedule(task({ deadline: '2026-11-13T00:00:00.000Z' }), now)).toBe(false);
    expect(isBehindSchedule(task({ deadline: 'Today, 18:30 UTC' }), now)).toBe(false);
    expect(isBehindSchedule(task({ deadline: '2026-11-11T00:00:00.000Z', status: 'Completed', progress: 100 }), now)).toBe(
      false
    );
  });

  it('flags over-allocation at 2 open tasks (caution) and 3 (critical)', () => {
    expect(OVER_ALLOC_CAUTION).toBe(2);
    expect(OVER_ALLOC_OFF).toBe(3);
    expect(workloadStatus(1)).toBe('Normal');
    expect(workloadStatus(2)).toBe('Attention');
    expect(workloadStatus(3)).toBe('Critical');
    expect(isOverAllocated(2)).toBe(true);
    expect(isOverAllocated(1)).toBe(false);
    const counts = crewOpenCounts([
      task({ id: 'a', assignedCrew: [{ name: 'Marcus Vance', role: 'occ.commander', avatarBg: 'x' }] }),
      task({ id: 'b', assignedCrew: [{ name: 'Marcus Vance', role: 'occ.commander', avatarBg: 'x' }] }),
      task({ id: 'c', assignedCrew: [{ name: 'Alice Smith', role: 'occ.botanist', avatarBg: 'x' }] }),
    ]);
    expect(counts.get('Marcus Vance')).toBe(2);
    expect(counts.get('Alice Smith')).toBe(1);
  });

  it('builds a fleet row per station with the same tasksForShip model', () => {
    const world = worldStateAt(Date.parse('2026-11-12T04:00:00.000Z'), null);
    const rows = fleetObjectives(world, [], Date.parse('2026-11-12T04:00:00.000Z'));
    expect(rows.map((r) => r.shipId).sort()).toEqual([...SHIPS.map((s) => s.id)].sort());
    expect(rows).toHaveLength(4);
    for (const row of rows) {
      expect(row.tasks.length).toBeGreaterThanOrEqual(2);
      expect(row.tasks.every((t) => inferShipId(t) === row.shipId)).toBe(true);
      expect(row.meanProgress).toBeGreaterThanOrEqual(0);
      expect(row.meanProgress).toBeLessThanOrEqual(100);
      expect(row.crew.length).toBeGreaterThan(0);
    }
  });
});
