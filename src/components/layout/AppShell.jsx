import React, { useEffect, useState } from 'react';
import DataSlate from '../comms/DataSlate';
import RedShiftToggle from './RedShiftToggle';
import HoloBoard from '../comms/HoloBoard';
import { useRiggsyGatedListening } from '@/hooks/useRiggsyGatedListening'; // Import the new hook
import { Signal, Radio, Mic, Wand2, Rocket } from 'lucide-react';

const AppShell = ({ children }) => {
  const [isPocket, setIsPocket] = useState(false);
  const { isRiggsyListening } = useRiggsyGatedListening(); // Use the new hook

  const pttQuickHints = [
    'Say "mark waypoint" to frame the map intel.',
    'Say "open campfire chat" to focus the DataSlate.',
    'Say "acknowledge alert two" to clear the holo-card.',
  ];

  const macroBindings = [
    { key: 'ALT + 1', label: 'Record 15s clip', icon: Mic },
    { key: 'ALT + 2', label: 'Squad ready-check', icon: Wand2 },
    { key: 'ALT + 3', label: 'Ping nearest campfire', icon: Signal },
    { key: 'ALT + 4', label: 'Request evac window', icon: Rocket },
  ];

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
      <div className="fixed inset-x-6 top-4 z-50 px-4 py-3 bg-black/70 border border-burnt-orange text-tech-white text-xs font-mono uppercase flex items-center gap-3 shadow-[0_0_30px_rgba(234,88,12,0.3)]">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-burnt-orange animate-pulse" />
          <span>PTT: RIGGSY LIVE</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-amber-200">
          {pttQuickHints.map((hint) => (
            <span key={hint} className="px-2 py-1 bg-amber-500/10 border border-amber-500/40">
              {hint}
            </span>
          ))}
        </div>
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
          <DataSlate isListening={isRiggsyListening} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen grid grid-cols-[80px_1fr_320px] bg-gunmetal text-tech-white">
      {RiggsyListeningIndicator} {/* Render indicator */}
      <div className="col-start-1 col-end-2 border-r border-burnt-orange flex flex-col items-center py-4 gap-4 bg-black/50">
        <div className={`w-12 h-12 flex items-center justify-center border ${isRiggsyListening ? 'border-burnt-orange shadow-[0_0_12px_rgba(234,88,12,0.5)]' : 'border-burnt-orange/60'}`}>
          <RedShiftToggle />
        </div>
        <div className="w-full px-2 space-y-2">
          <div className="text-[10px] text-center font-mono uppercase tracking-[0.2em] text-amber-200">PTT Macros</div>
          {macroBindings.map((macro) => (
            <div
              key={macro.key}
              className={`text-[10px] font-mono border px-2 py-1 bg-gunmetal/70 flex flex-col gap-1 ${isRiggsyListening ? 'border-burnt-orange shadow-[0_0_10px_rgba(234,88,12,0.3)]' : 'border-zinc-700'}`}
            >
              <div className="flex items-center gap-2 text-tech-white">
                <macro.icon className="w-3 h-3 text-amber-300" />
                <span>{macro.label}</span>
              </div>
              <div className="text-[9px] text-amber-400">{macro.key}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={`col-start-2 col-end-3 grid grid-rows-[auto_1fr] ${isRiggsyListening ? 'shadow-[0_0_0_1px_rgba(234,88,12,0.4)]' : ''}`}>
        <HoloBoard isListening={isRiggsyListening} />
        <div className="row-start-2 row-end-3">
          {children}
        </div>
      </div>
      <div
        className={`col-start-3 col-end-4 border-l border-burnt-orange holo-glass bg-black/60 ${isRiggsyListening ? 'shadow-[0_0_0_1px_rgba(234,88,12,0.4)]' : ''}`}
      >
        <DataSlate isListening={isRiggsyListening} />
      </div>
    </div>
  );
};

export default AppShell;

