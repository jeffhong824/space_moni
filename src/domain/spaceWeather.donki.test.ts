import { describe, expect, it } from 'vitest';
import { aggregateDonki, type DataSourceReport, type SourceStatus } from './spaceWeather.ts';

function src(id: string, status: SourceStatus): DataSourceReport {
  return {
    id,
    name: id,
    agency: 'NASA',
    endpoint: 'https://api.nasa.gov/DONKI',
    docsUrl: 'https://ccmc.gsfc.nasa.gov/donki/',
    status,
    observedAt: status === 'ok' ? '2026-11-11T00:00:00Z' : null,
    fetchedAt: '2026-11-11T01:00:00Z',
    latencyMs: 12,
    noteZh: status,
  };
}

const IDS = ['nasa-donki-gst', 'nasa-donki-cme', 'nasa-donki-sep', 'nasa-donki-notifications'] as const;

describe('aggregateDonki', () => {
  it('ok when every endpoint is ok', () => {
    const a = aggregateDonki(IDS.map((id) => src(id, 'ok')));
    expect(a.status).toBe('ok');
    expect(a.endpoints).toHaveLength(4);
    expect(a.observedAt).toBeTruthy();
  });

  it('empty when the 7-day window has no events (all empty)', () => {
    const a = aggregateDonki(IDS.map((id) => src(id, 'empty')));
    expect(a.status).toBe('empty');
  });

  it('degraded when some endpoints fail and some succeed', () => {
    const a = aggregateDonki([
      src('nasa-donki-gst', 'ok'),
      src('nasa-donki-cme', 'error'),
      src('nasa-donki-sep', 'ok'),
      src('nasa-donki-notifications', 'timeout'),
    ]);
    expect(a.status).toBe('degraded');
  });

  it('error when every endpoint errors', () => {
    const a = aggregateDonki(IDS.map((id) => src(id, 'error')));
    expect(a.status).toBe('error');
  });
});
