import type { ShipLive } from './worldState.ts';
import { overallRank } from './worldState.ts';

export function locationVars(ship: ShipLive): { key: string; vars: Record<string, string | number> } {
  const loc = ship.location;
  if (ship.def.kind === 'leo-station') return { key: 'loc.leo', vars: { phase: loc.phaseDeg.toFixed(0) } };
  if (ship.def.kind === 'lunar-south-pole') {
    return { key: 'loc.gateway', vars: { lat: loc.lat.toFixed(1), sun: loc.sunElevDeg.toFixed(0) } };
  }
  if (ship.def.kind === 'mars-transit') {
    return { key: 'loc.mars', vars: { au: loc.auFromEarth.toFixed(2), phase: loc.phaseDeg.toFixed(0) } };
  }
  return { key: 'loc.mare', vars: { lat: loc.lat.toFixed(1), lon: loc.lon.toFixed(1), sun: loc.sunElevDeg.toFixed(0) } };
}

export function shipCrewStatus(ship: ShipLive): 'Critical' | 'Attention' | 'Normal' {
  const ranks = ship.crew.map((c) => overallRank(c));
  if (ranks.includes(2)) return 'Critical';
  if (ranks.includes(1) || ship.cabin.carbonDioxidePercent > 0.5) return 'Attention';
  return 'Normal';
}

export function latencyKey(ship: ShipLive): { key: string; vars?: Record<string, string | number> } {
  if (ship.def.kind === 'leo-station' || ship.commLatencySec < 0.5) {
    return { key: 'shipCard.latencyLeo' };
  }
  const sec = ship.commLatencySec;
  if (sec >= 60) return { key: 'shipCard.latencyMin', vars: { min: (sec / 60).toFixed(1) } };
  return { key: 'shipCard.latencySec', vars: { sec: Math.max(1, Math.round(sec)) } };
}
