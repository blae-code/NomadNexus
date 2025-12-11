import { useEffect, useState } from 'react';
import { useLiveKit } from './useLiveKit.jsx';

/**
 * usePTT - push-to-talk keyboard handler.
 * Listens for Spacebar presses and calls LiveKit's setMicrophoneEnabled.
 * This is a global listener.
 * 
 * @param {Object} options - Optional configuration
 * @param {Function} options.onPTTChange - Callback when PTT state changes
 * @returns {Object} - { isPTTActive, setPTTActive }
 */
export const usePTT = (options = {}) => {
  let liveKitContext;
  let setMicrophoneEnabled;
  
  try {
    liveKitContext = useLiveKit();
    setMicrophoneEnabled = liveKitContext?.setMicrophoneEnabled;
  } catch (e) {
    console.warn('[usePTT] LiveKit context not available:', e.message);
    setMicrophoneEnabled = null;
  }
  
  const [isPTTActive, setIsPTTActive] = useState(false);
  const { onPTTChange } = options;

  const setPTTActive = (active) => {
    setIsPTTActive(active);
    if (setMicrophoneEnabled && typeof setMicrophoneEnabled === 'function') {
      try {
        setMicrophoneEnabled(active);
      } catch (e) {
        console.warn('[usePTT] Error setting microphone:', e.message);
      }
    }
    if (onPTTChange && typeof onPTTChange === 'function') {
      try {
        onPTTChange(active);
      } catch (e) {
        console.warn('[usePTT] Error in onPTTChange callback:', e.message);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Prevent PTT when typing in an input
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }
      if (event.code === 'Space' && !event.repeat) {
        setPTTActive(true);
      }
    };
    const handleKeyUp = (event) => {
      // Prevent PTT when typing in an input
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }
      if (event.code === 'Space') {
        setPTTActive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Ensure mic is turned off when component unmounts
      setPTTActive(false);
    };
  }, []);

  return { isPTTActive, setPTTActive };
};
