import React, { useState, useEffect } from "react";
import OrgResourcesWidget from "@/components/dashboard/OrgResourcesWidget";
import OrgStatusWidget from "@/components/dashboard/OrgStatusWidget";
import StatusAlertsWidget from "@/components/dashboard/StatusAlertsWidget";
import EventProjectionPanel from "@/components/dashboard/EventProjectionPanel";
import PersonalLogPanel from "@/components/dashboard/PersonalLogPanel";
import ArmoryStatusPanel from "@/components/dashboard/ArmoryStatusPanel";
import PioneerUplink from "@/components/dashboard/PioneerUplink";
import RankVisualizer from "@/components/dashboard/RankVisualizer";
import CommanderDashboard from "@/components/dashboard/CommanderDashboard";
import OperatorDashboard from "@/components/dashboard/OperatorDashboard";
import TechCard from "@/components/ui/TechCard";
import BonfireHeartbeat from "@/components/dashboard/BonfireHeartbeat";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { getUserRankValue } from "@/components/permissions";
import { LayoutDashboard, Map, Radio } from "lucide-react";

export default function NomadOpsDashboard() {
  const { data: user } = useQuery({
     queryKey: ['dashboard-user'],
     queryFn: async () => {
        if (!supabase) return null;
        const { data } = await supabase.auth.getUser();
        const authUser = data?.user;
        if (!authUser) return null;
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();
        if (error) {
          console.error('Dashboard user fetch failed', error);
          return authUser;
        }
        return profile || authUser;
     }
  });

  const [viewMode, setViewMode] = useState('standard');

  // Determine default view based on rank/role
  useEffect(() => {
     if (user) {
        const rankVal = getUserRankValue(user.rank);
        if (rankVal >= 5) { // Founder/Pioneer
           setViewMode('commander');
        } else if (rankVal >= 3 && rankVal <= 4) { // Scout/Voyager
           setViewMode('operator');
        } else {
           setViewMode('standard');
        }
     }
  }, [user]);

  const todayStr = new Date().toLocaleDateString();
  const activeSouls = user ? 1 : 0;

  const StandardDashboard = () => (
    <div className="h-full w-full grid grid-rows-[auto_1fr] bg-[#0b0f12] text-tech-white relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#20242c 1px, transparent 1px), linear-gradient(90deg, #20242c 1px, transparent 1px)',
          backgroundSize: '46px 46px',
        }}
      />

      {/* Faux intranet header */}
      <header className="relative z-10 h-12 px-4 flex items-center justify-between border-b border-burnt-orange/60 bg-black/70 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-burnt-orange text-black font-black flex items-center justify-center text-sm">
            NX
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-burnt-orange">Nomad Nexus</div>
            <div className="text-[11px] text-zinc-400">Intranet Control Surface</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <span className="px-2 py-1 border border-zinc-700 bg-black/50">SYS OK</span>
          <span className="px-2 py-1 border border-zinc-700 bg-black/50">{user?.rank || 'VAGRANT'} ACCESS</span>
        </div>
      </header>

      {/* Marquee */}
      <div className="relative z-10 h-8 border-b border-burnt-orange/60 bg-black/80 overflow-hidden">
        <div className="absolute inset-0 flex items-center whitespace-nowrap animate-marquee text-[11px] uppercase tracking-[0.25em] text-amber-300 px-4">
          /// ALERT: REDSCAR NOMADS // ETERNAL VOYAGE PROTOCOL ACTIVE /// {todayStr} ///
        </div>
      </div>

      {/* Status rail */}
      <div className="relative z-10 h-10 border-b border-zinc-800 bg-black/70 px-4 flex items-center gap-4 text-[11px] uppercase tracking-[0.2em] text-zinc-400">
        <span className="px-2 py-1 border border-zinc-700 bg-black/60">Comms Link: Online</span>
        <span className="px-2 py-1 border border-zinc-700 bg-black/60">Uptime: Stable</span>
        <span className="px-2 py-1 border border-zinc-700 bg-black/60">Build: Nexus v1.0</span>
        <span className="px-2 py-1 border border-zinc-700 bg-black/60 text-burnt-orange">Mode: {viewMode.toUpperCase()}</span>
      </div>

      {/* Main workspace */}
      <main className="relative z-10 h-full grid grid-cols-[260px_1fr_320px] gap-4 p-4 overflow-hidden">
        {/* Explorer / Systems rail */}
        <TechCard className="h-full grid grid-rows-[auto_1fr]">
          <div className="px-3 py-2 border-b border-zinc-800 uppercase text-[11px] tracking-[0.2em] text-zinc-400">
            Systems
          </div>
          <div className="overflow-auto divide-y divide-zinc-800 custom-scrollbar">
            <div className="p-3">
              <OrgResourcesWidget />
            </div>
            <div className="p-3">
              <StatusAlertsWidget />
            </div>
            <div className="p-3">
              <ArmoryStatusPanel />
            </div>
          </div>
        </TechCard>

        {/* Center workbench with tabs */}
        <TechCard className="h-full min-h-0 bg-[#0e141a]/80 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-black/50">
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Mission Workspace</div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
              <span className="px-2 py-1 border border-zinc-800 bg-zinc-900/50">LIVE</span>
              <span className="px-2 py-1 border border-zinc-800 bg-zinc-900/50">
                {new Date().toLocaleTimeString([], { hour12: false })}
              </span>
            </div>
          </div>
          <Tabs defaultValue="ops" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-3 bg-zinc-900 border-b border-zinc-800 h-10">
              <TabsTrigger value="ops" className="text-[11px] uppercase tracking-[0.15em]">Ops Feed</TabsTrigger>
              <TabsTrigger value="intel" className="text-[11px] uppercase tracking-[0.15em]">Intel</TabsTrigger>
              <TabsTrigger value="resources" className="text-[11px] uppercase tracking-[0.15em]">Resources</TabsTrigger>
            </TabsList>

            <TabsContent value="ops" className="flex-1 overflow-hidden p-4 flex flex-col gap-4">
              <TechCard className="h-[38%] min-h-[200px]">
                <EventProjectionPanel user={user} />
              </TechCard>
              <TechCard className="flex-1 min-h-0">
                <PersonalLogPanel user={user} />
              </TechCard>
            </TabsContent>

            <TabsContent value="intel" className="flex-1 overflow-hidden p-4 flex flex-col gap-4">
              <TechCard className="flex-1 min-h-0">
                <OrgStatusWidget />
              </TechCard>
              <TechCard className="h-[32%] min-h-[180px]">
                <RankVisualizer currentRank={user?.rank || 'Vagrant'} />
              </TechCard>
            </TabsContent>

            <TabsContent value="resources" className="flex-1 overflow-hidden p-4 flex flex-col gap-4">
              <TechCard className="flex-1 min-h-0">
                <OrgResourcesWidget />
              </TechCard>
              <TechCard className="h-[32%] min-h-[160px]">
                <ArmoryStatusPanel />
              </TechCard>
            </TabsContent>
          </Tabs>
        </TechCard>

        {/* Aux / Quick actions */}
        <TechCard className="h-full grid grid-rows-[auto_1fr_auto]">
          <div className="px-3 py-2 border-b border-zinc-800 uppercase text-[11px] tracking-[0.2em] text-zinc-400">
            Aux Ops
          </div>
          <div className="overflow-auto space-y-3 p-3 custom-scrollbar">
            <TechCard className="h-full">
              <BonfireHeartbeat activeUserCount={activeSouls} />
            </TechCard>
            <TechCard className="h-full">
              <PioneerUplink />
            </TechCard>
            <TechCard className="h-full">
              <CommanderDashboard user={user} />
            </TechCard>
            <TechCard className="h-full">
              <OperatorDashboard user={user} />
            </TechCard>
          </div>
          <div className="border-t border-zinc-800 p-3 text-[11px] text-zinc-500 flex items-center justify-between bg-black/50">
            <span>Uplink Stable</span>
            <span className="text-burnt-orange">●</span>
          </div>
        </TechCard>
      </main>
    </div>
  );

  return (
    <div className="h-full flex flex-col relative bg-black">
       <div className="screen-effects" />
       {/* Dashboard Switcher / Header */}
       <div className="h-10 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 z-50">
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">View Mode:</span>
             <div className="flex bg-zinc-900 border border-zinc-800 p-0.5">
                <button 
                  onClick={() => setViewMode('standard')}
                  className={`px-2 py-1 text-[11px] uppercase tracking-[0.18em] border border-zinc-700 transition-colors ${
                    viewMode === 'standard' ? 'bg-burnt-orange text-black' : 'bg-transparent text-zinc-500'
                  }`}
                  title="Standard Dashboard"
                >
                   <LayoutDashboard className="w-4 h-4" />
                </button>
                {getUserRankValue(user?.rank) >= 3 && (
                  <button 
                     onClick={() => setViewMode('operator')}
                     className={`px-2 py-1 text-[11px] uppercase tracking-[0.18em] border border-zinc-700 transition-colors ${
                      viewMode === 'operator' ? 'bg-burnt-orange text-black' : 'bg-transparent text-zinc-500'
                    }`}
                     title="Operator Console"
                  >
                     <Radio className="w-4 h-4" />
                  </button>
                )}
                {getUserRankValue(user?.rank) >= 5 && (
                  <button 
                     onClick={() => setViewMode('commander')}
                     className={`px-2 py-1 text-[11px] uppercase tracking-[0.18em] border border-zinc-700 transition-colors ${
                      viewMode === 'commander' ? 'bg-burnt-orange text-black' : 'bg-transparent text-zinc-500'
                    }`}
                     title="Tactical Command"
                  >
                     <Map className="w-4 h-4" />
                  </button>
                )}
             </div>
          </div>
          
          {user?.rank && (
            <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[9px] font-black px-2 py-0.5 uppercase tracking-widest">
               {user.rank} CLEARANCE
            </div>
          )}
       </div>

       {/* Dashboard Content */}
       <div className="flex-1 overflow-hidden relative">
          {viewMode === 'commander' && <CommanderDashboard user={user} />}
          {viewMode === 'operator' && <OperatorDashboard user={user} />}
          {viewMode === 'standard' && <StandardDashboard />}
       </div>
    </div>
  );
}
