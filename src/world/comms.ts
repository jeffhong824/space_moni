const KEY = 'spacemoni.hq.messages';

export interface HqMessage {
  id: string;
  shipId: string;
  from: 'hq' | 'crew';
  text: string;
  sentAt: number;
  deliverAt: number;
  ackAt?: number;
  ackText?: string;
  ackKey?: string;
}

export function loadMessages(): HqMessage[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HqMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMessages(list: HqMessage[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-200)));
  } catch {
    /* quota */
  }
}

export function ackKeyForActivity(activityKey: string): string {
  if (activityKey === 'act.eva') return 'comms.ackEva';
  if (activityKey === 'act.sleep' || activityKey === 'act.preSleep') return 'comms.ackSleep';
  if (activityKey === 'act.science') return 'comms.ackScience';
  return 'comms.ackGeneric';
}

export function sendHqMessage(shipId: string, text: string, latencySec: number, now: number, activityKey: string): HqMessage {
  const deliverAt = now + Math.max(0, latencySec) * 1000;
  const msg: HqMessage = {
    id: `msg-${now}-${Math.floor(Math.random() * 1e6)}`,
    shipId,
    from: 'hq',
    text,
    sentAt: now,
    deliverAt,
    ackAt: deliverAt + 8_000,
    ackKey: ackKeyForActivity(activityKey),
  };
  const next = [...loadMessages(), msg];
  saveMessages(next);
  return msg;
}

export function visibleToCrew(msg: HqMessage, now: number): boolean {
  return now >= msg.deliverAt;
}

export function ackVisible(msg: HqMessage, now: number): boolean {
  return msg.ackAt != null && now >= msg.ackAt;
}

export function etaMs(msg: HqMessage, now: number): number {
  return Math.max(0, msg.deliverAt - now);
}

export function formatEta(ms: number): string {
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return `${m}m ${r}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
