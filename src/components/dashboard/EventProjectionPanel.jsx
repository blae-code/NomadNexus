import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseApi } from "@/lib/supabaseApi";
import { cn } from "@/lib/utils";
import { Shield, Crosshair, Zap, RefreshCw, Clock3, Radio } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function EventProjectionPanel({ user, compact = false, onEventSelect, selectedEventId }) {
   const queryClient = useQueryClient();
   const [lastSweep, setLastSweep] = useState(() => new Date());

   const { data: activeEvents = [], dataUpdatedAt } = useQuery({
      queryKey: ['projection-active-events'],
      queryFn: async () => {
         const events = await supabaseApi.entities.Event.list({
            filter: { status: 'active' },
            sort: { start_time: 1 },
            limit: 6
         });
         return events;
      },
      enabled: !!user,
      initialData: [],
   });

   const { data: userStatuses = [] } = useQuery({
      queryKey: ['projection-user-status', user?.id],
      queryFn: async () => {
         if (!user) return [];
         return supabaseApi.entities.PlayerStatus.list({ filter: { user_id: user.id } });
      },
      enabled: !!user,
      initialData: [],
   });

   useEffect(() => {
      if (!dataUpdatedAt) return;
      setLastSweep(new Date(dataUpdatedAt));
   }, [dataUpdatedAt]);

   const activeParticipation = React.useMemo(() => {
      const ids = activeEvents.map(e => e.id);
      return userStatuses.find(s => ids.includes(s.event_id));
   }, [activeEvents, userStatuses]);

   const currentEvent = React.useMemo(() => {
      return activeEvents.find(ev => ev.id === activeParticipation?.event_id) || null;
   }, [activeEvents, activeParticipation]);

   useEffect(() => {
      if (currentEvent && onEventSelect) {
         onEventSelect(currentEvent.id);
      }
   }, [currentEvent, onEventSelect]);

  const getTimeRemaining = (dateStr) => {
     const diff = new Date(dateStr) - new Date();
     if (diff <= 0) return "00:00";
     const hours = Math.floor(diff / (1000 * 60 * 60));
     const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
     return `${hours.toString().padStart(2, '0')}H ${mins.toString().padStart(2, '0')}M`;
  };

   const formatTime = (date) => {
      try {
         return new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
         }).format(date);
      } catch (err) {
         return '--:--:--';
      }
   };

   if (activeEvents.length === 0) {
      return (
         <div className={cn("h-full border border-orange-900/40 bg-zinc-950 flex items-center justify-center", compact ? "p-4" : "p-6")}> 
            <div className={cn("w-full text-center", compact ? "max-w-md" : "max-w-xl")}> 
               <div className="text-[11px] font-mono uppercase text-orange-500 tracking-[0.18em] mb-2">Ops Dashboard</div>
               <div className={cn("font-black text-white leading-snug", compact ? "text-lg" : "text-2xl")}>No active operations</div>
               <div className="text-xs text-orange-200/80 mt-1">Standby for tasking or schedule a new operation.</div>
               <div className="flex justify-center gap-2 mt-3">
                  <button
                     type="button"
                     onClick={() => queryClient.invalidateQueries({ queryKey: ['projection-active-events'] })}
                     className="inline-flex items-center gap-2 px-3 py-2 bg-orange-600 text-black font-bold text-[11px] uppercase tracking-wide border border-orange-500 hover:bg-orange-500 transition-colors"
                  >
                     <RefreshCw className="w-4 h-4" />
                     Refresh
                  </button>
                  <a
                     href="/Events"
                     className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-900 text-orange-200 font-bold text-[11px] uppercase tracking-wide border border-orange-800 hover:border-orange-500 hover:text-orange-100 transition-colors"
                  >
                     <Crosshair className="w-4 h-4" />
                     Open Events
                  </a>
               </div>
            </div>
         </div>
      );
   }

   // Compact View for Sidebars
   if (compact) {
      const nextEvent = currentEvent || activeEvents[0];
      const isFocused = nextEvent?.event_type === 'focused';
      return (
         <div className={cn(
            "border bg-black p-4 flex flex-col items-center text-center relative overflow-hidden",
            isFocused ? "border-red-900/50" : "border-emerald-900/50"
         )}>
            <div className="text-[9px] font-mono uppercase text-zinc-500 mb-1 flex items-center gap-1">
               <span className={cn("w-1.5 h-1.5 rounded-full", isFocused ? "bg-amber-500 animate-pulse" : "bg-zinc-700")} />
               {currentEvent ? "CURRENT OP" : "ACTIVE OPS"}
            </div>
            <div className="text-lg font-black text-white uppercase leading-none mb-1 truncate max-w-full">
               {nextEvent?.title || "No active ops"}
            </div>
            {nextEvent?.start_time && (
               <div className="text-xs font-mono font-bold text-zinc-400">
                  T-{getTimeRemaining(nextEvent.start_time)}
               </div>
            )}
         </div>
      );
   }

  return (
      <div className="h-full border border-orange-900/40 bg-zinc-950/60 p-4 flex flex-col gap-4">
         {currentEvent ? (
            <div className="space-y-3">
               <div className="flex items-start justify-between gap-3">
                  <div>
                     <div className="text-[11px] font-mono uppercase text-orange-500 tracking-[0.18em]">Current Operation</div>
                     <div className="text-2xl font-black text-white leading-snug">{currentEvent.title}</div>
                     <div className="text-xs text-zinc-400">{currentEvent.location || 'Classified'} · T-{getTimeRemaining(currentEvent.start_time)}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                     <button
                        type="button"
                        onClick={() => onEventSelect?.(currentEvent.id)}
                        className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide bg-orange-600 text-black border border-orange-500 hover:bg-orange-500"
                     >
                        Route Comms
                     </button>
                     <a
                        href={createPageUrl('/Events', { id: currentEvent.id })}
                        className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide bg-zinc-900 text-orange-200 border border-orange-800 hover:border-orange-500 hover:text-orange-100 text-center"
                     >
                        Open Event
                     </a>
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <StatusTile icon={<Clock3 className="w-4 h-4" />} label="Last Sweep" value={formatTime(lastSweep)} tone="amber" />
                  <StatusTile icon={<Radio className="w-4 h-4" />} label="Sweep Integrity" value="99.4%" tone="green" />
                  <StatusTile icon={<Shield className="w-4 h-4" />} label="Noise Floor" value="Nominal" tone="cool" />
                  <StatusTile icon={<Zap className="w-4 h-4" />} label="Priority Tasks" value={currentEvent.tags?.[0] || 'None queued'} tone="muted" />
               </div>
            </div>
         ) : (
            <div className="flex-1 flex flex-col gap-3">
               <div className="text-[11px] font-mono uppercase text-orange-500 tracking-[0.18em]">Active Operations</div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                  {activeEvents.map((event) => {
                     const isFocused = event.event_type === 'focused';
                     const statusColor = isFocused ? "text-red-500" : "text-emerald-500";
                     const isSelected = selectedEventId === event.id;
                     return (
                        <button
                           key={event.id}
                           onClick={() => onEventSelect?.(event.id)}
                           className={cn(
                              "border bg-black p-4 flex flex-col gap-2 text-left transition-all hover:border-orange-500",
                              isFocused ? "border-red-900/50" : "border-emerald-900/50",
                              isSelected && "ring-2 ring-orange-500/60"
                           )}
                        >
                           <div className="flex items-center justify-between">
                              <div className={cn("text-[9px] uppercase tracking-[0.24em] font-black", statusColor)}>
                                 {isFocused ? "Bonfire" : "Campfire"}
                              </div>
                              {isSelected && <span className="text-[10px] text-orange-400">Routed</span>}
                           </div>
                           <div className="text-lg font-black text-white leading-tight">{event.title}</div>
                           <div className="text-[11px] text-zinc-400">T-{getTimeRemaining(event.start_time)}</div>
                           <div className="text-[10px] text-zinc-500 uppercase">{event.location || 'Classified'}</div>
                        </button>
                     );
                  })}
               </div>
            </div>
         )}
      </div>
  );
}

function StatusTile({ icon, label, value, tone = 'muted' }) {
   const toneClass = tone === 'green'
      ? 'text-emerald-400 border-emerald-800/70 bg-emerald-950/30'
      : tone === 'amber'
      ? 'text-amber-300 border-amber-800/60 bg-amber-950/20'
      : tone === 'cool'
      ? 'text-cyan-200 border-cyan-800/60 bg-cyan-950/20'
      : 'text-zinc-300 border-zinc-800 bg-zinc-950/40';

   return (
      <div className={cn('border px-3 py-2 flex items-center gap-2 text-xs font-mono', toneClass)}>
         <span className="text-sm" aria-hidden>
            {icon}
         </span>
         <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase text-zinc-500 tracking-[0.14em]">{label}</span>
            <span className="text-sm font-bold text-white">{value}</span>
         </div>
      </div>
   );
}