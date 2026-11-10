import type { SpaceEnvironmentPayload } from '../domain/spaceWeather.ts';
import { overallRank, type ShipLive, type WorldState } from '../world/worldState.ts';
import { latencyKey, shipCrewStatus } from '../world/shipStatus.ts';

export type HqStatus = 'Normal' | 'Attention' | 'Critical';

export interface HqFlaggedCrew {
  id: string;
  name: string;
  rank: 0 | 1 | 2;
  event: string | null;
}

export interface HqRosterEntry {
  id: string;
  name: string;
  occupationKey: string;
  activityKey: string;
  rank: 0 | 1 | 2;
  hr: number;
  spo2: number;
  respRate: number;
  event: string | null;
}

export interface HqShipRow {
  id: string;
  nameKey: string;
  kindKey: string;
  status: HqStatus;
  crewCount: number;
  flagged: HqFlaggedCrew[];
  roster: HqRosterEntry[];
  activityKey: string;
  nextEventKey: string;
  nextEventAt: number;
  latency: { key: string; vars?: Record<string, string | number> };
}

export interface HqWeatherStrip {
  live: true;
  kp: number | null;
  gScale: string;
  rScale: string;
  sScale: string;
  radiationRisk: string;
}

export interface HqFeedItem {
  id: string;
  source: 'live' | 'sim';
  kind: 'alert' | 'flare' | 'cme' | 'storm' | 'scripted';
  title: string;
  titleKey?: string;
  at: string | null;
  shipId?: string;
}

export interface HqBoard {
  ships: HqShipRow[];
  weather: HqWeatherStrip;
  events: HqFeedItem[];
}

export function hqShipRow(ship: ShipLive): HqShipRow {
  const flagged: HqFlaggedCrew[] = ship.crew
    .filter((c) => overallRank(c) > 0 || c.event)
    .map((c) => ({
      id: c.def.id,
      name: c.def.name,
      rank: overallRank(c),
      event: c.event,
    }));
  const commander = ship.crew.find((c) => c.def.roleOnShip === 'commander') ?? ship.crew[0];
  return {
    id: ship.def.id,
    nameKey: ship.def.nameKey,
    kindKey: ship.def.kindKey,
    status: shipCrewStatus(ship),
    crewCount: ship.crew.length,
    flagged,
    roster: ship.crew.map((c) => ({
      id: c.def.id,
      name: c.def.name,
      occupationKey: c.def.occupationKey,
      activityKey: c.activityKey,
      rank: overallRank(c),
      hr: c.wearable.hr,
      spo2: c.wearable.spo2,
      respRate: c.wearable.respRate,
      event: c.event,
    })),
    activityKey: commander?.activityKey ?? 'act.comms',
    nextEventKey: ship.nextEventKey,
    nextEventAt: ship.nextEventAt,
    latency: latencyKey(ship),
  };
}

export function hqWeather(wx: SpaceEnvironmentPayload | null): HqWeatherStrip {
  return {
    live: true,
    kp: wx?.observations.kp?.value ?? null,
    gScale: wx?.scales.gScale ?? 'G?',
    rScale: wx?.scales.rScale ?? 'R?',
    sScale: wx?.scales.sScale ?? 'S?',
    radiationRisk: wx?.scales.radiationRisk ?? 'Unknown',
  };
}

function uniquePush(out: HqFeedItem[], item: HqFeedItem) {
  const used = new Set(out.map((e) => e.id));
  let id = item.id;
  let n = 0;
  while (used.has(id)) {
    n += 1;
    id = `${item.id}-${n}`;
  }
  out.push({ ...item, id });
}

export function hqEvents(world: WorldState, wx: SpaceEnvironmentPayload | null): HqFeedItem[] {
  const out: HqFeedItem[] = [];
  (wx?.events.swpcAlerts ?? []).forEach((a, i) => {
    uniquePush(out, {
      id: `alert-${a.productId || i}-${a.issueDatetime || i}`,
      source: 'live',
      kind: 'alert',
      title: a.headline,
      at: a.issueDatetime,
    });
  });
  (wx?.events.solarFlares ?? []).forEach((f, i) => {
    uniquePush(out, {
      id: `flare-${f.flrID || i}`,
      source: 'live',
      kind: 'flare',
      title: f.classType,
      at: f.beginTime ?? f.peakTime,
    });
  });
  (wx?.events.geomagneticStorms ?? []).forEach((s, i) => {
    uniquePush(out, {
      id: `gst-${s.gstID || i}`,
      source: 'live',
      kind: 'storm',
      title: s.kpIndex != null ? `Kp ${s.kpIndex}` : s.gstID,
      at: s.startTime,
    });
  });
  (wx?.events.coronalMassEjections ?? []).forEach((c, i) => {
    uniquePush(out, {
      id: `cme-${c.activityID || i}`,
      source: 'live',
      kind: 'cme',
      title: c.note || c.activityID,
      at: c.startTime,
    });
  });
  for (const ship of world.ships) {
    for (const c of ship.crew) {
      if (!c.event) continue;
      uniquePush(out, {
        id: `sim-${ship.def.id}-${c.def.id}-${c.event}`,
        source: 'sim',
        kind: 'scripted',
        title: c.event,
        titleKey: c.event,
        at: world.taipeiIsoDate,
        shipId: ship.def.id,
      });
    }
  }
  return out.slice(0, 12);
}

export function hqBoardAt(world: WorldState, wx: SpaceEnvironmentPayload | null): HqBoard {
  return {
    ships: world.ships.map(hqShipRow),
    weather: hqWeather(wx),
    events: hqEvents(world, wx),
  };
}
