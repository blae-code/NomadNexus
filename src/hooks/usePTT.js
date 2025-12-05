import { useEffect, useState } from 'react';
import { useLiveKit } from './useLiveKit';

export const usePTT = ({
  squadKey = 'Space',
  commandKey = 'AltLeft',
  whisperKey = 'ControlLeft',
  latchKey = 'KeyL',
} = {}) => {
  const { setMicrophoneEnabled, audioState, publishWhisper, stopWhisper, currentWhisperTarget, setBroadcast } = useLiveKit();
  const [latched, setLatched] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (audioState === 'DISCONNECTED') return;
      if (event.code === latchKey) {
        setLatched((prev) => {
          const next = !prev;
          setMicrophoneEnabled(next);
          if (!next) {
            setBroadcast(false);
            stopWhisper();
          }
          return next;
        });
        return;
      }

      if (latched) return;

      if (event.code === squadKey) {
        event.preventDefault();
        setBroadcast(false);
        stopWhisper();
        setMicrophoneEnabled(true);
        return;
      }

      if (event.code === commandKey) {
        event.preventDefault();
        setBroadcast(true);
        setMicrophoneEnabled(true);
        return;
      }

      if (event.code === whisperKey && currentWhisperTarget) {
        event.preventDefault();
        publishWhisper(currentWhisperTarget);
        setMicrophoneEnabled(true);
      }
    };

    const handleKeyUp = (event) => {
      if (audioState === 'DISCONNECTED' || latched) return;
      if ([squadKey, commandKey, whisperKey].includes(event.code)) {
        event.preventDefault();
        setBroadcast(false);
        stopWhisper();
        setMicrophoneEnabled(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [audioState, commandKey, currentWhisperTarget, latchKey, latched, publishWhisper, setBroadcast, setMicrophoneEnabled, squadKey, stopWhisper, whisperKey]);
};
