/** Minimal request/response shapes shared by Express and Vercel Node functions. */

export interface ApiRequest {
  method?: string;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): unknown;
  setHeader(name: string, value: string | number): unknown;
}

export function headerValue(headers: ApiRequest['headers'], name: string): string {
  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0] || '';
  return raw || '';
}

export function queryFlag(query: ApiRequest['query'] | undefined, key: string): boolean {
  const value = query?.[key];
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === '1' || raw === 'true';
}

export function clientIp(req: ApiRequest): string {
  const forwarded = headerValue(req.headers, 'x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = headerValue(req.headers, 'x-real-ip');
  if (realIp) return realIp.trim();
  return req.socket?.remoteAddress || 'unknown';
}
