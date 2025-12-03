import React, { useEffect, useState } from 'react';
import DataSlate from '../comms/DataSlate';
import RedShiftToggle from './RedShiftToggle';
import HoloBoard from '../comms/HoloBoard';
import { useRiggsyGatedListening } from '@/hooks/useRiggsyGatedListening'; // Import the new hook
import { Signal, Radio } from 'lucide-react'; // Added Radio icon

const AppShell = ({ children }) => {
  const [isPocket, setIsPocket] = useState(false);
  const { isRiggsyListening } = useRiggsyGatedListening(); // Use the new hook

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsPocket(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Common UI indicator for Riggsy listening
  const RiggsyListeningIndicator = (
    isRiggsyListening && (
      <div className="fixed top-4 right-4 z-50 px-3 py-1 bg-burnt-orange/80 border border-burnt-orange text-tech-white text-xs font-mono uppercase flex items-center gap-2 animate-pulse-fast">
        <Radio className="w-3 h-3" />
        RIGGSY ACTIVE
      </div>
    )
  );

  if (isPocket) {
    const pocketCampfires = [
      { name: 'Lounge Campfire', status: 'Idle' },
      { name: 'The Bonfire', status: 'Active' },
      { name: 'Industry Bonfire', status: 'LFG' },
      { name: 'Rangers Bonfire', status: 'Encrypted' },
    ];

    return (
      <div className="h-screen bg-gunmetal text-tech-white flex flex-col">
        {RiggsyListeningIndicator} {/* Render indicator */}
        <div className="h-12 border-b border-burnt-orange flex items-center justify-between px-3">
          <div className="text-xs font-mono tracking-[0.3em] text-amber-300 uppercase">Pocket MFD</div>
          <RedShiftToggle />
        </div>
        <div className="p-3 border-b border-burnt-orange">
          <div className="text-[11px] font-mono text-tech-white/70 uppercase tracking-[0.2em] mb-2">Active Campfires</div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {pocketCampfires.map((camp) => (
              <div key={camp.name} className="border border-burnt-orange/60 bg-black/40 px-2 py-2 truncate flex items-center gap-1">
                <Signal className="w-3 h-3 text-burnt-orange" />
                <span className="truncate">{camp.name}</span>
                <span className="ml-auto text-[10px] text-amber-200">{camp.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <DataSlate />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen grid grid-cols-[64px_1fr_300px] bg-gunmetal text-tech-white">
      {RiggsyListeningIndicator} {/* Render indicator */}
      <div className="col-start-1 col-end-2 border-r border-burnt-orange flex flex-col items-center py-4">
        <RedShiftToggle />
      </div>
      <div className="col-start-2 col-end-3 grid grid-rows-[auto_1fr]">
        <HoloBoard />
        <div className="row-start-2 row-end-3">
          {children}
        </div>
      </div>
      <div className="col-start-3 col-end-4 border-l border-burnt-orange">
        <DataSlate />
      </div>
    </div>
  );
};

export default AppShell;

