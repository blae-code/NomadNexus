import { useEffect } from 'react';
import { useLiveKit } from './useLiveKit';

export const usePTT = () => {
  const { setMicrophoneEnabled, audioState } = useLiveKit();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space' && audioState !== 'DISCONNECTED') {
        event.preventDefault();
        setMicrophoneEnabled(true);
      }
    };

    const handleKeyUp = (event) => {
      if (event.code === 'Space' && audioState !== 'DISCONNECTED') {
        event.preventDefault();
        setMicrophoneEnabled(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setMicrophoneEnabled, audioState]);
};
