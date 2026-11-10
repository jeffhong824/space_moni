import type { StationTask } from '../types.ts';
import { sScaleElevated } from './spaceWeather.ts';

export function isEvaOrHighExertion(task: StationTask): boolean {
  if (task.status === 'Completed') return false;
  const blob = `${task.title} ${task.module} ${task.description}`.toLowerCase();
  return (
    task.module === 'mod.exterior' ||
    task.module === 'Station Exterior' ||
    /eva|艙外|t2|ared|treadmill|peak load|高強度|高負荷|mod\.exterior/.test(blob)
  );
}

export function weatherTaskConflicts(tasks: StationTask[], sScale: string | null | undefined): StationTask[] {
  if (!sScaleElevated(sScale)) return [];
  return tasks.filter(isEvaOrHighExertion);
}
