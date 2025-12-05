import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getUserRankValue } from "@/components/permissions";
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '@/components/ui/SortableItem';

import EventProjectionPanel from "@/components/dashboard/EventProjectionPanel";
import PersonalLogPanel from "@/components/dashboard/PersonalLogPanel";
import ActiveNetPanel from "@/components/comms/ActiveNetPanel";
import CommanderDashboard from "@/components/dashboard/CommanderDashboard";
import OperatorDashboard from "@/components/dashboard/OperatorDashboard";
import TacticalHeader from "@/components/layout/TacticalHeader";

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
  const [isEditing, setIsEditing] = useState(false);
  const [panels, setPanels] = useState([
    { id: 'events', component: EventProjectionPanel, title: 'Event Projection' },
    { id: 'log', component: PersonalLogPanel, title: 'Personal Log' },
    { id: 'comms', component: ActiveNetPanel, title: 'Active Comms' },
  ]);

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
  
  const handleDragEnd = (event) => {
    const {active, over} = event;
    if (active.id !== over.id) {
      setPanels((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const PanelContainer = ({ children, className = "" }) => (
    <div className={`relative border border-[var(--burnt-orange)] bg-[var(--gunmetal)] text-white overflow-hidden flex flex-col ${className}`}>
      {children}
    </div>
  );
  const TechHeader = ({ title }) => (
    <div className="label-plate px-3 py-2 border-b border-[var(--burnt-orange)]">{title}</div>
  );

  const StandardDashboard = () => (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={panels.map(p => p.id)} strategy={rectSortingStrategy}>
        <div className="h-full w-full grid grid-cols-1 md:grid-cols-[360px_1fr_360px] gap-3 p-3 bg-black">
          {panels.map(({ id, component: PanelComponent, title }) => (
            <SortableItem key={id} id={id} isEditing={isEditing}>
              <PanelContainer>
                <TechHeader title={title} />
                <div className="flex-1 p-3 overflow-hidden">
                  <PanelComponent user={user} />
                </div>
              </PanelContainer>
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
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

      <TacticalHeader
        user={user}
        latencyMs={latencyMs}
        utcTime={utcTime}
        walletBalance={user?.wallet_balance}
        orgCoffer={user?.org_coffer_total}
        onToggleWallet={() => setWalletOpen((prev) => !prev)}
        walletOpen={walletOpen}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        isEditing={isEditing}
        onIsEditingChange={setIsEditing}
      />

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
