import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Clock, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * NetworkStatusMonitor
 * Real-time network performance metrics display
 * Shows bandwidth usage, latency spikes, packet loss
 */
export default function NetworkStatusMonitor({
  connectionState = 'connected', // connected, connecting, disconnected
  latency = 0,
  jitter = 0, // network variance in ms
  packetLoss = 0,
  bandwidth = { in: 0, out: 0 }, // kbps
  className
}) {
  const [latencyHistory, setLatencyHistory] = useState([latency]);

  useEffect(() => {
    setLatencyHistory(prev => {
      const updated = [...prev.slice(-9), latency];
      return updated;
    });
  }, [latency]);

  const getLatencyTrend = () => {
    if (latencyHistory.length < 2) return 'stable';
    const current = latencyHistory[latencyHistory.length - 1];
    const previous = latencyHistory[latencyHistory.length - 2];
    if (current > previous * 1.2) return 'increasing';
    if (current < previous * 0.8) return 'decreasing';
    return 'stable';
  };

  const getStatusColor = () => {
    if (connectionState === 'disconnected') return 'text-red-400';
    if (latency > 200 || packetLoss > 5) return 'text-orange-400';
    if (latency > 100 || packetLoss > 2) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const trend = getLatencyTrend();

  return (
    <div className={cn(
      "rounded-lg border border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm p-3 space-y-2",
      className
    )}>
      {/* Connection Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={connectionState === 'connected' ? {
              scale: [1, 1.1, 1],
              opacity: [1, 0.7, 1]
            } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={cn(
              "w-2 h-2 rounded-full",
              connectionState === 'connected' && 'bg-emerald-500 shadow-lg shadow-emerald-500/50',
              connectionState === 'connecting' && 'bg-amber-500 shadow-lg shadow-amber-500/50',
              connectionState === 'disconnected' && 'bg-red-500'
            )}
          />
          <span className={cn(
            "text-[9px] uppercase tracking-widest font-bold",
            getStatusColor()
          )}>
            {connectionState.toUpperCase()}
          </span>
        </div>

        {/* Overall Health Badge */}
        <div className={cn(
          "px-2 py-1 rounded border text-[8px] uppercase tracking-wider font-mono",
          connectionState === 'connected' && latency < 100 && packetLoss < 2
            ? 'bg-emerald-950/50 border-emerald-800/50 text-emerald-400'
            : connectionState === 'connected' && (latency < 150 || packetLoss < 5)
            ? 'bg-amber-950/50 border-amber-800/50 text-amber-400'
            : 'bg-red-950/50 border-red-800/50 text-red-400'
        )}>
          {connectionState === 'connected' && latency < 100 && packetLoss < 2 ? '✓ Healthy' : 
           connectionState === 'connected' && (latency < 150 || packetLoss < 5) ? '⚠ Caution' : 
           '✗ Poor'}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-[9px]">
        {/* Latency */}
        <div className="bg-zinc-900/50 rounded p-2 border border-zinc-800/30">
          <div className="flex items-center gap-1 mb-1 text-zinc-400 uppercase tracking-wider">
            <Clock className="w-3 h-3" />
            <span>Latency</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={cn(
              "font-bold text-sm",
              latency < 100 ? 'text-emerald-400' : latency < 150 ? 'text-amber-400' : 'text-red-400'
            )}>
              {latency}ms
            </span>
            <motion.div
              initial={false}
              animate={{
                scale: trend === 'increasing' ? 1.2 : trend === 'decreasing' ? 0.8 : 1,
                rotate: trend === 'increasing' ? 45 : trend === 'decreasing' ? -45 : 0
              }}
              transition={{ duration: 0.3 }}
              className={cn(
                "w-3 h-3",
                trend === 'increasing' && 'text-orange-400',
                trend === 'decreasing' && 'text-emerald-400'
              )}
            >
              {trend === 'increasing' && <TrendingDown className="w-3 h-3 rotate-180" />}
              {trend === 'decreasing' && <TrendingDown className="w-3 h-3" />}
              {trend === 'stable' && <Activity className="w-3 h-3" />}
            </motion.div>
          </div>
          <div className="text-[8px] text-zinc-600 mt-1">
            Jitter: {jitter}ms
          </div>
        </div>

        {/* Packet Loss */}
        <div className="bg-zinc-900/50 rounded p-2 border border-zinc-800/30">
          <div className="flex items-center gap-1 mb-1 text-zinc-400 uppercase tracking-wider">
            <Activity className="w-3 h-3" />
            <span>Loss</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "font-bold text-sm",
              packetLoss < 2 ? 'text-emerald-400' : packetLoss < 5 ? 'text-amber-400' : 'text-red-400'
            )}>
              {packetLoss.toFixed(2)}%
            </span>
          </div>
          <motion.div
            initial={false}
            animate={{
              width: `${Math.min(packetLoss * 20, 100)}%`,
              backgroundColor: packetLoss < 2 ? '#10b981' : packetLoss < 5 ? '#f59e0b' : '#ef4444'
            }}
            transition={{ duration: 0.3 }}
            className="h-1 rounded-full mt-2 bg-emerald-500"
          />
        </div>
      </div>

      {/* Bandwidth Monitor */}
      <div className="bg-zinc-900/50 rounded p-2 border border-zinc-800/30 text-[9px]">
        <div className="flex items-center gap-1 mb-1 text-zinc-400 uppercase tracking-wider">
          <Zap className="w-3 h-3" />
          <span>Bandwidth</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[8px] text-zinc-500">↓ Down</div>
            <div className="font-mono text-emerald-400 font-bold">
              {(bandwidth.in).toFixed(1)} kbps
            </div>
          </div>
          <div>
            <div className="text-[8px] text-zinc-500">↑ Up</div>
            <div className="font-mono text-cyan-400 font-bold">
              {(bandwidth.out).toFixed(1)} kbps
            </div>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      <AnimatePresence>
        {connectionState === 'disconnected' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[8px] text-red-400 bg-red-950/30 border border-red-900/50 rounded px-2 py-1 uppercase tracking-wider font-mono"
          >
            ✗ Connection lost - Attempting to reconnect...
          </motion.div>
        )}
        {latency > 200 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[8px] text-orange-400 bg-orange-950/30 border border-orange-900/50 rounded px-2 py-1 uppercase tracking-wider font-mono"
          >
            ⚠ High latency detected - Voice quality may degrade
          </motion.div>
        )}
        {packetLoss > 5 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[8px] text-amber-400 bg-amber-950/30 border border-amber-900/50 rounded px-2 py-1 uppercase tracking-wider font-mono"
          >
            ℹ High packet loss - Audio may cut out
          </motion.div>
        )}
      </AnimatePresence>

      {/* Latency History Chart */}
      {latencyHistory.length > 1 && (
        <div className="border-t border-zinc-800/30 pt-2 mt-2">
          <div className="flex items-end justify-between h-8 gap-0.5">
            {latencyHistory.map((val, i) => {
              const maxLatency = Math.max(...latencyHistory, 100);
              const height = (val / maxLatency) * 100;
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  className={cn(
                    "flex-1 rounded-t transition-colors",
                    val < 100 ? 'bg-emerald-500/60' : val < 150 ? 'bg-amber-500/60' : 'bg-red-500/60'
                  )}
                  title={`${val}ms`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[7px] text-zinc-600 mt-1 px-1">
            <span>10s ago</span>
            <span>now</span>
          </div>
        </div>
      )}
    </div>
  );
}
