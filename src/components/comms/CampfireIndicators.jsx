import React from 'react';
import { motion } from 'framer-motion';

// 1. LFG State -> "The Mustering Beacon"
const LFGBeacon = () => {
  const chevronVariants = {
    hidden: { opacity: 0, y: 0 },
    visible: (i) => ({
      opacity: [0, 1, 0],
      y: [-10, -20, -30],
      transition: {
        delay: i * 0.3,
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    }),
  };

  return (
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8">
      {[0, 1, 2].map((i) => (
        <motion.svg
          key={i}
          className="absolute w-full h-full"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="2"
          variants={chevronVariants}
          custom={i}
          initial="hidden"
          animate="visible"
        >
          <path d="M5 15l7-7 7 7" />
        </motion.svg>
      ))}
    </div>
  );
};

// 2. PTT-Only State -> "The Encryption Grid"
const EncryptionGrid = () => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <pattern
          id="ptt-grid"
          width="8"
          height="8"
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
        >
          <line x1="0" y1="0" x2="0" y2="8" stroke="#cc5500" strokeWidth="1" opacity="0.5" />
        </pattern>
      </defs>
      <rect
        className="clip-path-hexagon"
        width="100%"
        height="100%"
        fill="url(#ptt-grid)"
        opacity="0.15"
      />
    </svg>
  );
};

// 3. Briefing State -> "Command Override"
const CommandOverride = () => {
  return (
    <div
      className="absolute inset-0 clip-path-hexagon"
      style={{
        boxShadow: '0 0 0 3px #ff0000',
      }}
    />
  );
};

// 4. Overload State -> "Signal Noise"
const SignalNoise = ({ children }) => {
    const jitterVariants = {
      jittering: {
        x: [0, 1, -1, 2, -2, 0],
        y: [0, -1, 2, -1, 1, 0],
        transition: {
          duration: 0.1,
          repeat: Infinity,
        }
      },
      calm: { x: 0, y: 0 }
    }

    return (
        <motion.div variants={jitterVariants} animate="jittering">
            {children}
        </motion.div>
    )
}


export { LFGBeacon, EncryptionGrid, CommandOverride, SignalNoise };
