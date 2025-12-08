import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Radio, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRankColorClass } from '@/components/utils/rankUtils';

/**
 * VoicePresenceIndicator
 * Cutting-edge presence visualization for voice participants
 * Shows speaking state, audio level, and connection quality with visual feedback
 */
export default function VoicePresenceIndicator({ 
  user, 
  isSpeaking = false, 
  isMuted = false,
  audioLevel = 0,
  isPriority = false,
  isWhisperTarget = false,
  connectionQuality = 'excellent', // excellent, good, fair, poor, offline
  size = 'md', // sm, md, lg
  showDetails = true,
  className 
}) {
  const rankColor = getRankColorClass(user?.rank);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };
  
  const qualityConfig = {
    excellent: { 
      borderColor: 'border-emerald-500',
      glowColor: 'shadow-emerald-500/50',
      label: '●●●●',
      statusColor: 'text-emerald-400'
    },
    good: { 
      borderColor: 'border-cyan-500',
      glowColor: 'shadow-cyan-500/50',
      label: '●●●○',
      statusColor: 'text-cyan-400'
    },
    fair: { 
      borderColor: 'border-amber-500',
      glowColor: 'shadow-amber-500/50',
      label: '●●○○',
      statusColor: 'text-amber-400'
    },
    poor: { 
      borderColor: 'border-orange-500',
      glowColor: 'shadow-orange-500/50',
      label: '●○○○',
      statusColor: 'text-orange-400'
    },
    offline: { 
      borderColor: 'border-red-500',
      glowColor: 'shadow-red-500/50',
      label: '○○○○',
      statusColor: 'text-red-400'
    }
  };

  const config = qualityConfig[connectionQuality] || qualityConfig.offline;

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Connection Quality Badge */}
      <div className={cn(
        "absolute -top-2 -left-2 text-[9px] font-bold tracking-widest px-1 rounded flex items-center gap-1",
        connectionQuality === 'poor' && 'bg-orange-950/60',
        connectionQuality === 'fair' && 'bg-amber-950/60',
        connectionQuality === 'good' && 'bg-cyan-950/60',
        connectionQuality === 'excellent' && 'bg-emerald-950/60',
        connectionQuality === 'offline' && 'bg-red-950/60',
        config.statusColor
      )}>
        <span>{config.label}</span>
        {connectionQuality === 'poor' && <span className="text-[9px]">!</span>}
      </div>

      {/* Main Avatar Circle */}
      <motion.div
        className={cn(
          sizeClasses[size],
          "rounded-full relative overflow-hidden border-2 transition-all duration-200",
          isSpeaking ? config.borderColor : (connectionQuality !== 'excellent' ? config.borderColor : "border-zinc-800"),
          isSpeaking && `shadow-lg ${config.glowColor}`,
          connectionQuality !== 'excellent' && !isSpeaking && 'shadow-lg ' + config.glowColor.replace('shadow-', 'shadow-')
        )}
        animate={{
          scale: isSpeaking ? [1, 1.05, 1] : 1,
          borderColor: isSpeaking && connectionQuality === 'excellent' ? ['#10b981', '#34d399', '#10b981'] : undefined
        }}
        transition={{
          duration: 0.5,
          repeat: isSpeaking ? Infinity : 0
        }}
      >
        {/* Background Gradient */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950",
          isSpeaking && "from-emerald-950/50 to-zinc-950",
          connectionQuality === 'poor' && "from-orange-950/30 to-zinc-950",
          connectionQuality === 'offline' && "from-red-950/30 to-zinc-950"
        )} />
        
        {/* Audio Level Visualization */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1 + (audioLevel * 0.5), 
                opacity: 0.3 + (audioLevel * 0.4) 
              }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 bg-gradient-radial from-emerald-400 to-transparent"
              transition={{ duration: 0.1 }}
            />
          )}
        </AnimatePresence>

        {/* User Initial/Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "font-black uppercase",
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg',
            isSpeaking ? 'text-emerald-300' : 'text-zinc-400'
          )}>
            {user?.callsign?.[0] || user?.rsi_handle?.[0] || '?'}
          </span>
        </div>

        {/* Muted Overlay */}
        {isMuted && (
          <div className="absolute inset-0 bg-red-950/60 flex items-center justify-center backdrop-blur-sm">
            <MicOff className="w-4 h-4 text-red-400" />
          </div>
        )}

        {/* Priority Badge */}
        {isPriority && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full border-2 border-zinc-950 flex items-center justify-center"
          >
            <Zap className="w-3 h-3 text-black" />
          </motion.div>
        )}

        {/* Whisper Indicator */}
        {isWhisperTarget && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full border-2 border-zinc-950 flex items-center justify-center"
          >
            <Radio className="w-2.5 h-2.5 text-black" />
          </motion.div>
        )}
      </motion.div>

      {/* Speaking Ripple Effect */}
      <AnimatePresence>
        {isSpeaking && (
          <>
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
              className={cn(
                "absolute inset-0 rounded-full border-2 border-emerald-500",
                sizeClasses[size]
              )}
            />
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
              className={cn(
                "absolute inset-0 rounded-full border-2 border-emerald-500",
                sizeClasses[size]
              )}
            />
          </>
        )}
      </AnimatePresence>

      {/* User Details */}
      {showDetails && (
        <div className="mt-1 text-center">
          <div className={cn(
            "font-bold truncate max-w-[100px]",
            size === 'sm' ? 'text-[9px]' : size === 'md' ? 'text-[10px]' : 'text-xs',
            isSpeaking ? 'text-emerald-400' : 'text-zinc-300'
          )}>
            {user?.callsign || user?.rsi_handle || 'Unknown'}
          </div>
          <div className={cn(
            "uppercase tracking-wider truncate",
            size === 'sm' ? 'text-[8px]' : 'text-[9px]',
            rankColor
          )}>
            {user?.rank || 'vagrant'}
          </div>
        </div>
      )}
    </div>
  );
}
