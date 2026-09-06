import { useState, useEffect, useRef, useCallback } from 'react';

export function useClockSync() {
  const [serverOffsetMs, setServerOffsetMs] = useState<number>(0);
  const offsetRef = useRef<number>(0);

  const syncTime = useCallback(async () => {
    try {
      const t0 = Date.now();
      const res = await fetch('/api/time');
      const t1 = Date.now();
      if (!res.ok) return;

      const data = await res.json();
      const serverTimestamp = data.serverTimestamp;
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

  const getServerNow = useCallback(() => {
    return Date.now() + offsetRef.current;
  }, []);

  return { serverOffsetMs, getServerNow, syncTime };
}
