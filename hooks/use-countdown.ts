import { useEffect, useState } from 'react';

import { formatCountdown } from '@/lib/formatting';

/**
 * Countdown hook that updates every 60 seconds.
 * Returns a formatted string like "5h 30m" or "Now".
 */
export function useCountdown(scheduleHour: number, scheduleMinute: number): string {
  const getNextUploadMillis = () => {
    const now = new Date();
    const target = new Date();
    target.setHours(scheduleHour, scheduleMinute, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    return target.getTime();
  };

  const [targetMillis, setTargetMillis] = useState(getNextUploadMillis);

  useEffect(() => {
    setTargetMillis(getNextUploadMillis());
  }, [scheduleHour, scheduleMinute]);

  const [display, setDisplay] = useState(() => formatCountdown(targetMillis));

  useEffect(() => {
    setDisplay(formatCountdown(targetMillis));
    const interval = setInterval(() => {
      setDisplay(formatCountdown(targetMillis));
    }, 60_000);
    return () => clearInterval(interval);
  }, [targetMillis]);

  return display;
}
