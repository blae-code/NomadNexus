import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Signal, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ConnectionStrengthIndicator
 * Visual indicators for network/voice connection quality
 * Shows signal strength, latency, and connection status
 */
export default function ConnectionStrengthIndicator({
  quality = 'excellent', // excellent, good, fair, poor, offline
  latency = 0, // milliseconds
  packetLoss = 0, // percentage
  jitter = 0, // milliseconds
  bandwidth = { inKbps: 0, outKbps: 0 },
  size = 'md', // sm, md, lg
  showMetrics = true,
  className
}) {
  const qualityConfig = {
    excellent: {
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/30',
      borderColor: 'border-emerald-500/50',
      icon: Signal,
      bars: 4,
      label: 'Excellent',
      description: 'Signal optimal'
    },
    good: {
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-950/30',
      borderColor: 'border-cyan-500/50',
      icon: Signal,
      bars: 3,
      label: 'Good',
      description: 'Signal strong'
    },
    fair: {
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/30',
      borderColor: 'border-amber-500/50',
      icon: Signal,
      bars: 2,
      label: 'Fair',
      description: 'Signal degraded'
    },
    poor: {
      color: 'text-orange-400',
      bgColor: 'bg-orange-950/30',
      borderColor: 'border-orange-500/50',
      icon: AlertCircle,
      bars: 1,
      label: 'Poor',
      description: 'Signal weak'
    },
    offline: {
      color: 'text-red-400',
      bgColor: 'bg-red-950/30',
      borderColor: 'border-red-500/50',
      icon: WifiOff,
      bars: 0,
      label: 'Offline',
      description: 'No connection'
    }
  };

  const config = qualityConfig[quality] || qualityConfig.offline;
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "rounded-lg border backdrop-blur-sm transition-all duration-300",
        config.bgColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Signal Icon */}
        <motion.div
          animate={quality !== 'offline' ? { 
            opacity: [0.7, 1, 0.7]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className="shrink-0"
        >
          <IconComponent className={cn(iconSizes[size], config.color)} />
        </motion.div>

        {/* Status Info */}
        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-bold uppercase tracking-wider",
            size === 'sm' ? 'text-[9px]' : size === 'md' ? 'text-[10px]' : 'text-xs',
            config.color
          )}>
            {config.label}
          </div>
          {showMetrics && (
            <div className={cn(
              "text-[8px] text-zinc-500 uppercase tracking-widest mt-0.5",
              quality === 'offline' && 'text-red-600'
            )}>
              {quality !== 'offline' ? `${latency}ms · ${packetLoss}% loss` : 'Disconnected'}
            </div>
          )}
        </div>

        {/* Signal Bars */}
        <div className="flex items-end gap-0.5 h-5 shrink-0">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                height: i < config.bars ? '100%' : '25%',
                opacity: i < config.bars ? 1 : 0.3
              }}
              transition={{ duration: 0.3 }}
              className={cn(
                "w-1 rounded-full",
                i < config.bars ? config.borderColor.replace('border-', 'bg-') : 'bg-zinc-700'
              )}
            />
          ))}
        </div>
      </div>

      {/* Metrics & Warning Messages */}
      {showMetrics && (
        <div className="mt-2 grid grid-cols-2 gap-2 text-[8px] uppercase tracking-widest text-zinc-500">
          <div className="flex items-center gap-1">
            <span className="text-zinc-400">RTT</span>
            <span className={cn(latency > 200 ? 'text-orange-400' : latency > 120 ? 'text-amber-400' : 'text-emerald-400')}>{latency}ms</span>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <span className="text-zinc-400">JIT</span>
            <span className={cn(jitter > 30 ? 'text-orange-400' : jitter > 15 ? 'text-amber-400' : 'text-emerald-400')}>{jitter}ms</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-zinc-400">LOSS</span>
            <span className={cn(packetLoss > 5 ? 'text-orange-400' : packetLoss > 2 ? 'text-amber-400' : 'text-emerald-400')}>{packetLoss}%</span>
          </div>
          <div className="flex items-center gap-1 justify-end font-mono text-[8px] text-cyan-300">
            ↓{(bandwidth.inKbps ?? 0).toFixed(0)} ↑{(bandwidth.outKbps ?? 0).toFixed(0)} kbps
          </div>
        </div>
      )}

      {/* Warning Messages */}
      <AnimatePresence>
        {quality === 'poor' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 text-[8px] text-orange-400 font-mono uppercase tracking-wider"
          >
            ⚠ Attempting reconnection...
          </motion.div>
        )}
        {quality === 'fair' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 text-[8px] text-amber-400 font-mono uppercase tracking-wider"
          >
            ℹ Audio quality reduced
          </motion.div>
        )}
        {packetLoss > 5 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 text-[8px] text-amber-400 font-mono uppercase tracking-wider"
          >
            ℹ High packet loss detected
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
