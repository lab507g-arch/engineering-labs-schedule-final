import type { TermConfig } from '@/types';
import { parseDateLocal, toDateKey, daysBetween } from '@/utils/dates';

export interface TermStatus {
  config: TermConfig;
  startDate: Date;
  endDate: Date;
  currentWeek: number;
  isCompleted: boolean;
  isactive: boolean;
  totalDays: number;
  elapsedDays: number;
}

export function getTermStatus(term: TermConfig, now: Date): TermStatus {
  const startDate = parseDateLocal(term.startDate);
  const totalDays = term.weeks * 7;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + totalDays - 1);

  const elapsedDays = daysBetween(now, startDate);
  const currentWeek = Math.floor(elapsedDays / 7) + 1;
  const isCompleted = elapsedDays >= totalDays;
  const isactive = elapsedDays >= 0 && !isCompleted;

  return {
    config: term,
    startDate,
    endDate,
    currentWeek,
    isCompleted,
    isactive,
    totalDays,
    elapsedDays,
  };
}
