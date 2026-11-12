import type { NasaKeyMode } from '../domain/spaceWeather.ts';

export type AiProviderName = 'gemini' | 'openai' | 'offline';

export interface ResolvedAiProvider {
  provider: AiProviderName;
  geminiKey: string | null;
  openaiKey: string | null;
  geminiModel: string;
  openaiModel: string;
  /** Why live inference was not used, if the resolved provider is offline. */
  offlineReason: 'none' | 'forced' | 'no_key' | 'unknown_provider';
}

const PLACEHOLDER = /^(MY_[A-Z0-9_]+|YOUR[_-]?API[_-]?KEY|changeme|xxx|TODO)$/i;

/** Trimmed secret, or null when empty / placeholder. Never log the return value. */
export function usableSecret(raw: string | undefined | null): string | null {
  const v = (raw ?? '').trim();
  if (!v) return null;
  if (PLACEHOLDER.test(v)) return null;
  return v;
}

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

/**
 * AURA LLM selection. Keys stay on the server — never send them to the client.
 *
 * `AI_PROVIDER=gemini|openai|offline`. Unset = auto (Gemini key, else OpenAI key, else offline).
 * An explicit provider with no usable key falls back to offline rules.
 */
export function resolveAiProvider(env: NodeJS.ProcessEnv = process.env): ResolvedAiProvider {
  const geminiKey = usableSecret(env.GEMINI_API_KEY);
  const openaiKey = usableSecret(env.OPENAI_API_KEY);
  const geminiModel = (env.GEMINI_MODEL || '').trim() || DEFAULT_GEMINI_MODEL;
  const openaiModel = (env.OPENAI_MODEL || '').trim() || DEFAULT_OPENAI_MODEL;
  const requested = (env.AI_PROVIDER || '').trim().toLowerCase();
  const base = { geminiKey, openaiKey, geminiModel, openaiModel };

  if (requested === 'offline') {
    return { ...base, provider: 'offline', offlineReason: 'forced' };
  }
  if (requested === 'gemini') {
    return geminiKey
      ? { ...base, provider: 'gemini', offlineReason: 'none' }
      : { ...base, provider: 'offline', offlineReason: 'no_key' };
  }
  if (requested === 'openai') {
    return openaiKey
      ? { ...base, provider: 'openai', offlineReason: 'none' }
      : { ...base, provider: 'offline', offlineReason: 'no_key' };
  }
  if (geminiKey) return { ...base, provider: 'gemini', offlineReason: 'none' };
  if (openaiKey) return { ...base, provider: 'openai', offlineReason: 'none' };
  return { ...base, provider: 'offline', offlineReason: requested ? 'unknown_provider' : 'no_key' };
}

/**
 * Every `api.nasa.gov` call must go through this key.
 * Unset / placeholder / `DEMO_KEY` → public DEMO_KEY (rate-limited).
 */
export function resolveNasaApiKey(env: NodeJS.ProcessEnv = process.env): { key: string; mode: NasaKeyMode } {
  const raw = (env.NASA_API_KEY || '').trim();
  if (!raw || raw === 'DEMO_KEY' || !usableSecret(raw)) {
    return { key: 'DEMO_KEY', mode: 'demo_key' };
  }
  return { key: raw, mode: 'nasa_api_key' };
}

/** DONKI catalog URLs. FLR is omitted — upstream 404s; flare class comes from GOES X-ray. */
export function buildDonkiUrls(windowStart: string, windowEnd: string, key: string) {
  const q = `startDate=${encodeURIComponent(windowStart)}&endDate=${encodeURIComponent(windowEnd)}&api_key=${encodeURIComponent(key)}`;
  return {
    gst: `https://api.nasa.gov/DONKI/GST?${q}`,
    cme: `https://api.nasa.gov/DONKI/CME?${q}`,
    sep: `https://api.nasa.gov/DONKI/SEP?${q}`,
    notifications: `https://api.nasa.gov/DONKI/notifications?${q}&type=all`,
  };
}
