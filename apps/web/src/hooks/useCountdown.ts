import { useEffect, useMemo, useState } from 'react';

export interface Countdown {
  isElapsed: boolean;
  label: string;
  compactLabel: string;
}

function calculate(target: string): Countdown {
  const targetTime = new Date(target).getTime();
  if (Number.isNaN(targetTime)) {
    return { isElapsed: false, label: 'Closing time unavailable', compactLabel: 'Time TBC' };
  }

  const difference = Math.max(0, targetTime - Date.now());
  if (difference <= 0) return { isElapsed: true, label: 'Betting is closed', compactLabel: 'Closed' };

  const totalSeconds = Math.floor(difference / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const padded = (value: number) => String(value).padStart(2, '0');

  const compactLabel = days > 0
    ? `${days}d ${padded(hours)}h ${padded(minutes)}m`
    : `${padded(hours)}:${padded(minutes)}:${padded(seconds)}`;

  return {
    isElapsed: false,
    compactLabel,
    label: days > 0
      ? `${days} day${days === 1 ? '' : 's'}, ${hours} hr and ${minutes} min left`
      : `${hours} hr, ${minutes} min and ${seconds} sec left`,
  };
}

export function useCountdown(target: string): Countdown {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  return useMemo(() => calculate(target), [now, target]);
}
