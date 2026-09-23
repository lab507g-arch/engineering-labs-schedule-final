export type DayKey =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

export type TermType = 'first' | 'second' | 'summer';

export interface LabSession {
  id: string;
  day: DayKey;
  startTime: string;
  endTime: string;
  course: string;
  instructor: string;
  lab: string;
  group?: string;
  note?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  endDate?: string;
  description?: string;
}

export interface TermConfig {
  type: TermType;
  startDate: string;
  weeks: number;
}

export const DAYS: { key: DayKey; label: string }[] = [
  { key: 'sunday', label: 'الأحد' },
  { key: 'monday', label: 'الإثنين' },
  { key: 'tuesday', label: 'الثلاثاء' },
  { key: 'wednesday', label: 'الأربعاء' },
  { key: 'thursday', label: 'الخميس' },
  { key: 'saturday', label: 'السبت' },
];
