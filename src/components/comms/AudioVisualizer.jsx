import React from 'react';
import { useLiveKit, AUDIO_STATE } from '@/hooks/useLiveKit';
import { cn } from '@/lib/utils';

const AudioVisualizer = () => {
  const { audioState, localAudioLevel } = useLiveKit();

  const isTransmitting = audioState === AUDIO_STATE.CONNECTED_OPEN;
  const volume = isTransmitting ? localAudioLevel : 0;

  const barColor = volume > 0.3 ? 'bg-emerald-500' : 'bg-amber-500';

  // Create a more dynamic visualization by varying bar heights slightly
  const bars = Array(16).fill(0).map((_, i) => {
    const randomFactor = (i % 2 === 0) ? Math.random() * 0.4 + 0.6 : Math.random() * 0.2 + 0.8;
    const height = Math.max(5, Math.min(100, volume * randomFactor * 120));
    return height;
  });

  return (
    <div className="flex items-center justify-center h-10 bg-zinc-950/50 border-y border-zinc-900 px-2">
      <div className="w-full h-full flex items-end justify-center gap-[2px]">
        {bars.map((height, i) => (
          <div
            key={i}
            className={cn('w-full rounded-t-sm transition-all duration-75', barColor)}
            style={{ height: `${height}%`, opacity: volume > 0.01 ? 1 : 0.5, filter: `brightness(${0.5 + volume * 1.5})` }}
          />
        ))}
      </div>
    </div>
  );
};

export default AudioVisualizer;
