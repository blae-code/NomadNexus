import React from 'react';
import { cn } from '@/lib/utils';

const rankColorMap = {
  Pioneer: 'text-red-500',
  Founder: 'text-red-500',
  Voyager: 'text-orange-500',
  Scout: 'text-white',
  Vagrant: 'text-zinc-500',
};

const RankBadge = ({ rank }) => {
  const colorClass = rankColorMap[rank] || 'text-zinc-500';

  return (
    <div className={cn('w-4 h-4 relative', colorClass)}>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 L2 7 L2 17 L12 22 L22 17 L22 7 Z" />
      </svg>
    </div>
  );
};

export default RankBadge;
