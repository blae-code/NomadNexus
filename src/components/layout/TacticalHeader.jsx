import React, { useEffect, useState } from "react";
import { Wifi, AlertTriangle, Settings, Search } from "lucide-react";
import { useLiveKit } from "@/hooks/useLiveKit";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import CommandPalette from "@/components/layout/CommandPalette";
import CompactOrgStatusHeader from "@/components/dashboard/CompactOrgStatusHeader";

export default function TacticalHeader({
  user,
  latencyMs,
  utcTime,
  walletBalance,
  orgCoffer,
  onToggleWallet,
  walletOpen,
  viewMode,
  onViewModeChange,
  isEditing,
  onIsEditingChange,
  prefersReducedMotion,
  connectionState: connectionStateProp,
}) {
  const queryClient = useQueryClient();
  const { connectionState: lkConnectionState } = useLiveKit() || {};
  const connectionState = connectionStateProp ?? lkConnectionState;
  const [lclTime, setLclTime] = useState("--:--:--");
  const [bars, setBars] = useState([]);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    setLclTime(formatter.format(new Date()));

    const tick = setInterval(() => {
      setLclTime(formatter.format(new Date()));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    setBars([8, 12, 16, 12, 10]);
    if (prefersReducedMotion) return;
    
    const interval = setInterval(() => {
      setBars((prev) => prev.map((h) => Math.max(6, Math.min(18, h + (Math.random() * 6 - 3)))));
    }, 1200);
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  const funds = orgCoffer ?? "N/A";
  const status = deriveStatus(connectionState, lkConnectionState?.error);

  const handleLogout = async () => {
    try {
      const isGuest = !!user?.is_guest;
      
      // Clear all React Query caches before logout
      queryClient.clear();
      
      await supabase.auth.signOut();
      if (isGuest) {
        window.alert("Guest session terminated. To preserve intel, convert to a permanent Service Record now.");
        window.location.href = "/login?upgrade=guest";
      } else {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <>
      <header className="shrink-0 border-b-4 border-[var(--burnt-orange)] bg-gradient-to-r from-black via-[#18181b] to-black flex flex-col z-50 relative shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
        <div className="flex items-center px-6 py-3 justify-between gap-4">
          {/* Logo Section */}
          <div className="flex items-center gap-4 min-w-[225px]">
            <a href="/NomadOpsDashboard" className="flex items-center gap-4 group cursor-pointer">
              <div className="w-9 h-9 bg-[var(--burnt-orange)] flex items-center justify-center group-hover:bg-[#c2410c] transition-colors shadow-[inset_0_0_0_2px_#000]">
                <span className="font-black text-black text-lg tracking-widest select-none">NX</span>
              </div>
              <div className="flex flex-col justify-center leading-none">
                <h1 className="text-[18px] font-black uppercase tracking-[0.18em] text-white group-hover:text-[var(--burnt-orange)] transition-colors drop-shadow-[0_1px_4px_rgba(234,88,12,0.2)]">REDSCAR</h1>
                <span className="text-[10px] font-mono text-zinc-400 tracking-[0.28em]">NOMAD OPS</span>
              </div>
            </a>
          </div>

          {/* Centered Command Palette Trigger */}
          <div className="flex-1 flex items-center justify-center">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded bg-zinc-900 border border-zinc-800 hover:border-[var(--burnt-orange)] text-amber-200 hover:text-amber-300 shadow focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)] transition-colors font-mono text-base"
              title="Open Command Palette (Ctrl+K)"
              onClick={() => setCommandOpen(true)}
            >
              <Search className="w-5 h-5" />
              <span className="hidden md:inline font-mono text-base">Command Palette</span>
              <kbd className="ml-3 px-2 py-1 rounded bg-zinc-800 text-xs text-zinc-300 border border-zinc-700">Ctrl+K</kbd>
            </button>
          </div>

          {/* Time Tracker & Profile */}
          <div className="flex items-center gap-4 justify-end min-w-fit">
            {typeof window !== "undefined" && window.NetworkStatusIndicator ? <window.NetworkStatusIndicator /> : null}

            <div className="flex flex-col items-end leading-tight gap-1">
              <div className="flex items-center gap-2 text-[13px] font-black text-zinc-200">
                <span className="w-5 h-5"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
                {lclTime} <span className="text-[10px] text-zinc-500 ml-2">LCL</span>
              </div>
              <div className="text-[11px] font-mono text-zinc-400">
                {utcTime} <span className="text-zinc-600 ml-2">UTC</span>
              </div>
            </div>
            
            <div className="h-7 w-[1px] bg-zinc-800 mx-2" />

            <div className="flex items-center gap-3 relative">
              <a href="/Profile" className="group flex items-center gap-3 cursor-pointer hover:bg-zinc-900 px-3 py-1 transition-colors rounded border border-zinc-800 min-w-[200px] max-w-[320px] overflow-hidden">
                <div className="flex flex-col justify-center w-full overflow-hidden">
                  <div className="flex flex-row items-center gap-2 w-full">
                    <span className="text-[13px] font-black text-zinc-200 group-hover:text-white truncate max-w-[140px]">
                      {user ? (user.role === 'admin' ? "SYSTEM ADMIN" : (user.callsign || user.rsi_handle || "OPERATIVE")) : "GUEST"}
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-wider group-hover:text-white transition-colors px-1 py-0 rounded bg-[var(--burnt-orange)] text-black font-black whitespace-nowrap">{user?.rank || "VAGRANT"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[12px] font-mono text-amber-300 group-hover:text-amber-200 cursor-pointer truncate max-w-[200px] mt-1"
                    onClick={onToggleWallet}
                    title="Show wallet & coffer overview">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-middle mr-0.5 flex-shrink-0"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3h-8a2 2 0 0 0-2 2v2"/><circle cx="18" cy="13" r="2"/></svg>
                    <span className="font-bold tabular-nums select-all truncate">{formatCredits(walletBalance)}</span>
                    <span className="ml-1 text-[11px] text-zinc-400 font-bold">aUEC</span>
                  </div>
                </div>
                <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-[var(--burnt-orange)] transition-colors rounded-full flex-shrink-0 self-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a7.5 7.5 0 0 1 13 0"/></svg>
                </div>
              </a>
              {/* Wallet popover remains, but is triggered by clicking the wallet balance in the profile box */}
              {walletOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-gradient-to-br from-black via-zinc-900 to-black border-2 border-[var(--burnt-orange)] shadow-2xl p-5 font-mono text-[13px] text-zinc-200 z-50 rounded-lg animate-fade-in">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-800">
                    <span className="text-zinc-400 uppercase tracking-[0.18em] font-bold text-[11px]">Org Coffer</span>
                    <span className="text-emerald-400 font-black text-[14px]">{formatCredits(orgCoffer)}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-zinc-400">
                    Includes pooled Redscar funds.<br />Visit <span className="text-amber-300 font-bold">Treasury</span> for full breakdown.
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-amber-300 font-bold text-[12px]">aUEC</span>
                    <span className="text-white font-black text-[14px]">{formatCredits(walletBalance)}</span>
                  </div>
                </div>
              )}
              {/* ESC-style Exit button */}
              <kbd
                className="ml-3 px-2 py-1 rounded bg-zinc-800 text-xs text-zinc-300 border border-zinc-700 cursor-pointer hover:text-amber-400 transition-colors font-mono select-none"
                title="Logout (ESC)"
                onClick={handleLogout}
              >ESC</kbd>
            </div>
          </div>
        </div>

        {/* Embedded org/status strip */}
        <div className="border-t border-zinc-900/60 bg-black/40">
          <CompactOrgStatusHeader />
        </div>
      </header>
      <CommandPalette open={commandOpen} onClose={setCommandOpen} />
    </>
  );
}

function Telemetry({ label, value, tone = "tech" }) {
  const toneClass =
    tone === "green"
      ? "text-[#00ff41]"
      : tone === "amber"
      ? "text-[#ffbf00]"
      : tone === "burnt"
      ? "text-[var(--burnt-orange)]"
      : "text-white";
  return (
    <div className="data-cell px-3 py-2 flex-col items-start">
      <span className="label-plate px-2 py-0.5 text-[10px]">{label}</span>
      <span className={`text-xl font-black ${toneClass}`}>{value}</span>
    </div>
  );
}

function ConnectionDiode({ status, prefersReducedMotion }) {
  const { color, label } = status;
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-5 h-5 border-2 ${color.border} ${color.bg} shadow-[0_0_12px_rgba(0,0,0,0.6)] ${!prefersReducedMotion && 'animate-[spin_8s_linear_infinite]'}`}
        style={{ boxShadow: `inset 0 0 0 2px #000, 0 0 12px ${color.glow}` }}
      />
      <div className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-1">
        <Wifi className={`w-4 h-4 ${color.text}`} />
        <span>{label}</span>
        {status.alert && <AlertTriangle className="w-4 h-4 text-[#ffbf00]" />}
      </div>
    </div>
  );
}

function SignalMeter({ bars }) {
  return (
    <div className="flex items-end gap-1">
      {bars.map((h, idx) => (
        <div
          key={idx}
          style={{ height: `${h}px` }}
          className={`w-[6px] ${idx % 2 === 0 ? "bg-[var(--burnt-orange)]" : "bg-[#00ff41]"}`}
        />
      ))}
    </div>
  );
}

function formatCredits(value) {
  if (value === null || value === undefined) return "N/A";
  const num = Number(value);
  if (Number.isNaN(num)) return "N/A";
  return `${num.toLocaleString()} aUEC`;
}

function deriveStatus(state) {
  if (state === "connected") {
    return { label: "Connected", alert: false, color: { text: "text-[#00ff41]", bg: "bg-[#00ff41]", border: "border-[#00ff41]", glow: "rgba(0,255,65,0.6)" } };
  }
  if (state === "connecting") {
    return { label: "Linking", alert: false, color: { text: "text-[#ffbf00]", bg: "bg-[#ffbf00]", border: "border-[#ffbf00]", glow: "rgba(255,191,0,0.6)" } };
  }
  return { label: "Disconnected", alert: true, color: { text: "text-[#8a0303]", bg: "bg-[#8a0303]", border: "border-[#8a0303]", glow: "rgba(138,3,3,0.6)" } };
}
