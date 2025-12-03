import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const TacticalOverlay = () => {
  const [inference, setInference] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  // Simulate cursor blink
  useEffect(() => {
    const blinker = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(blinker);
  }, []);

  // Simulate AI inference
  useEffect(() => {
    const keywords = ['contact', 'hostile', 'fire'];
    const messages = [
      'We have contact, sector 4.',
      'Hostile ships on approach.',
      'Open fire!',
      'All clear.',
    ];

    let messageIndex = 0;
    const interval = setInterval(() => {
      const message = messages[messageIndex];
      const foundKeyword = keywords.some((keyword) => message.includes(keyword));

      if (foundKeyword) {
        setInference('⚠️ COMBAT DETECTED');
      } else {
        setInference('');
      }

      messageIndex = (messageIndex + 1) % messages.length;
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 h-full flex flex-col justify-center items-center text-center bg-gunmetal">
      <div className="text-tech-white/50 text-sm uppercase">AI Status Inference</div>
      <div className="mt-4 text-2xl font-black">
        {inference ? (
          <span className="text-indicator-red animate-pulse">{inference}</span>
        ) : (
          <span className="text-tech-white/80">
            SYSTEM: MONITORING COMMS...
            <span className={cn('ml-2', { 'opacity-0': !showCursor })}>|</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default TacticalOverlay;
