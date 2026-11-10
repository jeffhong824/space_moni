import type { AstronautProfile, AuthUser } from '../types.ts';
import { CREW, type CrewDef } from './catalog.ts';
import { missionDayAt, taipeiDateString, WORLD_EPOCH_MS, type CrewLive } from './worldState.ts';

export function crewToProfile(crew: CrewDef, t: number): AstronautProfile {
  const start = '2026/11/10';
  return {
    id: crew.id,
    name: crew.name,
    gender: crew.gender,
    age: crew.age,
    role: crew.occupationKey,
    missionStartDate: start,
    missionCurrentDate: taipeiDateString(t),
    missionDuration: `D+${missionDayAt(t) + 1}`,
    missionDaysElapsed: missionDayAt(t),
    bloodType: crew.bloodType,
    assignedStation: crew.shipId,
    stationModule: crew.occupationKey,
    avatarSeed: crew.avatarSeed,
  };
}

export function allProfiles(t: number): AstronautProfile[] {
  return CREW.map((c) => crewToProfile(c, t));
}

export function profilesForShip(shipId: string, t: number): AstronautProfile[] {
  return CREW.filter((c) => c.shipId === shipId).map((c) => crewToProfile(c, t));
}

export function enrichUser(user: AuthUser): AuthUser {
  const crew = CREW.find((c) => c.loginAccount === user.account);
  if (!crew) return user;
  return { ...user, astronautId: crew.id, title: crew.occupationKey };
}

export function liveToProfile(live: CrewLive, t: number): AstronautProfile {
  return crewToProfile(live.def, t);
}

export { WORLD_EPOCH_MS };
