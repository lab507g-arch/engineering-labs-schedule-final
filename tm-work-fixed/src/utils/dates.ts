import type { DayKey, Holiday } from '@/types';

export const WEEKDAY_KEYS: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/** Returns the DayKey for a Date (0=Sun .. 6=Sat). */
export function dateToDayKey(date: Date): DayKey {
  return WEEKDAY_KEYS[date.getDay()];
}

/** Parse 'HH:MM' into total minutes from midnight. Returns NaN if invalid. */
export function timeToMinutes(time: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return NaN;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

/** Convert minutes from midnight to 'HH:MM' 24h. */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Format 'HH:MM' 24h into 12h Arabic-friendly format: '08:00 ص' / '02:00 م'. */
export function formatTime12h(time: string): string {
  const mins = timeToMinutes(time);
  if (isNaN(mins)) return time;
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? 'م' : 'ص';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Check if `now` (Date) falls within [start, end) on the same day. */
export function isTimeInRange(
  nowMinutes: number,
  start: string,
  end: string
): boolean {
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  if (isNaN(s) || isNaN(e)) return false;
  return nowMinutes >= s && nowMinutes < e;
}

/** Parse a 'YYYY-MM-DD' string as a local date (not UTC). */
export function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Format a Date as 'YYYY-MM-DD'. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Return the Thursday of the same week as `date` (week starts Sunday). */
export function getThursdayOfSameWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun .. 6=Sat
  const diffToThursday = 4 - day; // Thursday = day 4
  d.setDate(d.getDate() + diffToThursday);
  return d;
}

/** Difference in whole calendar days: `a - b`. */
export function daysBetween(a: Date, b: Date): number {
  const ms = parseDateLocal(toDateKey(a)).getTime() - parseDateLocal(toDateKey(b)).getTime();
  return Math.round(ms / 86400000);
}

/** Arabic month names. */
const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

/** Format a date as 'D MonthName YYYY' in Arabic. */
export function formatDateArabic(date: Date): string {
  return `${date.getDate()} ${AR_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** Format a date string (YYYY-MM-DD) as 'D MonthName YYYY' in Arabic. */
export function formatDateStrArabic(dateStr: string): string {
  return formatDateArabic(parseDateLocal(dateStr));
}

/** Is the given weekday a "mid-week" day (Sun–Wed) that triggers rollover? */
export function isMidWeek(dayKey: DayKey): boolean {
  return (
    dayKey === 'sunday' ||
    dayKey === 'monday' ||
    dayKey === 'tuesday' ||
    dayKey === 'wednesday'
  );
}

/**
 * Holiday rollover: if a holiday's date falls Sunday–Wednesday,
 * postpone its effective date to Thursday of the same week.
 * Returns a NEW array with `effectiveDate` added and `rolledOver` flag.
 */
export interface ProcessedHoliday extends Holiday {
  effectiveDate: string;
  rolledOver: boolean;
}

export function processHolidayRollover(holidays: Holiday[]): ProcessedHoliday[] {
  return holidays.map((h) => {
    const date = parseDateLocal(h.date);
    const dk = dateToDayKey(date);
    if (isMidWeek(dk)) {
      const thursday = getThursdayOfSameWeek(date);
      return {
        ...h,
        effectiveDate: toDateKey(thursday),
        rolledOver: true,
      };
    }
    return {
      ...h,
      effectiveDate: h.date,
      rolledOver: false,
    };
  });
}

/**
 * Given processed holidays and "today", return holidays that are
 * upcoming within `advanceDays` (inclusive) from today.
 */
export function getUpcomingHolidays(
  holidays: ProcessedHoliday[],
  today: Date,
  advanceDays: number = 2
): ProcessedHoliday[] {
  const todayKey = parseDateLocal(toDateKey(today));
  return holidays
    .filter((h) => {
      const effDate = parseDateLocal(h.effectiveDate);
      const diff = daysBetween(effDate, todayKey);
      return diff >= 0 && diff <= advanceDays;
    })
    .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
}

/** Check if a given date is a holiday (by effective date). */
export function isDateHoliday(
  holidays: ProcessedHoliday[],
  date: Date
): ProcessedHoliday | null {
  const key = toDateKey(date);
  return holidays.find((h) => h.effectiveDate === key) ?? null;
}
