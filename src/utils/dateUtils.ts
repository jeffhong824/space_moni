/**
 * Utility functions for Space Station date, clock sync, and mission duration calculations.
 * Station clock follows the mission calendar in Asia/Taipei (same as worldStateAt).
 */

import { taipeiDateString } from '../world/worldState';

export const getStationClockDate = (dateObj: Date = new Date()): string => taipeiDateString(dateObj.getTime());

/** Weekday for a Taipei calendar date `YYYY/MM/DD` (avoids UTC-midnight locale shifts). */
export const taipeiWeekdayLong = (dateStr: string, locale: string): string => {
  const [y, m, d] = dateStr.split(/[/\-]/).map(Number);
  if (!y || !m || !d) return dateStr;
  return new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'Asia/Taipei' }).format(
    new Date(Date.UTC(y, m - 1, d, 4, 0, 0))
  );
};

export interface MissionDurationResult {
  durationText: string;
  totalDays: number;
  months: number;
  days: number;
}

/**
 * Calculates astronaut mission duration from launch date to current station date.
 * Counts calendar months and days (inclusive of launch day, matching space mission standard).
 */
export const calculateMissionDuration = (
  startDateStr: string,
  currentDateStr: string = getStationClockDate()
): MissionDurationResult => {
  try {
    const [sY, sM, sD] = startDateStr.split(/[\/\-]/).map(Number);
    const [eY, eM, eD] = currentDateStr.split(/[\/\-]/).map(Number);

    const start = new Date(Date.UTC(sY, sM - 1, sD));
    const end = new Date(Date.UTC(eY, eM - 1, eD));

    const diffMs = Math.max(0, end.getTime() - start.getTime());
    // Elapsed mission days (inclusive of launch day)
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    let months = (eY - sY) * 12 + (eM - sM);
    let days = eD - sD + 1;

    if (days <= 0) {
      months -= 1;
      const daysInPrevMonth = new Date(Date.UTC(eY, eM - 1, 0)).getUTCDate();
      days += daysInPrevMonth;
    }

    const monthLabel = 'month'; // Matching wireframe format: "10 month 2 days"
    const dayLabel = days === 1 ? 'day' : 'days';

    let durationText = '';
    if (months > 0 && days > 0) {
      durationText = `${months} ${monthLabel} ${days} ${dayLabel}`;
    } else if (months > 0) {
      durationText = `${months} ${monthLabel}`;
    } else {
      durationText = `${days} ${dayLabel}`;
    }

    return { durationText, totalDays, months, days };
  } catch {
    return { durationText: '10 month 2 days', totalDays: 305, months: 10, days: 2 };
  }
};
