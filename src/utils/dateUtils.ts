/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Calculates number of days between two YYYY-MM-DD date strings inclusive.
 * Handles single-day events (returns 1) and multi-day spans cleanly.
 */
export const calculateDaysBetween = (startDateStr: string, endDateStr: string): number => {
  if (!startDateStr) return 1;
  if (!endDateStr || startDateStr === endDateStr) return 1;

  const [startY, startM, startD] = startDateStr.split('-').map(Number);
  const [endY, endM, endD] = endDateStr.split('-').map(Number);

  // Use UTC dates to prevent daylight savings or local time zone shifts
  const startUtc = Date.UTC(startY, startM - 1, startD);
  const endUtc = Date.UTC(endY, endM - 1, endD);

  const diffTime = Math.abs(endUtc - startUtc);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
};

/**
 * Checks if a specific date YYYY-MM-DD falls between startDate and endDate inclusive.
 */
export const isDateInRange = (targetDate: string, startDate: string, endDate: string): boolean => {
  return targetDate >= startDate && targetDate <= endDate;
};

/**
 * Returns today's date formatted as YYYY-MM-DD in local time.
 */
export const getTodayDateString = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Generates ISO dates array for an entire month.
 */
export const getDatesInMonth = (year: number, monthIndex: number): string[] => {
  const dates: string[] = [];
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const mStr = String(monthIndex + 1).padStart(2, '0');
  for (let day = 1; day <= daysInMonth; day++) {
    const dStr = String(day).padStart(2, '0');
    dates.push(`${year}-${mStr}-${dStr}`);
  }
  return dates;
};
