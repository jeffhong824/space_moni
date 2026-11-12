import type { StationTask } from '../types';
import { CREW } from '../world/catalog';
import { tasksForShip, type WorldState } from '../world/worldState';

/**
 * Open-task counts that flag over-allocation (SIMULATION ops policy).
 * Caution at 2 concurrent open station tasks; off-nominal at 3+.
 * Not a NASA-STD-3001 numeric limit.
 */
export const OVER_ALLOC_CAUTION = 2;
export const OVER_ALLOC_OFF = 3;

export function parseTaskDeadline(deadline: string): number | null {
  const ms = Date.parse(deadline);
  return Number.isFinite(ms) ? ms : null;
}

export function isOpenTask(task: StationTask): boolean {
  return task.status !== 'Completed' && task.progress < 100;
}

export function isBehindSchedule(task: StationTask, nowMs: number): boolean {
  if (!isOpenTask(task)) return false;
  const due = parseTaskDeadline(task.deadline);
  if (due == null) return false;
  return due < nowMs;
}

export function crewOpenCounts(tasks: StationTask[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const task of tasks) {
    if (!isOpenTask(task)) continue;
    for (const c of task.assignedCrew) {
      map.set(c.name, (map.get(c.name) ?? 0) + 1);
    }
  }
  return map;
}

export function workloadStatus(openCount: number): 'Normal' | 'Attention' | 'Critical' {
  if (openCount >= OVER_ALLOC_OFF) return 'Critical';
  if (openCount >= OVER_ALLOC_CAUTION) return 'Attention';
  return 'Normal';
}

export function isOverAllocated(openCount: number): boolean {
  return workloadStatus(openCount) !== 'Normal';
}

export function inferShipId(task: StationTask): string | undefined {
  if (task.shipId) return task.shipId;
  for (const c of task.assignedCrew) {
    const crew = CREW.find((x) => x.name === c.name);
    if (crew) return crew.shipId;
  }
  return undefined;
}

export interface CrewWorkloadRow {
  name: string;
  role: string;
  open: number;
  over: boolean;
  status: 'Normal' | 'Attention' | 'Critical';
}

export interface FleetStationObjectives {
  shipId: string;
  nameKey: string;
  tasks: StationTask[];
  behind: StationTask[];
  meanProgress: number;
  crew: CrewWorkloadRow[];
}

export function fleetObjectives(world: WorldState, extra: StationTask[], nowMs: number): FleetStationObjectives[] {
  return world.ships.map((ship) => {
    const generated = tasksForShip(ship, world.t);
    const extras = extra.filter((t) => inferShipId(t) === ship.def.id);
    const tasks = [...extras, ...generated];
    const behind = tasks.filter((t) => isBehindSchedule(t, nowMs));
    const counts = crewOpenCounts(tasks);
    const names = new Map<string, string>();
    for (const t of tasks) {
      for (const c of t.assignedCrew) names.set(c.name, c.role);
    }
    for (const c of ship.crew) names.set(c.def.name, c.def.occupationKey);
    const crew: CrewWorkloadRow[] = [...names.entries()]
      .map(([name, role]) => {
        const open = counts.get(name) ?? 0;
        const status = workloadStatus(open);
        return { name, role, open, over: status !== 'Normal', status };
      })
      .sort((a, b) => b.open - a.open || a.name.localeCompare(b.name));
    const meanProgress = tasks.length
      ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length)
      : 0;
    return { shipId: ship.def.id, nameKey: ship.def.nameKey, tasks, behind, meanProgress, crew };
  });
}
