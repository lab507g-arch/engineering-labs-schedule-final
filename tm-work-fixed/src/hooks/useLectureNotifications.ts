import { useEffect, useRef, useCallback } from 'react';
import type { LabSession, DayKey } from '@/types';
import {
  dateToDayKey,
  timeToMinutes,
  parseDateLocal,
  toDateKey,
  daysBetween,
  type ProcessedHoliday,
} from '@/utils/dates';
import type { Translation } from '@/i18n';

interface NotificationState {
  enabled: boolean;
  enable: () => Promise<boolean>;
  disable: () => void;
}

/**
 * Monitors sessions and fires browser notifications when lectures start or end.
 * Uses the live clock's `now` to detect transitions.
 */
export function useLectureNotifications(
  now: Date,
  sessions: LabSession[],
  enabled: boolean,
  t: Translation,
  holidays: ProcessedHoliday[] = []
): NotificationState {
  const notifiedStarts = useRef<Set<string>>(new Set());
  const notifiedEnds = useRef<Set<string>>(new Set());
  const notifiedPre = useRef<Set<string>>(new Set());
  const lastVacationCheck = useRef<number>(0);

  const enable = useCallback(async (): Promise<boolean> => {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    try {
      const result = await Notification.requestPermission();
      return result === 'granted';
    } catch {
      return false;
    }
  }, []);

  const disable = useCallback(() => {
    notifiedStarts.current.clear();
    notifiedEnds.current.clear();
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const currentDay = dateToDayKey(now);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentSecs = now.getSeconds();

    // Only fire notifications near the exact minute boundary (within first 15 seconds)
    if (currentSecs > 15) return;

    for (const s of sessions) {
      if (s.day !== currentDay) continue;
      const startMin = timeToMinutes(s.startTime);
      const endMin = timeToMinutes(s.endTime);

      if (currentMinutes === startMin && !notifiedStarts.current.has(s.id)) {
        notifiedStarts.current.add(s.id);
        try {
          new Notification(t.notificationStart
            .replace('{course}', s.course)
            .replace('{lab}', s.lab));
        } catch { /* ignore */ }
      }

      if (currentMinutes === endMin && !notifiedEnds.current.has(s.id)) {
        notifiedEnds.current.add(s.id);
        try {
          new Notification(t.notificationEnd
            .replace('{course}', s.course)
            .replace('{lab}', s.lab));
        } catch { /* ignore */ }
      }

      // 10 minutes before the session starts
      if (currentMinutes === startMin - 10 && !notifiedPre.current.has(s.id)) {
        notifiedPre.current.add(s.id);
        try {
          new Notification(
            `⏰ محاضرة قادمة: ${s.course} في ${s.lab} تبدأ الساعة ${s.startTime}`
          );
          console.log('[notifications] session reminder scheduled/fired', s.id, s.startTime);
        } catch { /* ignore */ }
      }
    }
  }, [now, sessions, enabled, t]);

  // Vacation notifications: check on load and every 12 hours.
  useEffect(() => {
    if (!enabled) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    const stamp = now.getTime();
    if (lastVacationCheck.current !== 0 && stamp - lastVacationCheck.current < TWELVE_HOURS) return;
    lastVacationCheck.current = stamp;

    let notified: string[] = [];
    try {
      const raw = localStorage.getItem('notified_vacations');
      if (raw) notified = JSON.parse(raw) as string[];
    } catch { notified = []; }

    const today = parseDateLocal(toDateKey(now));
    let changed = false;

    for (const h of holidays) {
      const date = parseDateLocal(h.effectiveDate);
      if (date.getDay() === 5) continue; // Friday is a permanent weekly holiday
      if (daysBetween(date, today) !== 2) continue;
      const key = `${h.id}|${h.effectiveDate}`;
      if (notified.includes(key)) continue;
      notified.push(key);
      changed = true;
      try {
        new Notification(
          `🏖️ تذكير: إجازة ${h.name} تبدأ بعد يومين في ${h.effectiveDate}`
        );
        console.log('[notifications] vacation reminder fired', key);
      } catch { /* ignore */ }
    }

    if (changed) {
      try {
        localStorage.setItem('notified_vacations', JSON.stringify(notified));
      } catch { /* ignore */ }
    }
  }, [now, holidays, enabled]);

  return { enabled, enable, disable };
}
