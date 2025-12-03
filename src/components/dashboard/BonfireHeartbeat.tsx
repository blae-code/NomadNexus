import React from 'react';
import { cn } from '@/lib/utils';

type BonfireHeartbeatProps = {
  activeUserCount: number;
  className?: string;
};

const BonfireHeartbeat: React.FC<BonfireHeartbeatProps> = ({ activeUserCount, className }) => {
  const isActive = activeUserCount > 0;

  return (
    <div className={cn('relative overflow-hidden border border-burnt-orange bg-black/50 p-4', className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] uppercase tracking-[0.28em] text-amber-300">Bonfire Status</div>
        <div className="text-[11px] font-mono text-tech-white">{activeUserCount} Souls</div>
      </div>

      <div className="relative h-24 flex items-center justify-center">
        <div className="absolute h-10 w-10 rounded-none bg-[#cc5500]/50 animate-ping" />
        <div className="absolute h-16 w-16 rounded-none bg-[#cc5500]/30 animate-ping" />
        <div
          className={cn(
            'relative h-10 w-10 border border-[#cc5500] bg-[#cc5500]',
            isActive ? 'animate-pulse' : 'opacity-40'
          )}
        />
      </div>
    </div>
  );
};

export default BonfireHeartbeat;
