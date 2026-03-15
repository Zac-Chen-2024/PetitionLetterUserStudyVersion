import { useState, useEffect, useCallback, useRef } from 'react';

interface TimerState {
  elapsed: number;       // seconds
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  formatted: string;
}

export function useStudyTimer(initialElapsed = 0): TimerState {
  const [elapsed, setElapsed] = useState(initialElapsed);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return { elapsed, isRunning, start, pause, reset, formatted };
}
