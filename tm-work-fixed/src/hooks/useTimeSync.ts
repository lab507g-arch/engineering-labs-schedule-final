import { useEffect, useState, useCallback, useRef } from 'react';

interface TimeSyncState {
  /** The authoritative current time, synced from internet. Falls back to device clock. */
  now: Date;
  /** True while fetching from the time API. */
  loading: boolean;
  /** True if the time is from the internet, false if using device clock fallback. */
  isInternetTime: boolean;
  /** Error message if the last fetch failed. */
  error: string | null;
  /** Force a re-sync from the internet time API. */
  resync: () => void;
}

/**
 * Keeps a real-time clock that ticks every second.
 * On mount (and every 10 minutes) it fetches the precise time from a
 * public time API and calculates an offset so the displayed time matches
 * internet time, not the user's potentially-incorrect device clock.
 */
export function useTimeSync(): TimeSyncState {
  const [now, setNow] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(true);
  const [isInternetTime, setIsInternetTime] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef<number>(0); // internetTime - deviceTime in ms

  const syncFromInternet = useCallback(async () => {
    try {
      setLoading(true);
      // timeapi.io returns an ISO 8601 datetime string.
      // Fallback APIs: worldtimeapi.org, time.is
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      let isoString: string | null = null;

      // Try timeapi.io first
      try {
        const res = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Africa/Cairo', {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.dateTime) {
            isoString = data.dateTime;
          }
        }
      } catch {
        // will try next
      }

      // Fallback: worldtimeapi.org
      if (!isoString) {
        clearTimeout(timeoutId);
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 8000);
        try {
          const res2 = await fetch('https://worldtimeapi.org/api/timezone/Africa/Cairo', {
            signal: controller2.signal,
          });
          if (res2.ok) {
            const data2 = await res2.json();
            if (data2.datetime) {
              // datetime: "2026-09-18T10:30:00.123456+02:00"
              isoString = data2.datetime;
            }
          }
        } catch {
          // will try next
        }
        clearTimeout(timeoutId2);
      }

      clearTimeout(timeoutId);

      if (isoString) {
        const internetTime = new Date(isoString).getTime();
        if (!isNaN(internetTime)) {
          offsetRef.current = internetTime - Date.now();
          setIsInternetTime(true);
          setError(null);
          setNow(new Date(internetTime));
        } else {
          throw new Error('Invalid time received');
        }
      } else {
        throw new Error('No time API responded');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Time sync failed');
      setIsInternetTime(false);
      // Keep using device clock with offset 0
      offsetRef.current = 0;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial sync
  useEffect(() => {
    void syncFromInternet();
  }, [syncFromInternet]);

  // Tick every second using the offset
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date(Date.now() + offsetRef.current));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Re-sync every 10 minutes to correct drift
  useEffect(() => {
    const interval = setInterval(() => {
      void syncFromInternet();
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [syncFromInternet]);

  return { now, loading, isInternetTime, error, resync: syncFromInternet };
}
