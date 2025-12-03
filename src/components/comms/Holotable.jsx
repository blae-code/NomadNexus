import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveKit } from '@/hooks/useLiveKit';

const HOLO_ACTIONS = {
  LOAD_SYSTEM: 'LOAD_SYSTEM',
  DEPLOY_ASSET: 'DEPLOY_ASSET',
  CLEAR: 'CLEAR',
};

const systems = ['Stanton', 'Pyro', 'Sol'];
const assets = ['Hammerhead Wing', 'Cutlass Red', 'Carrack'];

const Holotable = () => {
  const { publishData, dataFeed } = useLiveKit();
  const [state, setState] = useState({ system: 'Stanton', assets: [] });
  const [log, setLog] = useState(['Holotable online.']);
  const lastActionRef = useRef(null);

  const holoPackets = useMemo(
    () => dataFeed.filter((d) => d.type === 'HOLO_ACTION'),
    [dataFeed]
  );

  useEffect(() => {
    if (holoPackets.length === 0) return;
    const pkt = holoPackets[holoPackets.length - 1];
    lastActionRef.current = pkt;
    switch (pkt.action) {
      case HOLO_ACTIONS.LOAD_SYSTEM:
        setState((prev) => ({ ...prev, system: pkt.args?.system || prev.system }));
        setLog((l) => [`Loaded ${pkt.args?.system}`, ...l].slice(0, 6));
        break;
      case HOLO_ACTIONS.DEPLOY_ASSET:
        setState((prev) => ({ ...prev, assets: [...prev.assets, pkt.args?.asset || 'Unknown'] }));
        setLog((l) => [`Deployed ${pkt.args?.asset}`, ...l].slice(0, 6));
        break;
      case HOLO_ACTIONS.CLEAR:
        setState({ system: 'Stanton', assets: [] });
        setLog((l) => ['Cleared deck', ...l].slice(0, 6));
        break;
      default:
        break;
    }
  }, [holoPackets]);

  const sendAction = (action, args = {}) => {
    publishData({ type: 'HOLO_ACTION', action, args, ts: Date.now() });
  };

  const handleVoiceCommand = (command) => {
    const cmd = command.toLowerCase();
    if (cmd.includes('stanton')) sendAction(HOLO_ACTIONS.LOAD_SYSTEM, { system: 'Stanton' });
    if (cmd.includes('pyro')) sendAction(HOLO_ACTIONS.LOAD_SYSTEM, { system: 'Pyro' });
    if (cmd.includes('hammerhead')) sendAction(HOLO_ACTIONS.DEPLOY_ASSET, { asset: 'Hammerhead Wing' });
  };

  useEffect(() => {
    const simulateVoiceCommand = () => {
      const commands = [
        "Riggsy, pull up Stanton system.",
        "Riggsy, I need a Hammerhead wing.",
        "Riggsy, clear the holotable.",
      ];
      const randomCommand = commands[Math.floor(Math.random() * commands.length)];
      handleVoiceCommand(randomCommand);
    };
    const interval = setInterval(simulateVoiceCommand, 25000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full bg-gunmetal border border-burnt-orange text-tech-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gunmetal to-black opacity-70" />
      <div className="absolute inset-0 bg-grid-small-burnt-orange/[0.2] [mask-image:linear-gradient(to_bottom,white,transparent)]" />

      <div className="relative z-10 h-full grid grid-cols-[2fr_1fr]">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono text-amber-300 uppercase tracking-[0.3em]">Holotable</div>
            <div className="text-[11px] font-mono text-tech-white/70">System: {state.system}</div>
          </div>
          <div className="flex gap-2">
            {systems.map((sys) => (
              <button
                key={sys}
                onClick={() => sendAction(HOLO_ACTIONS.LOAD_SYSTEM, { system: sys })}
                className="px-3 py-1 border border-burnt-orange text-xs font-bold hover:bg-burnt-orange/20"
              >
                LOAD {sys.toUpperCase()}
              </button>
            ))}
            <button
              onClick={() => sendAction(HOLO_ACTIONS.CLEAR)}
              className="px-3 py-1 border border-burnt-orange text-xs font-bold text-red-300 hover:bg-red-900/30"
            >
              CLEAR
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {assets.map((asset) => (
              <button
                key={asset}
                onClick={() => sendAction(HOLO_ACTIONS.DEPLOY_ASSET, { asset })}
                className="px-3 py-1 border border-burnt-orange text-xs font-bold hover:bg-burnt-orange/20"
              >
                DEPLOY {asset.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex-1 border border-burnt-orange/40 bg-black/40 relative">
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(204,85,0,0.4), transparent 60%)' }} />
            <div className="p-4 relative z-10">
              <div className="text-sm font-mono text-tech-white mb-2">System: {state.system}</div>
              <div className="text-xs text-amber-200 font-mono">Assets:</div>
              <ul className="text-xs text-tech-white/80 font-mono list-disc list-inside">
                {state.assets.length === 0 ? <li>-- none --</li> : state.assets.map((a, idx) => <li key={idx}>{a}</li>)}
              </ul>
            </div>
          </div>
        </div>
        <div className="p-4 border-l border-burnt-orange/40 bg-black/40 flex flex-col gap-3">
          <div className="text-xs font-mono text-tech-white/70 uppercase tracking-[0.3em]">Hololog</div>
          <div className="flex-1 border border-burnt-orange/40 bg-black/60 p-2 text-[11px] font-mono text-amber-200 space-y-1 overflow-y-auto">
            {log.map((entry, idx) => (
              <div key={idx} className="border-b border-burnt-orange/20 pb-1">{entry}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Holotable;
