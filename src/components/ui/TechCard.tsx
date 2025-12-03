import React from 'react';
import { cn } from '@/lib/utils';

type TechCardProps = {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  label?: string;
};

/**
 * Hard-edged, clipped container with subtle greebles and hover glow.
 */
const TechCard: React.FC<TechCardProps> = ({ children, className = '', noPadding = false, label = 'SYS.44' }) => {
  const clipShape =
    'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)';

  return (
    <div className={cn('relative group', className)}>
      <div
        className="absolute inset-0 bg-[#15191e]/90 backdrop-blur-md border border-zinc-700"
        style={{ clipPath: clipShape }}
      />

      <div
        className="absolute inset-0 bg-[#cc5500] opacity-0 group-hover:opacity-15 transition-opacity duration-400 pointer-events-none"
        style={{ clipPath: clipShape }}
      />

      <div className="absolute top-0 left-0 w-2 h-2 bg-[#cc5500] z-10" />
      <div className="absolute top-3 right-3 text-[9px] font-mono text-zinc-600 tracking-[0.28em] rotate-90 origin-top-right z-10">
        {label}
      </div>

      <div className={cn('relative z-10', noPadding ? '' : 'p-4')}>{children}</div>
    </div>
  );
};

export default TechCard;
