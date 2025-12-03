import React, { useState, useEffect } from 'react';
import { useLiveKit, AUDIO_STATE } from '@/hooks/useLiveKit';

const AudioVisualizer = () => {
  const { audioState } = useLiveKit();
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    let interval;
    if (audioState === AUDIO_STATE.CONNECTED_OPEN) {
      interval = setInterval(() => {
        // Simulate microphone volume
        setVolume(Math.random());
      }, 100);
    } else {
      setVolume(0);
    }
    return () => clearInterval(interval);
  }, [audioState]);

  const barColor = volume > 0.5 ? 'bg-indicator-green' : 'bg-burnt-orange';
  const barHeight = `${Math.max(10, volume * 100)}%`;

  return (
    <div className="flex items-center justify-center h-24 bg-gunmetal p-4">
      <div className="w-full h-full flex items-end justify-center gap-1">
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className={`w-full ${barColor}`}
            style={{ height: `${Math.max(10, Math.random() * volume * 100)}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default AudioVisualizer;
