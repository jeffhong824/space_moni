import type { AuthUser } from '../types';
import { SESSION_KEY } from './routing';

export function readDemoSession(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.account || !parsed?.role || !parsed?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeDemoSession(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearDemoSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}
