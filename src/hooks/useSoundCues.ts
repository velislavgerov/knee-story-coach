import { useCallback, useEffect, useRef } from 'react';

interface SoundCueOptions {
  enabled: boolean;
  reducedMotion: boolean;
}

export function useSoundCues({ enabled, reducedMotion }: SoundCueOptions) {
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, []);

  const canPlay = useCallback(() => {
    if (!enabled || reducedMotion) return false;
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, [enabled, reducedMotion]);

  const withContext = useCallback((play: (ctx: AudioContext) => void) => {
    if (!canPlay()) return;
    const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new Ctx();
    }

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    play(ctx);
  }, [canPlay]);

  const playTransition = useCallback(() => {
    withContext((ctx) => {
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.03, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

      [660, 820].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        osc.connect(gain);
        osc.start(now + idx * 0.06);
        osc.stop(now + 0.18 + idx * 0.06);
      });
    });
  }, [withContext]);

  const playTick = useCallback(() => {
    withContext((ctx) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(960, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.015, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    });
  }, [withContext]);

  return { playTransition, playTick };
}
