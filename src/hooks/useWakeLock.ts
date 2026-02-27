import { useEffect, useMemo, useRef } from 'react';

type WakeSentinel = {
  released?: boolean;
  release: () => Promise<void>;
};

export function useWakeLock(active: boolean): { supported: boolean } {
  const wakeLockRef = useRef<WakeSentinel | null>(null);
  const supported = useMemo(
    () => typeof navigator !== 'undefined' && 'wakeLock' in navigator,
    [],
  );

  useEffect(() => {
    if (!supported) return undefined;

    const releaseLock = async () => {
      if (!wakeLockRef.current) return;
      try {
        await wakeLockRef.current.release();
      } catch {
        // ignore release failures
      } finally {
        wakeLockRef.current = null;
      }
    };

    const requestLock = async () => {
      if (!active || document.visibilityState !== 'visible') return;
      if (wakeLockRef.current && wakeLockRef.current.released === false) return;
      try {
        const wake = await (navigator as Navigator & { wakeLock: { request: (type: 'screen') => Promise<WakeSentinel> } }).wakeLock.request('screen');
        wakeLockRef.current = wake;
      } catch {
        wakeLockRef.current = null;
      }
    };

    const onVisibilityChange = () => {
      if (!active) return;
      if (document.visibilityState === 'visible') {
        void requestLock();
      } else {
        void releaseLock();
      }
    };

    if (active) {
      void requestLock();
    } else {
      void releaseLock();
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      void releaseLock();
    };
  }, [active, supported]);

  return { supported };
}
