import React from 'react';
import { motion } from 'framer-motion';
import { Signal, Wifi, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * CompactSignalMeter
 * Minimal signal strength display for dashboard headers
 * Shows quick at-a-glance connection quality
 */
export default function CompactSignalMeter({
  quality = 'excellent', // excellent, good, fair, poor
  connectionState = 'connected', // connected, connecting, disconnected
  showLabel = false,
  className
}) {
  const qualityConfig = {
    excellent: { bars: 4, color: '#10b981', label: 'Excellent' },
    good: { bars: 3, color: '#06b6d4', label: 'Good' },
    fair: { bars: 2, color: '#f59e0b', label: 'Fair' },
    poor: { bars: 1, color: '#ef4444', label: 'Poor' }
  };

  const config = qualityConfig[quality] || qualityConfig.poor;

  const getStatusIcon = () => {
    if (connectionState === 'disconnected') return AlertTriangle;
    if (quality === 'poor') return AlertTriangle;
    return connectionState === 'connecting' ? Wifi : Signal;
  };

  const StatusIcon = getStatusIcon();

  return (
    <motion.div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1.5 rounded-lg border backdrop-blur-sm",
        connectionState === 'disconnected'
          ? "bg-red-950/30 border-red-900/50"
          : quality === 'poor'
          ? "bg-orange-950/30 border-orange-900/50"
          : "bg-zinc-900/40 border-zinc-800/50",
        className
      )}
      animate={connectionState === 'connecting' ? { 
        opacity: [0.7, 1, 0.7] 
      } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      {/* Icon */}
      <motion.div
        animate={connectionState === 'connected' && quality !== 'poor' ? {
          scale: [1, 1.05, 1]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <StatusIcon 
          className={cn(
            "w-3.5 h-3.5",
            connectionState === 'disconnected' && 'text-red-400',
            quality === 'poor' && 'text-orange-400',
            quality === 'fair' && 'text-amber-400',
            quality === 'good' && 'text-cyan-400',
            quality === 'excellent' && connectionState !== 'disconnected' && 'text-emerald-400'
          )}
        />
      </motion.div>

      {/* Signal Bars */}
      <div className="flex items-center gap-0.5 h-3">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scaleY: i < config.bars ? 1 : 0.4,
              opacity: i < config.bars ? 1 : 0.4
            }}
            transition={{ duration: 0.2 }}
            className={cn(
              "w-0.5 rounded-full origin-bottom",
              connectionState === 'disconnected' && 'bg-red-500',
              connectionState !== 'disconnected' && `bg-[${config.color}]`
            )}
            style={{
              height: i % 2 === 0 ? '8px' : i % 2 === 1 ? '10px' : '12px',
              backgroundColor: connectionState === 'disconnected' ? '#ef4444' : config.color
            }}
          />
        ))}
      </div>

      {/* Label */}
      {showLabel && (
        <span className={cn(
          "text-[9px] uppercase tracking-widest font-bold whitespace-nowrap",
          connectionState === 'disconnected' && 'text-red-400',
          quality === 'poor' && 'text-orange-400',
          quality === 'fair' && 'text-amber-400',
          quality === 'good' && 'text-cyan-400',
          quality === 'excellent' && connectionState !== 'disconnected' && 'text-emerald-400'
        )}>
          {connectionState === 'disconnected' ? 'Offline' : config.label}
        </span>
      )}
    </motion.div>
  );
}
