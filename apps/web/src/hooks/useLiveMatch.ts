import { useEffect, useRef, useState } from 'react';
import { isLiveMatchSummary, isNewerLive, type LiveEvent, type MatchCenterDto } from '@fb/shared';
import { api, readableError } from '../lib/api';
import { getLiveSocket } from '../lib/live';

export function useLiveMatch(matchId: string) {
  const [match, setMatch] = useState<MatchCenterDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [moment, setMoment] = useState<LiveEvent | null>(null);
  const [caughtUp, setCaughtUp] = useState(false);
  const current = useRef<MatchCenterDto | null>(null);

  useEffect(() => {
    let mounted = true;
    let hydrating = true;
    let fetching = false;
    let lastReceived = 0;
    let watchRetry: ReturnType<typeof setTimeout> | undefined;
    current.current = null;
    setMatch(null); setError(null); setMoment(null); setCaughtUp(false);
    const socket = getLiveSocket();

    function receive(payload: unknown) {
      if (!mounted || !payload || typeof payload !== 'object') return;
      const next = payload as MatchCenterDto;
      if (next.id !== matchId || !next.homeTeam || !next.awayTeam
        || (next.live && (!isLiveMatchSummary(next.live) || !Array.isArray(next.live.events)))) return;
      const previous = current.current;
      lastReceived = Date.now();
      setError(null);
      if (previous?.live && (!next.live || !isNewerLive(previous.live, next.live))) {
        if (next.live?.revision === previous.live.revision) hydrating = false;
        return;
      }
      const missing = previous?.live && next.live && (next.live.events[0]?.sequence ?? 0) > previous.live.latestSequence + 1;
      if (!hydrating && !missing && previous?.live && next.live) {
        const fresh = next.live.events.filter(e => e.sequence > previous.live!.latestSequence);
        const important = [...fresh].reverse().find(e => ['GOAL', 'RED_CARD', 'HALFTIME', 'FULL_TIME'].includes(e.type));
        if (important) setMoment(important);
      }
      if ((missing || hydrating) && previous?.live && next.live && next.live.latestSequence > previous.live.latestSequence) setCaughtUp(true);
      hydrating = false;
      current.current = next;
      setMatch(next);
      setError(null);
    }

    async function refresh() {
      if (fetching || !mounted) return;
      fetching = true;
      try { receive(await api.matchCenter(matchId)); }
      catch (cause) { if (mounted) setError(readableError(cause)); }
      finally { fetching = false; }
    }
    function watch() {
      if (!mounted || !socket.connected || document.hidden) return;
      clearTimeout(watchRetry);
      socket.timeout(3000).emit('match:watch', matchId,
        (failure: Error | null, reply?: { watching?: string; error?: string }) => {
          if (!mounted) return;
          // Rapid route changes and React's development remount can hit the
          // server's subscription throttle. A connected transport is not yet
          // proof that we joined the match room: retry until acknowledged.
          if (failure || reply?.error === 'Please retry shortly') {
            watchRetry = setTimeout(watch, failure ? 1000 : 300);
          }
        });
    }
    function connect() {
      hydrating = true;
      setConnected(true);
      watch();
      void refresh();
    }
    function disconnect() { setConnected(false); hydrating = true; }
    function visible() {
      if (document.visibilityState === 'visible') {
        hydrating = true;
        setMoment(null);
        watch();
        void refresh();
      } else {
        hydrating = true;
        setMoment(null);
        clearTimeout(watchRetry);
        socket.emit('match:unwatch');
      }
    }
    socket.on('connect', connect);
    socket.on('disconnect', disconnect);
    socket.on('connect_error', disconnect);
    socket.on('match:snapshot', receive);
    socket.on('match:live:update', receive);
    document.addEventListener('visibilitychange', visible);
    if (socket.connected) connect(); else { socket.connect(); void refresh(); }
    const poll = window.setInterval(() => {
      // With no socket, every poll also renews the eight-second viewer lease.
      // Comparing only response age can skip alternate polls due to latency.
      if (document.visibilityState !== 'hidden' && (!socket.connected || Date.now() - lastReceived >= 5000)) void refresh();
    }, 5000);
    return () => {
      mounted = false;
      clearTimeout(watchRetry);
      socket.emit('match:unwatch');
      socket.off('connect', connect); socket.off('disconnect', disconnect); socket.off('connect_error', disconnect);
      socket.off('match:snapshot', receive); socket.off('match:live:update', receive);
      document.removeEventListener('visibilitychange', visible);
      window.clearInterval(poll);
    };
  }, [matchId]);

  useEffect(() => {
    if (!moment) return;
    const timer = window.setTimeout(() => setMoment(null), 3600);
    return () => window.clearTimeout(timer);
  }, [moment]);
  useEffect(() => {
    if (!caughtUp) return;
    const timer = window.setTimeout(() => setCaughtUp(false), 5000);
    return () => window.clearTimeout(timer);
  }, [caughtUp]);
  return { match, error, connected, moment, caughtUp };
}
