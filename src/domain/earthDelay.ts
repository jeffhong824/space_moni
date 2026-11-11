/**
 * Earth-independent comm delay and action split (HRP EIHSO-202).
 * Distances for LEO/Moon are physical constants. Mars light-time is computed
 * from the ship's simulated AU (circular-orbit analog) unless overridden.
 */
import type { ShipKind } from '../world/catalog.ts';

export const C_KM_S = 299_792.458;
export const AU_KM = 149_597_870.7;
/** Mean Earth–Moon distance. One-way light time ≈ 1.28 s. */
export const MOON_KM = 384_400;
export const MOON_ONE_WAY_S = MOON_KM / C_KM_S;

export const EIHSO_202 = {
  id: 'EIHSO-202',
  doc: 'HRP Risk Approach Plans, June 2026',
  text: 'Develop and validate monitoring countermeasures of human-system performance (procedure execution, anomaly resolution) during increasingly Earth-independent operations (e.g. communication delays). Item 2: Recommendations for semi-autonomous monitoring dashboard.',
};

export type DelayMethod = 'leo-negligible' | 'moon-light-time' | 'mars-sim-au' | 'mars-override';

export interface EarthDelay {
  oneWaySec: number;
  roundTripSec: number;
  method: DelayMethod;
  /** English fallback for tests / titles. UI should prefer labelKey. */
  label: string;
  labelKey: string;
  labelVars?: Record<string, string | number>;
  /** True when crew must act before a ground reply can arrive. */
  earthIndependent: boolean;
}

export type ActionClass = 'crew_autonomous' | 'needs_ground';

export const AUTONOMOUS_ACTIONS = [
  'shelter',
  'hydrate',
  'self_check',
  'exercise',
  'sleep',
  'sans_check',
  'mood_checkin',
  'egress_self',
] as const;

export const GROUND_ACTIONS = ['eva_go', 'medevac', 'abort', 'pharmacy', 'habitat_repress'] as const;

export function delayFromAu(au: number): number {
  if (!Number.isFinite(au) || au <= 0) return 0;
  return (au * AU_KM) / C_KM_S;
}

export function earthDelayForKind(
  kind: ShipKind,
  auFromEarth?: number,
  marsOverrideSec?: number | null
): EarthDelay {
  if (kind === 'leo-station') {
    return {
      oneWaySec: 0,
      roundTripSec: 0,
      method: 'leo-negligible',
      label: 'LEO light-time ~0 s (ISS-class)',
      labelKey: 'hrp.delayLeo',
      earthIndependent: false,
    };
  }
  if (kind === 'lunar-south-pole' || kind === 'lunar-habitat') {
    const s = MOON_ONE_WAY_S;
    return {
      oneWaySec: s,
      roundTripSec: s * 2,
      method: 'moon-light-time',
      label: `Moon one-way ${s.toFixed(2)} s (384 400 km / c)`,
      labelKey: 'hrp.delayMoon',
      labelVars: { s: s.toFixed(2) },
      earthIndependent: true,
    };
  }
  if (kind === 'mars-transit') {
    if (marsOverrideSec != null && Number.isFinite(marsOverrideSec) && marsOverrideSec > 0) {
      const s = marsOverrideSec;
      return {
        oneWaySec: s,
        roundTripSec: s * 2,
        method: 'mars-override',
        label: `Mars one-way ${formatDelay(s)} (crew-selected; not JPL Horizons)`,
        labelKey: 'hrp.delayMarsOverride',
        labelVars: { delay: formatDelay(s) },
        earthIndependent: true,
      };
    }
    const computed = auFromEarth != null ? delayFromAu(auFromEarth) : 4 * 60;
    const clamped = Math.min(22 * 60, Math.max(4 * 60, computed));
    return {
      oneWaySec: clamped,
      roundTripSec: clamped * 2,
      method: 'mars-sim-au',
      label: `Mars one-way ${formatDelay(clamped)} from simulated AU (circular-orbit analog, not JPL Horizons)`,
      labelKey: 'hrp.delayMarsAu',
      labelVars: { delay: formatDelay(clamped) },
      earthIndependent: true,
    };
  }
  return {
    oneWaySec: 0,
    roundTripSec: 0,
    method: 'leo-negligible',
    label: 'Unknown station — delay treated as 0 s',
    labelKey: 'hrp.delayUnknown',
    earthIndependent: false,
  };
}

export function formatDelay(sec: number): string {
  if (sec < 2) return `${sec.toFixed(2)} s`;
  if (sec < 90) return `${Math.round(sec)} s`;
  const m = Math.floor(sec / 60);
  const r = Math.round(sec % 60);
  if (m < 60) return r ? `${m} min ${r} s` : `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

export function classifyAction(actionId: string): ActionClass {
  if ((GROUND_ACTIONS as readonly string[]).includes(actionId)) return 'needs_ground';
  return 'crew_autonomous';
}

export function queueEtaMs(oneWaySec: number, sentAt: number, now: number): number {
  const deliverAt = sentAt + Math.max(0, oneWaySec) * 1000;
  return Math.max(0, deliverAt - now);
}
