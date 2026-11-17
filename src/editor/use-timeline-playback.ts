import { useEffect, useState } from 'react';

const initialPlayback = { timeMs: 0, playing: false, speed: 1 };

const useTimelinePlayback = (durationMs: number) => {
  const [state, setState] = useState<typeof initialPlayback | null>(null);
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
