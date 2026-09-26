import { useState, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { differenceInMinutes, differenceInHours, parseISO } from 'date-fns';

interface CountdownState {
  hoursLeft: number;
  minutesLeft: number;
  totalMinutesLeft: number;
  isReady: boolean;
  isPast: boolean;
  progressFraction: number; // 0 (just started) → 1 (ready)
  displayText: string;
}

/**
 * useCountdown
 *
 * Tracks the time remaining until a target date.
 * Updates every minute while the app is in the foreground.
 * Pauses when the app goes to background (saves battery).
 * Recalculates on app foreground resume.
 */
export function useCountdown(
  targetDate: string | null,
  startDate?: string | null
): CountdownState {
  const [now, setNow] = useState(() => new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Start ticking
    intervalRef.current = setInterval(() => {
      setNow(new Date());
    }, 60_000); // update every minute

    // Recalculate when app comes to foreground
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        setNow(new Date());
      }
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, []);

  if (!targetDate) {
    return {
      hoursLeft: 0,
      minutesLeft: 0,
      totalMinutesLeft: 0,
      isReady: false,
      isPast: false,
      progressFraction: 0,
      displayText: '—',
    };
  }

  const target = parseISO(targetDate);
  const totalMinsLeft = differenceInMinutes(target, now);
  const hoursLeft = Math.max(0, Math.floor(totalMinsLeft / 60));
  const minutesLeft = Math.max(0, totalMinsLeft % 60);
  const isReady = totalMinsLeft <= 0;
  const isPast = totalMinsLeft < -60; // > 1h past

  // Progress: 0 = just added, 1 = ready
  let progressFraction = 0;
  if (startDate && !isReady) {
    const start = parseISO(startDate);
    const totalDuration = differenceInMinutes(target, start);
    const elapsed = differenceInMinutes(now, start);
    progressFraction = totalDuration > 0
      ? Math.min(1, Math.max(0, elapsed / totalDuration))
      : 0;
  } else if (isReady) {
    progressFraction = 1;
  }

  // Display text
  let displayText: string;
  if (isReady) {
    displayText = 'Ready to decide';
  } else if (hoursLeft === 0) {
    displayText = `${minutesLeft}m`;
  } else if (hoursLeft < 24) {
    displayText = minutesLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${hoursLeft}h`;
  } else {
    const days = Math.floor(hoursLeft / 24);
    const remainingHours = hoursLeft % 24;
    displayText = remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }

  return {
    hoursLeft,
    minutesLeft,
    totalMinutesLeft: Math.max(0, totalMinsLeft),
    isReady,
    isPast,
    progressFraction,
    displayText,
  };
}

/**
 * useIsReady
 * Simplified hook for just the binary ready/not-ready state.
 */
export function useIsReady(targetDate: string | null): boolean {
  const { isReady } = useCountdown(targetDate);
  return isReady;
}
