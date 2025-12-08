import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Radio,
  Users,
  Box,
  Activity,
  Terminal,
  LogOut,
  AlertCircle,
  RefreshCw,
  Clock3,
  Zap,
} from 'lucide-react';

const GRID_STYLES = 'border border-[#1e293b] bg-[#0b0f12] relative overflow-hidden';
const HEADER_TEXT = 'text-[#cc5500] font-mono tracking-widest text-xs uppercase';

const NavIcon = ({ icon, label, active = false, alert = false }) => (
  <button
    className={`group flex flex-col items-center gap-1 w-full relative ${
      active ? 'text-[#cc5500]' : 'text-gray-500 hover:text-white'
    }`}
  >
    {alert && <span className="absolute top-0 right-4 h-2 w-2 bg-red-600" />}
    <div className={`p-2 transition-all ${active ? 'bg-[#cc5500]/10 border border-[#cc5500]' : ''}`}>
      {icon}
    </div>
    <span className="text-[10px] tracking-widest opacity-0 group-hover:opacity-100 transition-opacity absolute left-14 bg-black border border-gray-700 px-2 py-1 z-50 whitespace-nowrap">
      {label}
    </span>
  </button>
);

const Button = ({ label, active = false }) => (
  <button
    className={`px-4 py-1 text-xs tracking-widest border transition-all ${
      active
        ? 'bg-[#cc5500] text-black border-[#cc5500] font-bold'
        : 'border-gray-600 text-gray-400 hover:border-[#cc5500] hover:text-[#cc5500]'
    }`}
  >
    {label}
  </button>
);

const AlertItem = ({ level, msg }) => {
  const color =
    level === 'CRIT'
      ? 'text-red-500 border-red-900'
      : level === 'WARN'
      ? 'text-yellow-500 border-yellow-900'
      : 'text-blue-400 border-blue-900';
  return (
    <div className={`border-l-2 ${color} bg-white/5 p-2 text-xs`}>
      <span className={`font-bold mr-2 ${color.split(' ')[0]}`}>[{level}]</span>
      <span className="text-gray-300">{msg}</span>
    </div>
  );
};

export default function NomadNexusShell() {
  const [lastSweep, setLastSweep] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setLastSweep(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      }).format(date);
    } catch (err) {
      return '--:--:--';
    }
  };

  return (
    <div className="h-screen w-screen bg-black text-gray-400 font-mono flex flex-col overflow-hidden selection:bg-[#cc5500] selection:text-black">
      <header className="h-16 flex items-center justify-between px-4 border-b border-[#334155] bg-[#0f172a]">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-[#cc5500] flex items-center justify-center font-bold text-black text-xl">
            NX
          </div>
          <div>
            <h1 className="text-white text-lg tracking-[0.2em] font-bold">NOMAD NEXUS</h1>
            <p className="text-xs text-[#cc5500]">INTRANET CONTROL SURFACE // v1.0</p>
          </div>
        </div>
        <div className="flex gap-6 text-xs">
          <div className="flex flex-col items-end">
            <span className="text-[#00ff41]">SYS: ONLINE</span>
            <span className="opacity-50">LATENCY: 42ms</span>
          </div>
          <div className="flex flex-col items-end border-l border-gray-700 pl-4">
            <span className="text-white">10:43:08 LCL</span>
            <span className="text-[#cc5500]">THE PIONEER [CMD]</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <nav className="w-20 border-r border-[#334155] flex flex-col items-center py-6 gap-8 bg-[#0b0f12]">
          <NavIcon icon={<Activity />} label="OPS" active />
          <NavIcon icon={<Box />} label="LOGISTICS" />
          <NavIcon icon={<Users />} label="ROSTER" />
          <NavIcon icon={<Radio />} label="COMMS" />
          <div className="flex-1" />
          <NavIcon icon={<LogOut />} label="LOGOUT" alert />
        </nav>

        <main className="flex-1 bg-black/50 p-6 relative overflow-auto">
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="max-w-5xl mx-auto space-y-6 relative">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl text-white tracking-widest border-l-4 border-[#cc5500] pl-4">
                MISSION WORKSPACE
              </h2>
              <div className="flex gap-2">
                <Button label="LIVE FEED" active />
                <Button label="ARCHIVES" />
              </div>
            </div>

            <div className={`${GRID_STYLES} h-64 border border-[#334155] bg-black/60 p-4 flex flex-col gap-3`}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full border border-orange-800 bg-orange-900/20 flex items-center justify-center text-orange-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-mono uppercase text-orange-500 tracking-[0.18em]">Status Alert</div>
                  <div className="font-black text-white leading-snug text-xl">No signals detected in current operation window.</div>
                  <div className="text-xs text-orange-200/80 mt-1">Long-range scanners are clear; awaiting new tasking.</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <StatusTile icon={<Clock3 className="w-4 h-4" />} label="Last Sweep" value={formatTime(lastSweep)} tone="amber" />
                <StatusTile icon={<Radio className="w-4 h-4" />} label="Sweep Integrity" value="99.4%" tone="green" />
                <StatusTile icon={<ShieldCheck className="w-4 h-4" />} label="Noise Floor" value="Nominal" tone="cool" />
                <StatusTile icon={<Zap className="w-4 h-4" />} label="Priority Tasks" value="None queued" tone="muted" />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setLastSweep(new Date())}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-[#cc5500] text-black font-bold text-xs uppercase tracking-wide border border-[#cc5500] hover:bg-[#e36414] transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Sweep
                </button>
                <a
                  href="/Events"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-900 text-orange-200 font-bold text-xs uppercase tracking-wide border border-orange-800 hover:border-orange-500 hover:text-orange-100 transition-colors"
                >
                  <Terminal className="w-4 h-4" />
                  View Ops
                </a>
              </div>
            </div>
          </div>
        </main>

        <aside className="w-96 border-l border-[#334155] bg-[#0b0f12] flex flex-col">
          <div className="p-4 border-b border-[#334155]">
            <h3 className={HEADER_TEXT}>BONFIRE STATUS</h3>
            <div className="mt-4 p-4 border border-[#334155] bg-black/40">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white">ACTIVE SOULS</span>
                <span className="text-[#00ff41]">12 ONLINE</span>
              </div>
              <div className="h-24 w-full bg-[#cc5500]/10 flex items-center justify-center border border-[#cc5500]/30">
                <div className="animate-pulse h-2 w-2 bg-[#cc5500]" />
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-[#334155]">
            <h3 className={HEADER_TEXT}>CHAIN OF COMMAND</h3>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-gray-500">CURRENT PIONEER</span>
              <span className="text-white border border-gray-700 px-2 py-1">MurphyJack</span>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            <h3 className={`${HEADER_TEXT} mb-4`}>SYSTEM ALERTS</h3>
            <div className="space-y-2 overflow-y-auto pr-2">
              <AlertItem level="INFO" msg="Redscar Rally Medal awarded to 3 operatives." />
              <AlertItem level="WARN" msg="Industry Bonfire: Heavy traffic reported." />
              <AlertItem level="CRIT" msg="Ranger Training scheduled: 18:00 UTC." />
            </div>
          </div>
        </aside>
      </div>

      <footer className="h-8 bg-[#cc5500] text-black flex items-center px-4 justify-between text-xs font-bold uppercase">
        <span>/// ALERT: ETERNAL VOYAGE PROTOCOL ACTIVE ///</span>
        <span className="tracking-widest">BUILD: NEXUS V1.0 // SECURE CONNECTION</span>
      </footer>
    </div>
  );
}

function StatusTile({ icon, label, value, tone = 'muted' }) {
  const toneClass = tone === 'green'
    ? 'text-emerald-300 border-emerald-900/70 bg-emerald-950/40'
    : tone === 'amber'
    ? 'text-amber-300 border-amber-900/70 bg-amber-950/40'
    : tone === 'cool'
    ? 'text-cyan-200 border-cyan-900/70 bg-cyan-950/40'
    : 'text-zinc-300 border-zinc-800 bg-zinc-950/40';

  return (
    <div className={`border px-3 py-2 flex items-center gap-2 text-xs font-mono ${toneClass}`}>
      <span className="text-sm" aria-hidden>
        {icon}
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-[9px] uppercase text-zinc-500 tracking-[0.14em]">{label}</span>
        <span className="text-sm font-bold text-white">{value}</span>
      </div>
    </div>
  );
}
