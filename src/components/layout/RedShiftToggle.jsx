import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const RedShiftToggle = () => {
  const [isRedShiftActive, setIsRedShiftActive] = useState(false);

  useEffect(() => {
    const body = document.body;
    if (!body) return undefined;

    body.classList.toggle('red-shift-mode', isRedShiftActive);

    return () => {
      body.classList.remove('red-shift-mode');
    };
  }, [isRedShiftActive]);

  return (
    <div className="w-16 h-28 border border-burnt-orange bg-black/70 flex flex-col items-center justify-between px-2 py-3 select-none">
      <div className="text-[10px] font-mono text-tech-white tracking-[0.25em]">RED</div>
      <motion.button
        onClick={() => setIsRedShiftActive(!isRedShiftActive)}
        className="w-full h-10 border border-burnt-orange bg-burnt-orange/20 relative overflow-hidden"
        whileTap={{ scale: 0.96 }}
      >
        <motion.div
          className="absolute inset-x-0 h-5 bg-[#8a0303] border-b border-t border-burnt-orange"
          animate={{ y: isRedShiftActive ? 0 : 20 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-tech-white">
          {isRedShiftActive ? 'SHIFT' : 'NORMAL'}
        </div>
      </motion.button>
      <div className="text-[10px] font-mono text-amber-300 tracking-[0.2em]">SHIFT</div>
    </div>
  );
};

export default RedShiftToggle;
