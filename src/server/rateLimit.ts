/**
 * Best-effort in-memory limiter for the public demo.
 * Serverless instances do not share memory, so this is a brake — not a guarantee.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 30;

function prune(now: number) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function consumeRateLimit(key: string): {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
  limit: number;
} {
  const now = Date.now();
  prune(now);
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: MAX_REQUESTS - 1, retryAfterSec: Math.ceil(WINDOW_MS / 1000), limit: MAX_REQUESTS };
  }
  existing.count += 1;
  const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count > MAX_REQUESTS) {
    return { ok: false, remaining: 0, retryAfterSec, limit: MAX_REQUESTS };
  }
  return { ok: true, remaining: MAX_REQUESTS - existing.count, retryAfterSec, limit: MAX_REQUESTS };
}

export function applyRateLimitHeaders(
  res: { setHeader(name: string, value: string | number): unknown },
  result: ReturnType<typeof consumeRateLimit>
) {
  res.setHeader('X-RateLimit-Limit', result.limit);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', result.retryAfterSec);
  if (!result.ok) {
    res.setHeader('Retry-After', result.retryAfterSec);
  }
}
