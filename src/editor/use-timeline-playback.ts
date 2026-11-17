import { useEffect, useState } from 'react';

type PlaybackState = { timeMs: number; playing: boolean; speed: number };

const useTimelinePlayback = (durationMs: number) => {
  const [state, setState] = useState<PlaybackState | null>(null);
  const playing = state?.playing ?? false;

  useEffect(() => {
    if (!playing || durationMs === 0) return;
    let previous = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = Math.max(0, now - previous);
      previous = now;
      setState((current) => {
        if (!current?.playing) return current;
        const timeMs = Math.min(durationMs, current.timeMs + elapsed * current.speed);
        return { ...current, timeMs, playing: timeMs < durationMs };
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, playing]);

  return [state, setState] as const;
};

export default useTimelinePlayback;
