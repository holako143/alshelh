import { useState, useEffect, useRef, useCallback } from 'react';
import { safeFetchJson } from '../lib/api-client';

export function useClockSync() {
  const [serverOffsetMs, setServerOffsetMs] = useState<number>(0);
  const offsetRef = useRef<number>(0);

  const syncTime = useCallback(async () => {
    try {
      const t0 = Date.now();
      const res = await safeFetchJson<{ serverTimestamp: number }>('/api/time');
      const t1 = Date.now();
      if (!res.ok || !res.data?.serverTimestamp) return;

      const serverTimestamp = res.data.serverTimestamp;
      const rtt = t1 - t0;
      // Estimated server time at moment t1 is serverTimestamp + rtt/2
      const estimatedServerTimeAtT1 = serverTimestamp + rtt / 2;
      const offset = estimatedServerTimeAtT1 - t1;

      offsetRef.current = offset;
      setServerOffsetMs(offset);
    } catch {
      // Fall back to 0 offset on failure
    }
  }, []);

  useEffect(() => {
    syncTime();
    // Sync every 20 seconds
    const interval = setInterval(syncTime, 20000);
    return () => clearInterval(interval);
  }, [syncTime]);

  const updateFromTimestamp = useCallback((serverTimestamp: number, rttMs = 0) => {
    const tNow = Date.now();
    const estimatedServerTime = serverTimestamp + rttMs / 2;
    const offset = estimatedServerTime - tNow;

    if (offsetRef.current === 0) {
      offsetRef.current = Math.round(offset);
    } else {
      // Exponential moving average filter to smooth out network jitter
      offsetRef.current = Math.round(offsetRef.current * 0.7 + offset * 0.3);
    }
    setServerOffsetMs(offsetRef.current);
  }, []);

  const getServerNow = useCallback(() => {
    return Date.now() + offsetRef.current;
  }, []);

  return { serverOffsetMs, getServerNow, syncTime, updateFromTimestamp };
}
