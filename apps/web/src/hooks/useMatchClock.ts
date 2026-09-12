import { useEffect, useState } from 'react';
import { formatMatchClock, LIVE_IDLE_INTERVAL_MS, type LiveMatchSummary } from '@fb/shared';

export function useMatchClock(live: LiveMatchSummary | null | undefined) {
  const [now, setNow] = useState(Date.now());
  const [receivedAt, setReceivedAt] = useState(Date.now());
  useEffect(() => { setReceivedAt(Date.now()); }, [live?.revision, live?.matchId]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);
  if (!live) return { clock: '', stale: false };
  const age = Math.max(0, now - receivedAt);
  const normalEnd = live.period === 1 ? 2700 : 5400;
  const announcedEnd = normalEnd + live.addedMinutes[live.period - 1]! * 60;
  const bound = Math.max(live.second, announcedEnd - 1);
  // Board cards may receive idle-mode snapshots every five seconds. Smooth the
  // clock between them, then freeze in place; never roll it back on a stale feed
  // or invent the next phase before the server commits it.
  const displaySecond = live.phase === 'LIVE'
    ? Math.min(bound, live.second + Math.min(age, LIVE_IDLE_INTERVAL_MS) * 0.02) : live.second;
  return { clock: formatMatchClock(displaySecond, live.period, live.phase),
    stale: age > 6000 && (live.phase === 'LIVE' || live.phase === 'HALFTIME') };
}
