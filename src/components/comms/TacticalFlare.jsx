import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const flareTypes = {
  MEDICAL: {
    color: '#ff0000',
    icon: 'cross',
    role: 'Redscar Rescue',
    sound: 'pulse_heartbeat_distress.wav',
  },
  COMBAT: {
    color: '#cc5500',
    icon: 'shield',
    role: 'Redscar Rangers',
    sound: 'klaxon_scramble.wav',
  },
};

const handleRescueRequest = (type, publishData) => {
  if (publishData) {
    publishData({ type: 'FLARE', variant: type });
  } else {
    console.log(`FLARE ${type} triggered (no data channel available).`);
  }
};

const TacticalFlare = ({ position, onAcknowledge, type, showRespond, responderRole, currentRole }) => {
  const shockwaveVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: [0, 1, 1.2, 1.5],
      opacity: [1, 0.8, 0.5, 0],
      transition: {
        duration: 1.5,
        ease: 'easeOut',
        repeat: Infinity,
        repeatDelay: 1,
      },
    },
  };

  const flareInfo = flareTypes[type];

  return (
    <motion.div
      className="absolute"
      style={{ left: position.x, top: position.y, x: '-50%', y: '-50%' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-48 h-48"
        variants={shockwaveVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hexagonal Shockwave */}
        <div
          className="absolute inset-0 clip-path-hexagon"
          style={{
            backgroundColor: flareInfo.color,
            boxShadow: `0 0 40px 10px ${flareInfo.color}`,
          }}
        />
      </motion.div>

      {/* Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        {flareInfo.icon === 'cross' && (
          <div className="w-8 h-8 text-white">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 2L13 2L13 11L22 11L22 13L13 13L13 22L11 22L11 13L2 13L2 11L11 11L11 2Z" />
            </svg>
          </div>
        )}
        {flareInfo.icon === 'shield' && (
          <div className="w-8 h-8 text-white">
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 5L2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12L22 5L12 2Z M12 4.1L19.9 6.7L19.9 12C19.9 16.4 16.4 20 12 20C7.6 20 4.1 16.4 4.1 12L4.1 6.7L12 4.1Z" />
            </svg>
          </div>
        )}
      </div>
      
      {showRespond && (
        <button
          onClick={onAcknowledge}
          disabled={responderRole && currentRole && responderRole !== currentRole}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-black font-bold text-xs disabled:bg-zinc-400 disabled:text-zinc-700"
        >
          RESPOND
        </button>
      )}
       <style jsx>{`
        .clip-path-hexagon {
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }
      `}</style>
    </motion.div>
  );
};


const FlareContextMenu = ({ onSelect, position }) => {
    return (
        <div 
            className="absolute"
            style={{ left: position.x, top: position.y }}
        >
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="flex flex-col gap-2"
            >
                <button 
                    onClick={() => onSelect('MEDICAL')}
                    className="w-24 h-12 bg-red-500 text-white font-bold text-xs border-2 border-red-300 flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11 2L13 2L13 11L22 11L22 13L13 13L13 22L11 22L11 13L2 13L2 11L11 11L11 2Z" /></svg>
                    MEDICAL
                </button>
                <button 
                    onClick={() => onSelect('COMBAT')}
                    className="w-24 h-12 bg-orange-500 text-white font-bold text-xs border-2 border-orange-300 flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 5L2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12L22 5L12 2Z M12 4.1L19.9 6.7L19.9 12C19.9 16.4 16.4 20 12 20C7.6 20 4.1 16.4 4.1 12L4.1 6.7L12 4.1Z" /></svg>
                    COMBAT
                </button>
            </motion.div>
        </div>
    )
}


export { TacticalFlare, FlareContextMenu, handleRescueRequest };
