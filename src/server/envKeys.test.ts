import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_OPENAI_MODEL,
  buildDonkiUrls,
  resolveAiProvider,
  resolveNasaApiKey,
  usableSecret,
} from './envKeys.ts';

const KEYS = [
  'AI_PROVIDER',
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  'OPENAI_API_KEY',
  'OPENAI_MODEL',
  'NASA_API_KEY',
] as const;

const saved: Record<string, string | undefined> = {};

function snapshotEnv() {
  for (const k of KEYS) saved[k] = process.env[k];
}

function restoreEnv() {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
}

function clearAiEnv() {
  delete process.env.AI_PROVIDER;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_MODEL;
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_MODEL;
}

describe('usableSecret', () => {
  it('rejects empty and placeholder values', () => {
    expect(usableSecret('')).toBeNull();
    expect(usableSecret('   ')).toBeNull();
    expect(usableSecret('MY_GEMINI_API_KEY')).toBeNull();
    expect(usableSecret('MY_OPENAI_API_KEY')).toBeNull();
    expect(usableSecret('YOUR_API_KEY')).toBeNull();
  });

  it('accepts a trimmed real-looking value', () => {
    expect(usableSecret('  sk-live-abc  ')).toBe('sk-live-abc');
  });
});

describe('resolveAiProvider', () => {
  snapshotEnv();
  afterEach(restoreEnv);

  it('is offline when no keys are set', () => {
    const r = resolveAiProvider({});
    expect(r.provider).toBe('offline');
    expect(r.offlineReason).toBe('no_key');
    expect(r.geminiModel).toBe(DEFAULT_GEMINI_MODEL);
    expect(r.openaiModel).toBe(DEFAULT_OPENAI_MODEL);
  });

  it('honors AI_PROVIDER=offline even when keys exist', () => {
    const r = resolveAiProvider({
      AI_PROVIDER: 'offline',
      GEMINI_API_KEY: 'real-gemini',
      OPENAI_API_KEY: 'real-openai',
    });
    expect(r.provider).toBe('offline');
    expect(r.offlineReason).toBe('forced');
  });

  it('uses Gemini when AI_PROVIDER=gemini and the key is set', () => {
    const r = resolveAiProvider({
      AI_PROVIDER: 'gemini',
      GEMINI_API_KEY: 'real-gemini',
      GEMINI_MODEL: 'gemini-custom',
    });
    expect(r.provider).toBe('gemini');
    expect(r.geminiKey).toBe('real-gemini');
    expect(r.geminiModel).toBe('gemini-custom');
  });

  it('falls back offline when AI_PROVIDER=gemini but the key is a placeholder', () => {
    const r = resolveAiProvider({ AI_PROVIDER: 'gemini', GEMINI_API_KEY: 'MY_GEMINI_API_KEY' });
    expect(r.provider).toBe('offline');
    expect(r.offlineReason).toBe('no_key');
  });

  it('uses OpenAI when AI_PROVIDER=openai and the key is set', () => {
    const r = resolveAiProvider({
      AI_PROVIDER: 'openai',
      OPENAI_API_KEY: 'sk-test',
      OPENAI_MODEL: 'gpt-4o',
    });
    expect(r.provider).toBe('openai');
    expect(r.openaiKey).toBe('sk-test');
    expect(r.openaiModel).toBe('gpt-4o');
  });

  it('does not silently use Gemini when OpenAI is requested without a key', () => {
    const r = resolveAiProvider({
      AI_PROVIDER: 'openai',
      GEMINI_API_KEY: 'real-gemini',
    });
    expect(r.provider).toBe('offline');
    expect(r.offlineReason).toBe('no_key');
  });

  it('auto-selects Gemini over OpenAI when both keys exist and provider is unset', () => {
    const r = resolveAiProvider({
      GEMINI_API_KEY: 'real-gemini',
      OPENAI_API_KEY: 'sk-test',
    });
    expect(r.provider).toBe('gemini');
  });

  it('auto-selects OpenAI when only that key is set', () => {
    const r = resolveAiProvider({ OPENAI_API_KEY: 'sk-test' });
    expect(r.provider).toBe('openai');
  });
});

describe('resolveNasaApiKey', () => {
  it('falls back to DEMO_KEY for unset, DEMO_KEY, and placeholders', () => {
    expect(resolveNasaApiKey({}).mode).toBe('demo_key');
    expect(resolveNasaApiKey({}).key).toBe('DEMO_KEY');
    expect(resolveNasaApiKey({ NASA_API_KEY: 'DEMO_KEY' }).mode).toBe('demo_key');
    expect(resolveNasaApiKey({ NASA_API_KEY: 'MY_NASA_API_KEY' }).mode).toBe('demo_key');
  });

  it('uses a registered key when provided', () => {
    const r = resolveNasaApiKey({ NASA_API_KEY: 'abc123registered' });
    expect(r.mode).toBe('nasa_api_key');
    expect(r.key).toBe('abc123registered');
  });
});

describe('buildDonkiUrls', () => {
  it('includes GST, CME (with endDate), SEP, and notifications — never FLR', () => {
    const urls = buildDonkiUrls('2026-11-04', '2026-11-11', 'DEMO_KEY');
    const joined = Object.values(urls).join('\n');
    expect(joined).not.toMatch(/\/FLR/);
    expect(urls.gst).toContain('/DONKI/GST?');
    expect(urls.cme).toContain('/DONKI/CME?');
    expect(urls.sep).toContain('/DONKI/SEP?');
    expect(urls.notifications).toContain('/DONKI/notifications?');
    for (const url of Object.values(urls)) {
      expect(url).toContain('startDate=2026-11-04');
      expect(url).toContain('endDate=2026-11-11');
      expect(url).toContain('api_key=DEMO_KEY');
      expect(url.startsWith('https://api.nasa.gov/')).toBe(true);
    }
    expect(urls.notifications).toContain('type=all');
  });
});

describe('env isolation helper (healthPacking offline path)', () => {
  snapshotEnv();
  afterEach(() => {
    restoreEnv();
    clearAiEnv();
  });

  it('clearing keys leaves the resolver offline', () => {
    clearAiEnv();
    expect(resolveAiProvider().provider).toBe('offline');
  });
});
