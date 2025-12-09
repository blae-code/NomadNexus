import { useEffect } from 'react';
import { useLiveKit } from './useLiveKit';

/**
 * usePTT - push-to-talk keyboard handler.
 * Listens for Spacebar presses and calls LiveKit's setMicrophoneEnabled.
 * This is a global listener.
 */
export const usePTT = () => {
  const { setMicrophoneEnabled } = useLiveKit();

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Prevent PTT when typing in an input
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }
      if (event.code === 'Space' && !event.repeat) {
        setMicrophoneEnabled(true);
      }
    };
    const handleKeyUp = (event) => {
      // Prevent PTT when typing in an input
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }
      if (event.code === 'Space') {
        setMicrophoneEnabled(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Ensure mic is turned off when component unmounts
      setMicrophoneEnabled(false);
    };
  }, [setMicrophoneEnabled]);

  // This hook just provides the keyboard listener logic, no state is returned.
  return null;
};
