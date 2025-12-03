import React, { useState } from 'react';
import {
  ShieldCheck,
  Radio,
  Box,
  Terminal,
  Activity,
  MessageSquare,
  AlertTriangle,
  Cpu,
  LogOut,
} from 'lucide-react';

const C_ORANGE = '#cc5500';
const C_GRID = '#1e293b';

const NavIcon = ({ icon, active = false, alert = false }) => (
  <button
    className={`p-2 transition-all hover:bg-white/10 ${active ? 'text-[#cc5500]' : 'text-gray-500'} ${
      alert ? 'text-red-500' : ''
    }`}
  >
    {icon}
  </button>
);

const DeckTab = ({ label, icon, active = false, onClick }) => (
  <button
    onClick={onClick}
    className={`h-full px-6 flex items-center gap-2 text-xs font-bold tracking-wider transition-all border-t-2 ${
      active
        ? 'bg-[#cc5500] text-black border-[#cc5500]'
        : 'bg-[#0f172a] text-gray-400 border-transparent hover:text-white hover:bg-[#1e293b]'
    }`}
  >
    {icon} {label}
  </button>
);

const DeckModule_Comms = () => (
  <div className="flex-1 flex flex-col p-4">
    <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
      <span className="text-[#cc5500] text-xs font-bold">BONFIRE GLOBAL CHAT</span>
      <span className="text-[10px] text-green-500">LIVE</span>
    </div>
    <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono">
      <p>
        <span className="text-blue-400">[Vagrant] Rookie1:</span> Requesting landing vector for Daymar.
      </p>
      <p>
        <span className="text-[#cc5500]">[Pioneer] MurphyJack:</span> Cleared. Watch the wind shear.
      </p>
      <p>
        <span className="text-yellow-500">[System]:</span> Cargo manifest updated.
      </p>
    </div>
  </div>
);

const DeckModule_Intel = () => (
  <div className="flex-1 grid grid-cols-3 gap-4 p-4">
    <div className="border border-gray-700 p-2">
      <h4 className="text-[#cc5500] text-xs mb-2">ACTIVE ROSTER</h4>
      <div className="text-2xl font-bold text-white">14</div>
      <div className="text-[10px] text-gray-500">OPERATIVES ONLINE</div>
    </div>
    <div className="border border-gray-700 p-2 col-span-2">
      <h4 className="text-[#cc5500] text-xs mb-2">MISSION STATUS</h4>
      <div className="text-sm text-gray-300">
        Operation "Iron Lung" is active. Industry wing reports 94% yield on Lyria.
      </div>
    </div>
  </div>
);

const DeckModule_System = () => (
  <div className="flex-1 p-4 flex items-center justify-center">
    <div className="text-center">
      <Cpu className="mx-auto text-gray-600 mb-2" />
      <div className="text-xs text-gray-500">NOMAD NEXUS // ALL SYSTEMS NOMINAL</div>
    </div>
  </div>
);

export default function NomadNexusShell_Mk2() {
  const [deckOpen, setDeckOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('COMMS');

  const toggleDeck = (tab) => {
    if (activeTab === tab) {
      setDeckOpen(!deckOpen);
    } else {
      setActiveTab(tab);
      setDeckOpen(true);
    }
  };

  return (
    <div className="h-screen w-screen bg-black p-6 flex items-center justify-center overflow-hidden font-mono text-gray-400 selection:bg-[#cc5500] selection:text-black">
      <div className="w-full h-full border border-[#334155] bg-[#0b0f12] relative flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <div className="h-10 bg-[#0f172a] border-b border-[#334155] flex items-center overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-[#cc5500] text-black font-bold flex items-center justify-center z-20 text-xs tracking-widest">
            NEXUS OS
          </div>
          <div className="absolute left-20 top-0 bottom-0 w-8 bg-[#cc5500] skew-x-12 z-10" />
          <div className="flex-1 flex items-center overflow-hidden whitespace-nowrap">
            <div className="animate-marquee pl-32 text-xs text-[#cc5500] tracking-widest uppercase">
              /// ALERT: REDSCAR RALLY MEDAL AWARDED TO OPERATIVE VOYAGER-7 /// WEATHER WARNING: MICROTECH STORMS SEVERE /// INDUSTRY BONFIRE: YIELD UP 40% ///
            </div>
          </div>

          <div className="absolute right-0 pr-4 flex items-center gap-4 text-xs z-20 bg-[#0f172a] pl-8 border-l border-[#334155]">
            <span className="text-[#00ff41]">NET: STABLE</span>
            <span>v1.0.4</span>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          <nav className="w-16 border-r border-[#334155] bg-[#080a0c] flex flex-col items-center py-4 gap-6 z-10">
            <div className="text-2xl font-bold text-white mb-4">NX</div>
            <NavIcon icon={<Activity />} active />
            <NavIcon icon={<Box />} />
            <NavIcon icon={<ShieldCheck />} />
            <div className="flex-1" />
            <NavIcon icon={<LogOut />} alert />
          </nav>

          <main className="flex-1 bg-black/50 relative overflow-auto p-8">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(${C_GRID} 1px, transparent 1px), linear-gradient(90deg, ${C_GRID} 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              }}
            />

            <div className="max-w-4xl mx-auto border-l-2 border-[#cc5500] pl-6 py-2 relative">
              <h1 className="text-3xl text-white tracking-widest mb-2">OPERATIONS OVERVIEW</h1>
              <p className="text-sm text-gray-500 max-w-lg">
                Welcome back, Pioneer. Systems are green. No critical directives pending. Select a module from the Navigation Rail to begin.
              </p>
            </div>
          </main>

          <div
            className={`absolute bottom-0 left-16 right-0 border-t-2 border-[#cc5500] bg-[#0f172a]/95 backdrop-blur transition-all duration-300 ease-out z-30 ${
              deckOpen ? 'h-64' : 'h-0 border-t-0'
            }`}
          >
            {deckOpen && (
              <div className="h-full flex">
                {activeTab === 'COMMS' && <DeckModule_Comms />}
                {activeTab === 'INTEL' && <DeckModule_Intel />}
                {activeTab === 'SYSTEM' && <DeckModule_System />}
              </div>
            )}
          </div>
        </div>

        <footer className="h-10 bg-[#080a0c] border-t border-[#334155] flex items-center px-4 justify-between select-none z-40">
          <div className="flex items-end h-full gap-1">
            <DeckTab
              label="COMMS FEED"
              icon={<MessageSquare size={14} />}
              active={deckOpen && activeTab === 'COMMS'}
              onClick={() => toggleDeck('COMMS')}
            />
            <DeckTab
              label="INTEL / ALERTS"
              icon={<AlertTriangle size={14} />}
              active={deckOpen && activeTab === 'INTEL'}
              onClick={() => toggleDeck('INTEL')}
            />
            <DeckTab
              label="SYSTEM DIAG"
              icon={<Cpu size={14} />}
              active={deckOpen && activeTab === 'SYSTEM'}
              onClick={() => toggleDeck('SYSTEM')}
            />
          </div>
          <div className="text-[10px] text-gray-600 tracking-widest">SECURE CHANNEL // ENCRYPTION: AES-256</div>
        </footer>
      </div>
    </div>
  );
}
