import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getUserRankValue } from "@/components/permissions";

import EventProjectionPanel from "@/components/dashboard/EventProjectionPanel";
import PersonalLogPanel from "@/components/dashboard/PersonalLogPanel";
import ActiveNetPanel from "@/components/comms/ActiveNetPanel";
import CommanderDashboard from "@/components/dashboard/CommanderDashboard";
import OperatorDashboard from "@/components/dashboard/OperatorDashboard";
import TacticalMap from "@/components/ops/TacticalMap";

export default function NomadOpsDashboard() {
  const { data: user } = useQuery({
    queryKey: ["dashboard-user"],
    queryFn: async () => {
      if (!supabase) return null;
      const { data } = await supabase.auth.getUser();
      const authUser = data?.user;
      if (!authUser) return null;
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();
      if (error) {
        console.error("Dashboard user fetch failed", error);
        return authUser;
      }
      return profile || authUser;
    },
  });

  const [viewMode, setViewMode] = useState("standard");
  const [isBooting, setIsBooting] = useState(true);
  const [bootStep, setBootStep] = useState(0);
  const [utcTime, setUtcTime] = useState(
    new Date().toLocaleTimeString("en-GB", { timeZone: "UTC", hour12: false })
  );
  const [latencyMs] = useState(Math.floor(20 + Math.random() * 26));
  const [walletOpen, setWalletOpen] = useState(false);

  useEffect(() => {
    if (user && isBooting) {
      const rankVal = getUserRankValue(user.rank);
      if (rankVal >= 5) setViewMode("commander");
      else if (rankVal >= 3) setViewMode("operator");
      else setViewMode("standard");
    }
  }, [user, isBooting]);

  useEffect(() => {
    const sequence = [
      setTimeout(() => setBootStep(1), 400),
      setTimeout(() => setBootStep(2), 1200),
      setTimeout(() => setBootStep(3), 1800),
      setTimeout(() => setIsBooting(false), 2400),
    ];
    return () => sequence.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const tick = setInterval(() => {
      setUtcTime(
        new Date().toLocaleTimeString("en-GB", { timeZone: "UTC", hour12: false })
      );
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const handleViewModeChange = (mode) => setViewMode(mode);

  const PanelContainer = ({ children, className = "" }) => (
    <div
      className={`relative border border-zinc-800 bg-zinc-950/90 text-tech-white overflow-hidden flex flex-col ${className}`}
    >
      {children}
    </div>
  );
  const TechHeader = ({ title }) => (
    <div
      className="shrink-0 h-8 flex items-center px-3 text-[11px] font-mono uppercase tracking-[0.24em] text-[var(--burnt-orange)] border-b border-zinc-800"
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(204,85,0,0.14) 0, rgba(204,85,0,0.14) 6px, transparent 6px, transparent 12px)",
      }}
    >
      {title}
    </div>
  );

  const WidgetPanel = ({ title, children, className = "" }) => (
    <PanelContainer className={className}>
      <TechHeader title={title} />
      <div className="p-3 flex-1 overflow-auto custom-scrollbar">{children}</div>
    </PanelContainer>
  );

  const StandardDashboard = () => (
    <div className="h-full w-full grid grid-cols-[320px_1fr_320px] gap-2 p-2">
      <PanelContainer>
        <TechHeader title="Intel Systems" />
        <div className="flex-1 p-3 text-zinc-700 text-[11px] uppercase tracking-[0.18em]">
          {/* Left column intentionally blank while we focus on voice comms. */}
        </div>
      </PanelContainer>

      <div className="flex flex-col gap-2 overflow-hidden">
        <PanelContainer className="h-[40%] min-h-[200px]">
          <TechHeader title="Event Projection" />
          <div className="flex-1 p-3 overflow-hidden">
            <EventProjectionPanel user={user} />
          </div>
        </PanelContainer>
        <PanelContainer className="flex-1 min-h-0">
          <TechHeader title="Personal Log" />
          <div className="flex-1 p-3 overflow-hidden">
            <PersonalLogPanel user={user} />
          </div>
        </PanelContainer>
      </div>

      <PanelContainer>
        <TechHeader title="Active Comms" />
        <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
          <ActiveNetPanel user={user} />
        </div>
      </PanelContainer>
    </div>
  );

  return (
    <div className="min-h-screen w-full overflow-hidden overflow-x-hidden bg-black flex flex-col relative font-mono text-tech-white">
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(circle at 50% 30%, #1a1f2e 0%, #000000 70%)" }}
      />
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:100%_4px] z-0" />
      <div className="screen-effects z-50 pointer-events-none" />

      <div
        className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center transition-opacity duration-1000 ${
          isBooting ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="w-96 space-y-2 font-mono text-xs">
          <div className={`flex justify-between ${bootStep >= 1 ? "opacity-100" : "opacity-0"}`}>
            <span className="text-zinc-500">INITIATING KERNEL...</span>
            <span className="text-emerald-500 font-bold">OK</span>
          </div>
          <div className={`flex justify-between ${bootStep >= 2 ? "opacity-100" : "opacity-0"}`}>
            <span className="text-zinc-500">ESTABLISHING SECURE HANDSHAKE...</span>
            <span className="text-emerald-500 font-bold">OK</span>
          </div>
          <div className={`flex justify-between ${bootStep >= 3 ? "opacity-100" : "opacity-0"}`}>
            <span className="text-zinc-500">DECRYPTING USER PROFILE...</span>
            <span className="text-[var(--burnt-orange)] font-bold animate-pulse">COMPLETE</span>
          </div>
          {bootStep >= 1 && (
            <div className="h-1 bg-zinc-900 mt-4 overflow-hidden">
              <div
                className="h-full bg-[var(--burnt-orange)] transition-all duration-[2000ms] ease-out"
                style={{ width: bootStep >= 3 ? "100%" : bootStep >= 2 ? "60%" : "10%" }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Single compact header (merged) */}
      <header className="relative z-30 shrink-0 bg-[#0c0c0e] border-b-2 border-[var(--burnt-orange)] shadow-[0_12px_34px_rgba(0,0,0,0.55)]">
        <div className="grid grid-cols-[480px_1fr_480px] h-48 items-center px-14 gap-12">
          <div className="flex items-center gap-8 min-w-[420px]">
            <div className="h-[6rem] w-[6rem] bg-[var(--burnt-orange)] text-black font-black text-6xl flex items-center justify-center">
              NX
            </div>
            <div className="space-y-2">
              <div className="text-6xl tracking-[0.3em] uppercase text-tech-white font-black leading-none">
                Nomad Nexus
              </div>
              <div className="text-3xl text-zinc-300 tracking-[0.2em] leading-none">
                Redscar Ops Interface
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-5 text-3xl uppercase tracking-[0.26em] leading-none">
              <div className="flex items-center gap-5 text-emerald-400">
                <span className="h-6 w-6 bg-emerald-400" />
                <span>Sys: Online</span>
              </div>
              <div className="flex items-center gap-5 text-amber-300">
                <span className="h-6 w-6 bg-amber-400" />
                <span>Latency: {latencyMs} ms</span>
              </div>
              <div className="flex items-center gap-5 text-zinc-300">
                <span className="h-6 w-6 bg-zinc-500" />
                <span>DEFCON: 5</span>
              </div>
              <div className="flex items-center gap-5 text-[var(--burnt-orange)] font-black">
                <span className="h-6 w-6 bg-[var(--burnt-orange)]" />
                <span className="text-4xl">UTC: {utcTime}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-10 items-center min-w-[460px]">
            <div className="flex flex-col justify-center items-end text-4xl uppercase tracking-[0.26em] leading-tight">
              <div className="text-zinc-400 text-lg">User</div>
              <div className="text-tech-white font-bold text-4xl truncate max-w-[300px] text-right">
                {user?.callsign || user?.email || "Guest"}
              </div>
              <div className="text-[var(--burnt-orange)] font-black text-3xl">
                {user?.rank ? String(user.rank).toUpperCase() : "VAGRANT"}
              </div>
            </div>
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => setWalletOpen((prev) => !prev)}
                className="flex items-center gap-5 px-10 py-6 border border-[var(--burnt-orange)] text-2xl font-black uppercase tracking-[0.3em] bg-black/70 hover:bg-[var(--burnt-orange)] hover:text-black transition-colors whitespace-nowrap"
                title="Toggle wallet & coffer overview"
              >
                <span>Wallet</span>
                <span className="text-amber-300">
                  {user?.wallet_balance
                    ? `${user.wallet_balance.toLocaleString()} aUEC`
                    : "N/A"}
                </span>
              </button>
              {walletOpen && (
                <div className="absolute right-0 top-full mt-3 w-96 border border-zinc-800 bg-zinc-950 shadow-2xl p-6 text-lg space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Personal aUEC</span>
                    <span className="text-tech-white font-bold">
                      {user?.wallet_balance ? `${user.wallet_balance.toLocaleString()} aUEC` : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Redscar Coffer</span>
                    <span className="text-[var(--burnt-orange)] font-bold">
                      {user?.org_coffer_total
                        ? `${user.org_coffer_total.toLocaleString()} aUEC`
                        : "-"}
                    </span>
                  </div>
                  <div className="text-zinc-500 text-[11px] tracking-[0.18em]">
                    Click outside to close.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div
        className={`flex-1 flex overflow-hidden relative z-10 transition-all duration-700 ${
          isBooting ? "blur-sm scale-95 opacity-0" : "blur-0 scale-100 opacity-100"
        } w-full`}
      >
        <div className="flex-1 relative overflow-hidden bg-black/40 p-4 box-border">
          <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[var(--burnt-orange)] opacity-50" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[var(--burnt-orange)] opacity-50" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[var(--burnt-orange)] opacity-50" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[var(--burnt-orange)] opacity-50" />

          <div className="relative h-full w-full">
            {viewMode === "commander" && <CommanderDashboard user={user} />}
            {viewMode === "operator" && <OperatorDashboard user={user} />}
            {viewMode === "standard" && <StandardDashboard />}
          </div>
        </div>
      </div>
    </div>
  );
}
