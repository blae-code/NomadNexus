import React, { useState, useEffect } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getUserRankValue } from "@/components/permissions";
import LiveKitErrorBoundary from "@/components/comms/LiveKitErrorBoundary";
import { 
  DndContext, 
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import { 
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

import EventProjectionPanel from "@/components/dashboard/EventProjectionPanel";
import PersonalLogPanel from "@/components/dashboard/PersonalLogPanel";
import CommsDashboardPanel from "@/components/comms/CommsDashboardPanel";
import { useLiveKit } from '@/hooks/useLiveKit';
import CommanderDashboard from "@/components/dashboard/CommanderDashboard";
import OperatorDashboard from "@/components/dashboard/OperatorDashboard";
import TacticalHeader from "@/components/layout/TacticalHeader";
import TickerBanner from "@/components/layout/TickerBanner";
import StandardDashboard from "@/components/dashboard/StandardDashboard";

export default function NomadOpsDashboard() {
  const { data: user } = useUserProfile();

  const [viewMode, setViewMode] = useState("standard");
  const [isBooting, setIsBooting] = useState(true);
  const [bootStep, setBootStep] = useState(0);
  const [utcTime, setUtcTime] = useState("--:--:--");
  const [latencyMs, setLatencyMs] = useState(0);
  const [walletOpen, setWalletOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const { room, connectionState, audioState } = useLiveKit();
  const [panels, setPanels] = useState([
    { 
      id: 'events', 
      component: (props) => (
        <EventProjectionPanel 
          {...props} 
          onEventSelect={setSelectedEventId}
          selectedEventId={selectedEventId}
        />
      ), 
      title: 'Event Projection' 
    },
    { id: 'log', component: PersonalLogPanel, title: 'Personal Log' },
    {
      id: 'comms',
      component: (props) => (
        <CommsDashboardPanel
          {...props}
          eventId={selectedEventId}
        />
      ),
      title: 'Active Comms',
    },
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
    setLatencyMs(Math.floor(20 + Math.random() * 26));
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = (event) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsBooting(false);
      setBootStep(3);
      return;
    }

    const sequence = [
      setTimeout(() => setBootStep(1), 400),
      setTimeout(() => setBootStep(2), 1200),
      setTimeout(() => setBootStep(3), 1800),
      setTimeout(() => setIsBooting(false), 2400),
    ];
    return () => sequence.forEach(clearTimeout);
  }, [prefersReducedMotion]);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: "UTC",
      hour12: false,
    });
    setUtcTime(formatter.format(new Date()));

    const tick = setInterval(() => {
      setUtcTime(formatter.format(new Date()));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const handleViewModeChange = (mode) => setViewMode(mode);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragEnd = (event) => {
    const {active, over} = event;
    
    if (!over) return;

    if (active.id !== over.id) {
      setPanels((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
          return items;
        }

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const motionClasses = {
    overlay: !prefersReducedMotion ? 'transition-opacity duration-1000' : '',
    main: !prefersReducedMotion ? 'transition-all duration-700' : '',
    progressBar: !prefersReducedMotion ? 'transition-all duration-[2000ms] ease-out' : '',
  };

  return (
    <div className="h-screen w-full overflow-hidden overflow-x-hidden bg-black flex flex-col relative font-mono text-tech-white">
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(circle at 50% 30%, #1a1f2e 0%, #000000 70%)" }}
      />
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:100%_4px] z-0" />
      <div className="screen-effects z-50 pointer-events-none" />

      <div
        className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center ${motionClasses.overlay} ${
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
            <span
              className={`text-[var(--burnt-orange)] font-bold ${
                !prefersReducedMotion ? "animate-pulse" : ""
              }`}
            >
              COMPLETE
            </span>
          </div>
          {bootStep >= 1 && (
            <div className="h-1 bg-zinc-900 mt-4 overflow-hidden">
              <div
                className={`h-full bg-[var(--burnt-orange)] ${motionClasses.progressBar}`}
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
        prefersReducedMotion={prefersReducedMotion}
      />
      <TickerBanner />

      <main
        aria-label="Nomad Ops Dashboard"
        className={`flex-1 flex overflow-hidden relative z-10 ${motionClasses.main} ${
          isBooting ? "blur-sm scale-95 opacity-0" : "blur-0 scale-100 opacity-100"
        } w-full`}
      >
        <section
          aria-label="Dashboard View"
          className="flex-1 relative overflow-hidden bg-black/40 p-4 box-border"
        >
          <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[var(--burnt-orange)] opacity-50" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[var(--burnt-orange)] opacity-50" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[var(--burnt-orange)] opacity-50" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[var(--burnt-orange)] opacity-50" />

          <div className="relative h-full w-full">
            {viewMode === "commander" && <CommanderDashboard user={user} />}
            {viewMode === "operator" && <OperatorDashboard user={user} />}
            {viewMode === "standard" && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <StandardDashboard 
                  panels={panels} 
                  user={user}
                  isEditing={isEditing} 
                />
              </DndContext>
            )}
          </div>
        </section>
      </main>
    </div>
    </LiveKitErrorBoundary>
  );
}
