import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LFGBeacon, EncryptionGrid, CommandOverride, SignalNoise } from './CampfireIndicators';

const CampfireNode = ({ 
    name, 
    participantCount = 0, 
    isLocked = false, 
    isSpeaking = false,
    isLFG = false,
    audioMode = 'VOX',
    isPrioritySpeakerActive = false,
    softCap = 10,
}) => {
  const isIgnited = participantCount > 0 && !isLocked;
  const isOverloaded = participantCount > softCap;

  const nodeVariants = {
    idle: {
      scale: 1,
      filter: 'grayscale(50%) brightness(0.7)',
    },
    ignited: {
      scale: 1.1,
      filter: 'grayscale(0%) brightness(1)',
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      },
    },
    locked: {
      scale: 0.9,
      filter: 'grayscale(100%) brightness(0.5)',
    },
  };

  const flameVariants = {
    calm: {
      y: 0,
      scaleY: 1,
      opacity: 0.7,
    },
    speaking: {
      y: -15,
      scaleY: [1, 1.5, 1.2, 2, 1],
      opacity: 1,
      transition: {
        duration: 0.3,
        repeat: Infinity,
        repeatType: 'mirror',
      },
    },
  };

  const mainNode = (
    <motion.div
      className={cn(
        "relative w-24 h-24",
        audioMode === 'PTT_REQUIRED' && 'border-dashed'
      )}
      variants={nodeVariants}
      animate={isLocked ? 'locked' : isIgnited ? 'ignited' : 'idle'}
    >
      {isLFG && <LFGBeacon />}
      {isPrioritySpeakerActive && <CommandOverride />}

      {/* Hexagonal Brazier */}
      <div className={cn(
          "absolute inset-0 clip-path-hexagon bg-gunmetal border-2 border-burnt-orange",
          audioMode === 'PTT_REQUIRED' && 'border-dashed'
          )}>
        {isIgnited && (
          <motion.div
            className="absolute inset-0 clip-path-hexagon bg-burnt-orange"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
          />
        )}
        {audioMode === 'PTT_REQUIRED' && <EncryptionGrid />}
      </div>

      {/* Flames */}
      {isIgnited && !isPrioritySpeakerActive && (
        <div className="absolute inset-0 flex justify-center items-end">
          <motion.div
            variants={flameVariants}
            animate={isSpeaking ? 'speaking' : 'calm'}
            className="w-1/2 h-1/2"
          >
            <div className="relative w-full h-full">
              {/* Jagged Flames (Triangles) */}
              <div
                className="absolute bottom-0 left-1/4 w-0 h-0"
                style={{
                  borderLeft: '10px solid transparent',
                  borderRight: '10px solid transparent',
                  borderBottom: '20px solid #ffbf00',
                }}
              />
              <div
                className="absolute bottom-0 left-1/2 w-0 h-0"
                style={{
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderBottom: '30px solid #cc5500',
                  transform: 'translateX(-50%)',
                }}
              />
              <div
                className="absolute bottom-0 right-1/4 w-0 h-0"
                style={{
                  borderLeft: '10px solid transparent',
                  borderRight: '10px solid transparent',
                  borderBottom: '20px solid #ffbf00',
                }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="relative flex flex-col items-center justify-center w-32 h-32">
      {isOverloaded ? <SignalNoise>{mainNode}</SignalNoise> : mainNode}
      <div className="mt-2 text-center text-tech-white text-xs font-bold">{name}</div>
      <style jsx>{`
        .clip-path-hexagon {
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }
      `}</style>
    </div>
  );
};

export default CampfireNode;