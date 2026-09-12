import { useLayoutEffect, useRef } from 'react';
import { PitchMotion, pitchLayout, type MatchCenterDto } from '@fb/shared';

/** Paint only SVG transforms at display cadence; React still owns match data. */
export function usePitchMotion(match: MatchCenterDto) {
  const svg = useRef<SVGSVGElement>(null);
  const animation = useRef<{ update: (next: MatchCenterDto) => void } | null>(null);

  useLayoutEffect(() => {
    const root = svg.current;
    if (!root) return;
    const motion = new PitchMotion(pitchLayout(match));
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let players: SVGGElement[] = [];
    let ball: SVGGElement | null = null;
    let ballSurface: SVGGElement | null = null;
    let trail: SVGPathElement | null = null;
    let phase = match.live?.phase;
    let lastUpdate = performance.now();
    let lastFrame = lastUpdate;
    let frame: number | null = null;

    function paint() {
      for (const node of players) {
        const point = motion.players.get(node.dataset.playerId!);
        if (point) node.setAttribute('transform', `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`);
      }
      ball?.setAttribute('transform', `translate(${motion.ball.x.toFixed(2)} ${motion.ball.y.toFixed(2)})`);
      ballSurface?.setAttribute('transform', `rotate(${motion.ballRotation.toFixed(1)})`);
      trail?.setAttribute('d', motion.trail.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
    }
    function tick(now: number) {
      frame = null;
      if (document.hidden || preference.matches || phase !== 'LIVE') return;
      motion.advance(now - lastFrame, now);
      lastFrame = now;
      paint();
      // Finish the current movement, then stop drawing if the feed goes stale.
      if (now - lastUpdate < 4000) frame = requestAnimationFrame(tick);
    }
    function resume() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      if (document.hidden) return;
      if (preference.matches || phase !== 'LIVE') { motion.snap(); paint(); return; }
      lastFrame = performance.now();
      frame = requestAnimationFrame(tick);
    }
    function update(next: MatchCenterDto) {
      players = [...root!.querySelectorAll<SVGGElement>('[data-player-id]')];
      ball = root!.querySelector<SVGGElement>('.live-ball');
      ballSurface = root!.querySelector<SVGGElement>('.live-ball-surface');
      trail = root!.querySelector<SVGPathElement>('.live-ball-trail');
      phase = next.live?.phase;
      const animateEvents = !document.hidden && !preference.matches && performance.now() - lastUpdate < 4000;
      lastUpdate = performance.now();
      motion.retarget(pitchLayout(next), lastUpdate, animateEvents);
      paint();
      resume();
    }
    animation.current = { update };
    update(match);
    document.addEventListener('visibilitychange', resume);
    preference.addEventListener('change', resume);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', resume);
      preference.removeEventListener('change', resume);
      animation.current = null;
    };
    // This animation controller survives all score/clock/roster revisions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id]);

  useLayoutEffect(() => { animation.current?.update(match); }, [match]);
  return svg;
}
