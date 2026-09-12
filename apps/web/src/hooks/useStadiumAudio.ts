import { useEffect, useRef, useState } from 'react';
import type { LiveEvent, MatchPhase } from '@fb/shared';

const PREFERENCE = 'touchline-stadium-sound';
const OWNER = 'touchline-stadium-audio-owner';

/** Original, procedurally generated crowd and whistle sounds; no sampled recordings. */
export function useStadiumAudio(phase: MatchPhase | undefined, moment: LiveEvent | null) {
  const [enabled, setEnabled] = useState(false);
  const [preferred, setPreferred] = useState(() => {
    try { return localStorage.getItem(PREFERENCE) === 'on'; } catch { return false; }
  });
  const [error, setError] = useState<string | null>(null);
  const context = useRef<AudioContext | null>(null);
  const crowd = useRef<GainNode | null>(null);
  const owner = useRef(`sound-${Math.random().toString(36).slice(2)}`);
  const lastMoment = useRef<number | null>(null);

  async function toggle() {
    if (enabled) {
      await context.current?.suspend();
      setEnabled(false); setPreferred(false);
      try { localStorage.setItem(PREFERENCE, 'off'); } catch { /* Storage is optional. */ }
      return;
    }
    try {
      context.current ??= new AudioContext();
      const ctx = context.current;
      if (!crowd.current) {
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let previous = 0;
        for (let i = 0; i < data.length; i++) {
          previous = (previous + (Math.random() * 2 - 1) * 0.04) / 1.02;
          data[i] = previous * 3;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer; source.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 1200;
        const gain = ctx.createGain(); gain.gain.value = 0.13;
        source.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        source.start(); crowd.current = gain;
      }
      await ctx.resume();
      if (ctx.state !== 'running') throw new Error('Sound could not start. Try enabling it again.');
      lastMoment.current = moment?.sequence ?? null;
      try { localStorage.setItem(PREFERENCE, 'on'); localStorage.setItem(OWNER, owner.current); } catch { /* Optional. */ }
      setEnabled(true); setPreferred(true); setError(null);
    } catch { setError('Sound is unavailable in this browser. The match will continue.'); }
  }

  useEffect(() => {
    function silence() {
      if (document.hidden) { void context.current?.suspend(); setEnabled(false); }
    }
    function storage(event: StorageEvent) {
      if (event.key === OWNER && event.newValue !== owner.current) { void context.current?.suspend(); setEnabled(false); }
    }
    document.addEventListener('visibilitychange', silence);
    window.addEventListener('storage', storage);
    return () => {
      document.removeEventListener('visibilitychange', silence); window.removeEventListener('storage', storage);
      void context.current?.close(); context.current = null; crowd.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !context.current || !crowd.current) return;
    crowd.current.gain.setTargetAtTime(phase === 'LIVE' ? 0.13 : 0.04, context.current.currentTime, 0.6);
  }, [enabled, phase]);

  useEffect(() => {
    if (!moment || !enabled || !context.current || lastMoment.current === moment.sequence) return;
    lastMoment.current = moment.sequence;
    const ctx = context.current;
    if (moment.type === 'GOAL' && crowd.current) {
      crowd.current.gain.cancelScheduledValues(ctx.currentTime);
      crowd.current.gain.setTargetAtTime(0.65, ctx.currentTime, 0.15);
      crowd.current.gain.setTargetAtTime(0.13, ctx.currentTime + 2, 0.7);
    } else if (['HALFTIME', 'FULL_TIME', 'RED_CARD'].includes(moment.type)) {
      const whistle = ctx.createOscillator();
      const gain = ctx.createGain();
      whistle.type = 'sine'; whistle.frequency.value = 2350;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.025, ctx.currentTime + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      whistle.connect(gain); gain.connect(ctx.destination);
      whistle.start(); whistle.stop(ctx.currentTime + 0.5);
      whistle.onended = () => { whistle.disconnect(); gain.disconnect(); };
    }
  }, [enabled, moment]);
  return { enabled, preferred, error, toggle };
}
