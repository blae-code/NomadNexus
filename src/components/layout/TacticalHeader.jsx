import React, { useEffect, useMemo, useState } from "react";
import { Wifi, AlertTriangle } from "lucide-react";
import { useLiveKit } from "@/hooks/useLiveKit";

import React, { useEffect, useMemo, useState } from "react";
import { Wifi, AlertTriangle, Settings } from "lucide-react";
import { useLiveKit } from "@/hooks/useLiveKit";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
}) {
  const { connectionState } = useLiveKit() || {};
  const [clock, setClock] = useState(utcTime);
  const [bars, setBars] = useState([8, 12, 16, 12, 10]);

  useEffect(() => {
    setClock(utcTime);
  }, [utcTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBars((prev) => prev.map((h) => Math.max(6, Math.min(18, h + (Math.random() * 6 - 3)))));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const funds = useMemo(() => orgCoffer ?? "N/A", [orgCoffer]);
  const status = deriveStatus(connectionState);

  return (
    <div className="relative z-20 bg-[var(--gunmetal)] border-b-4 border-[var(--burnt-orange)] shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-transparent via-[var(--burnt-orange)] to-transparent animate-[pulse_3s_ease-in-out_infinite]" />
      <div className="grid grid-cols-[320px_1fr_320px] gap-6 px-8 py-6 items-stretch">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 bg-[var(--burnt-orange)] text-black font-black text-5xl flex items-center justify-center shadow-[inset_0_0_0_2px_#000]">
            NX
          </div>
          <div className="space-y-1">
            <div className="label-plate px-3 py-1 w-fit">Nomad Nexus Tactical</div>
            <div className="text-4xl leading-none font-black tracking-[0.24em] text-white">Operations Deck</div>
            <div className="text-sm text-amber-300 tracking-[0.18em]">High Contrast Command Surface</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 items-center">
          <Telemetry label="SYS" value="ONLINE" tone="tech" />
          <Telemetry label="LAT" value={`${latencyMs}ms`} tone="amber" />
          <Telemetry label="DEFCON" value="5" tone="green" />
          <Telemetry label="UTC" value={clock} tone="burnt" />
        </div>

        <div className="flex items-center justify-end gap-3">
          <ConnectionDiode status={status} />
          <div className="text-right leading-tight">
            <div className="label-plate px-2 py-1">Operator</div>
            <div className="text-2xl text-white font-black tracking-[0.2em] truncate max-w-[240px]">
              {user?.callsign || user?.email || "Guest"}
            </div>
            <div className="text-[var(--burnt-orange)] font-black text-xl tracking-[0.2em]">
              {user?.rank ? String(user.rank).toUpperCase() : "VAGRANT"}
            </div>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={onToggleWallet}
              className="data-cell px-4 py-3 uppercase tracking-[0.24em] border-[var(--burnt-orange)] text-amber-300"
            >
              <span>Wallet</span>
              <span className="text-white font-black">{formatCredits(walletBalance)}</span>
            </button>
            {walletOpen && (
              <div className="absolute right-0 top-full mt-2 min-w-[260px] bg-black border border-[var(--burnt-orange)] p-4 space-y-2">
                <div className="label-plate px-2 py-1">Org Coffer</div>
                <div className="data-cell px-3 py-2">
                  <span>Reserve</span>
                  <span className="text-emerald-400 font-black">{formatCredits(orgCoffer)}</span>
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400">Click outside to close</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800 bg-black/70 px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-zinc-300">
          <div className="label-plate px-2 py-1">Mode Rail</div>
          <div className="flex items-center divide-x divide-zinc-800 border border-[var(--burnt-orange)]">
            {[
              { id: "standard", label: "Standard" },
              { id: "operator", label: "Operator" },
              { id: "commander", label: "Command" },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => onViewModeChange?.(mode.id)}
                className={`px-4 py-2 font-black tracking-[0.18em] uppercase transition-all ${
                  viewMode === mode.id
                    ? "bg-[var(--burnt-orange)] text-black"
                    : "text-white bg-[#0b0f12] hover:text-amber-300"
                }`}
                type="button"
              >
                {mode.label}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-zinc-500" />
            <Label htmlFor="edit-mode-toggle" className="text-xs font-bold uppercase tracking-wider">Configure Layout</Label>
            <Switch id="edit-mode-toggle" checked={isEditing} onCheckedChange={onIsEditingChange} />
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-zinc-400 uppercase tracking-[0.2em]">
          <span className="data-cell px-3 py-1">Live Ops Rail</span>
          <SignalMeter bars={bars} />
        </div>
      </div>
    </div>
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

function ConnectionDiode({ status }) {
  const { color, label } = status;
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-5 h-5 border-2 ${color.border} ${color.bg} shadow-[0_0_12px_rgba(0,0,0,0.6)] animate-[spin_8s_linear_infinite]`}
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
