/**
 * Mars sol clock (24 h 39 m 35 s), sleep debt, circadian misalignment, PVT trend.
 * Sol length: NASA-STD-3001 Vol 2 rationale on circadian lighting (~24 h 40 min).
 * Sleep debt / PVT values for the demo crew are SIMULATION.
 */
export const SOL_MS = (24 * 3600 + 39 * 60 + 35) * 1000;
export const SOL_CITE = {
  id: 'V2-circadian-mars',
  doc: 'NASA-STD-3001 Volume 2 Rev F §7.6 lighting rationale',
  text: 'A 24-hour and 40-minute cycle for Mars missions will lead to misalignment between the circadian clock and the rhythms the clock controls including sleep, performance, mood.',
};

export interface SolClock {
  solNumber: number;
  solHour: number;
  solMinute: number;
  solSecond: number;
  label: string;
}

export function solClockAt(epochMs: number, nowMs: number): SolClock {
  const elapsed = Math.max(0, nowMs - epochMs);
  const solNumber = Math.floor(elapsed / SOL_MS) + 1;
  const into = elapsed % SOL_MS;
  const totalSec = Math.floor(into / 1000);
  const solHour = Math.floor(totalSec / 3600);
  const solMinute = Math.floor((totalSec % 3600) / 60);
  const solSecond = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    solNumber,
    solHour,
    solMinute,
    solSecond,
    label: `Sol ${solNumber} ${pad(solHour)}:${pad(solMinute)}:${pad(solSecond)} MTC analog`,
  };
}

export function sleepDebtHours(sleepMin: number, targetMin = 420): number {
  return Math.max(0, (targetMin - sleepMin) / 60);
}

/**
 * Circadian misalignment hours vs a 24.0 h schedule when living on a 24.65 h sol.
 * Linear drift per sol — pedagogical SIMULATION, not an actigraphy model.
 */
export function circadianDriftHours(solsLived: number): number {
  const extraMinPerSol = (SOL_MS - 24 * 3600 * 1000) / 60000;
  return (solsLived * extraMinPerSol) / 60;
}

/** PVT reaction-time analog (ms). Higher = worse. SIMULATION. */
export function pvtFromSleep(sleepMin: number, baselineMs = 280): number {
  const debt = sleepDebtHours(sleepMin);
  return Math.round(baselineMs + debt * 18);
}
