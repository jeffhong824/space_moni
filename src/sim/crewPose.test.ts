import { describe, expect, it } from 'vitest';
import { sScaleElevated } from '../domain/spaceWeather.ts';
import { WORLD_EPOCH_MS, findCrewLive, worldStateAt } from '../world/worldState.ts';
import { crewPoseAt, roomForActivity } from './crewPose.ts';
import { layoutOf } from './layouts.ts';

const HOUR = 3600 * 1000;
const DAY = 86_400_000;

describe('crewPoseAt', () => {
  it('is a pure function of t for the same crew', () => {
    const t = WORLD_EPOCH_MS + 13.25 * HOUR;
    const world = worldStateAt(t, null);
    const live = findCrewLive(world, 'astro-alice')!;
    const a = crewPoseAt(t, live.crew, live.ship);
    const b = crewPoseAt(t, live.crew, live.ship);
    expect(a).toEqual(b);
    expect(a.x).toBeGreaterThanOrEqual(0);
    expect(a.y).toBeGreaterThanOrEqual(0);
  });

  it('puts sleeping crew in crew quarters', () => {
    const t = WORLD_EPOCH_MS + 3 * HOUR;
    const world = worldStateAt(t, null);
    const live = findCrewLive(world, 'astro-alice')!;
    expect(live.crew.activityKey).toBe('act.sleep');
    const pose = crewPoseAt(t + 10 * 60 * 1000, live.crew, live.ship);
    expect(pose.roomId).toBe('crew_quarters');
    expect(pose.walking).toBe(false);
    expect(pose.anim === 'sleep' || pose.anim === 'sleep-float').toBe(true);
  });

  it('puts afternoon exercise in the gym module', () => {
    const t = WORLD_EPOCH_MS + 13.5 * HOUR;
    const world = worldStateAt(t, null);
    const live = findCrewLive(world, 'astro-alice')!;
    expect(live.crew.activityKey).toBe('act.exercise');
    const pose = crewPoseAt(t, live.crew, live.ship);
    expect(pose.roomId).toBe('exercise');
  });

  it('walks between rooms just after an activity change', () => {
    const t = WORLD_EPOCH_MS + 8 * HOUR + 2000;
    const world = worldStateAt(t, null);
    const live = findCrewLive(world, 'astro-alice')!;
    const layout = layoutOf(live.ship.def.id);
    const from = roomForActivity(layout, live.crew.prevActivityKey);
    const to = roomForActivity(layout, live.crew.activityKey);
    const pose = crewPoseAt(t, live.crew, live.ship);
    if (from !== to) {
      expect(pose.walking).toBe(true);
      expect(pose.anim.startsWith('walk-')).toBe(true);
    }
  });

  it('sends Alice to medical on her scripted illness day', () => {
    const t = WORLD_EPOCH_MS + 3 * DAY + 10 * HOUR;
    const world = worldStateAt(t, null);
    const live = findCrewLive(world, 'astro-alice')!;
    expect(live.crew.event).toBe('event.illness');
    const pose = crewPoseAt(t, live.crew, live.ship);
    expect(pose.roomId).toBe('medical');
  });

  it('sends Gateway crew to shelter when S-scale is elevated', () => {
    const t = WORLD_EPOCH_MS + 10 * HOUR;
    const storm = worldStateAt(t, {
      fetchedAt: '',
      windowStart: '',
      windowEnd: '',
      overallStatus: 'ok',
      nasaKeyMode: 'demo_key',
      cache: { hit: false, ttlSeconds: 0 },
      sources: [],
      observations: { kp: null, goesXray: null, solarWind: null, protons: null },
      scales: { gScale: 'G0', rScale: 'R0', sScale: 'S2', radiationRisk: 'High', basisZh: '' },
      events: { solarFlares: [], geomagneticStorms: [], coronalMassEjections: [], swpcAlerts: [] },
      notices: [],
    });
    const ship = storm.ships.find((s) => s.def.id === 'ship-gateway')!;
    expect(sScaleElevated(ship.sScaleUsed)).toBe(true);
    const pose = crewPoseAt(t, ship.crew[0], ship);
    expect(pose.roomId).toBe(layoutOf('ship-gateway').shelterRoom);
  });
});
