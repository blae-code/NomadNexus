import { useEffect, useState } from 'react';
import { useLiveKit } from './useLiveKit';

export const usePTT = ({ onPTTChange } = {}) => {
  const [isPTTActive, setPTTActive] = useState(false);

  useEffect(() => {
    if (onPTTChange) onPTTChange(isPTTActive);
  }, [isPTTActive, onPTTChange]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') setPTTActive(true);
    };
    const handleKeyUp = (event) => {
      if (event.code === 'Space') setPTTActive(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return { isPTTActive, setPTTActive };
};
