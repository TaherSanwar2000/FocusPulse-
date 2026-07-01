import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { LiveActivity } from '../native/LiveActivity';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

const SESSION_NAME = 'Deep Work';

export function useFocusTimer(durationMinutes: number) {
  const totalSeconds = durationMinutes * 60;
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const endDateMsRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === 'idle') {
      setRemainingSeconds(totalSeconds);
    }
  }, [totalSeconds, status]);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    if (endDateMsRef.current == null) return;
    const remaining = Math.max(
      0,
      Math.round((endDateMsRef.current - Date.now()) / 1000),
    );
    setRemainingSeconds(remaining);
    if (remaining <= 0) {
      clearTick();
      setStatus('finished');
      LiveActivity.end();
    }
  }, [clearTick]);

  // JS timers throttle in the background — re-sync from the stored end
  // date the moment the app returns to the foreground so the ring
  // doesn't show stale time. The Live Activity itself never needs this:
  // it's rendered natively and keeps ticking with zero JS involvement.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active' && status === 'running') {
        tick();
      }
    });
    return () => subscription.remove();
  }, [status, tick]);

  const start = useCallback(async () => {
    endDateMsRef.current = Date.now() + totalSeconds * 1000;
    setRemainingSeconds(totalSeconds);
    setStatus('running');
    clearTick();
    intervalRef.current = setInterval(tick, 1000);
    await LiveActivity.start({
      sessionName: SESSION_NAME,
      durationSeconds: totalSeconds,
    });
  }, [totalSeconds, tick, clearTick]);

  const pause = useCallback(async () => {
    if (status !== 'running') return;
    clearTick();
    setStatus('paused');
    await LiveActivity.update({ isPaused: true, remainingSeconds });
  }, [status, remainingSeconds, clearTick]);

  const resume = useCallback(async () => {
    if (status !== 'paused') return;
    endDateMsRef.current = Date.now() + remainingSeconds * 1000;
    setStatus('running');
    intervalRef.current = setInterval(tick, 1000);
    await LiveActivity.update({ isPaused: false, remainingSeconds });
  }, [status, remainingSeconds, tick]);

  const reset = useCallback(async () => {
    clearTick();
    endDateMsRef.current = null;
    setStatus('idle');
    setRemainingSeconds(totalSeconds);
    await LiveActivity.end();
  }, [totalSeconds, clearTick]);

  useEffect(() => clearTick, [clearTick]);

  return { status, remainingSeconds, totalSeconds, start, pause, resume, reset };
}
