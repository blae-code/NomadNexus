import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, Users, Radio, Shield, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabaseApi } from "@/lib/supabaseApi";
import { cn } from "@/lib/utils";

export default function OrgStatusWidget() {
  const defconLevel = "5 (NORMAL)";
  
  // Determine Active Event
  const { data: activeEvent } = useQuery({
    queryKey: ['dashboard-active-event'],
    queryFn: async () => {
       const events = await supabaseApi.entities.Event.list({
          filter: { status: 'active' },
          sort: { start_time: -1 },
          limit: 1
       });
       return events[0] || null;
    }
  });

  const { data: stats, dataUpdatedAt: statsUpdatedAt } = useQuery({
    queryKey: ['dashboard-org-stats', activeEvent?.id],
    queryFn: async () => {
      if (!activeEvent) return { total: 0, ready: 0, down: 0, engaged: 0, idle: 0 };
      
      const statuses = await supabaseApi.entities.PlayerStatus.list({ event_id: activeEvent.id });
      return {
         total: statuses.length,
         ready: statuses.filter(s => s.status === 'READY').length,
         down: statuses.filter(s => s.status === 'DOWN' || s.status === 'DISTRESS').length,
         engaged: statuses.filter(s => s.status === 'ENGAGED').length,
         idle: statuses.filter(s => !s.status || s.status === 'IDLE').length
      };
    },
    enabled: !!activeEvent,
    initialData: { total: 0, ready: 0, down: 0, engaged: 0, idle: 0 }
  });

  const lastSweep = statsUpdatedAt ? new Date(statsUpdatedAt) : null;
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

  const threatLevel = stats.down > 0 ? 'HIGH' : stats.engaged > 0 ? 'ACTIVE' : 'NOMINAL';
  const threatColor = stats.down > 0 ? 'text-red-500' : stats.engaged > 0 ? 'text-amber-500' : 'text-emerald-500';
  const readinessPercent = stats.total > 0 ? Math.round((stats.ready / stats.total) * 100) : 0;

  return (
    <Card className="h-full bg-zinc-900/50 border-zinc-800 flex flex-col overflow-hidden">
      <CardHeader className="py-2 px-3 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
          <Activity className="w-3 h-3 text-zinc-500" />
          Org Status
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-2 flex flex-col gap-2">
        {/* Active Operation Header */}
        <div className="bg-zinc-950 border border-zinc-800 p-2 rounded">
          <div className="text-[8px] text-zinc-500 uppercase tracking-widest mb-0.5">Active Operation</div>
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-bold text-white truncate flex-1">
              {activeEvent ? activeEvent.title : "NO ACTIVE OPS"}
            </div>
            <div className={cn("h-2 w-2 rounded-full shrink-0", activeEvent ? "bg-emerald-500 animate-pulse" : "bg-zinc-800")} />
          </div>
        </div>

        {/* Threat Assessment - Primary */}
        <div className={cn("border p-2 rounded", threatLevel === 'HIGH' ? 'border-red-700 bg-red-950/20' : threatLevel === 'ACTIVE' ? 'border-amber-700 bg-amber-950/20' : 'border-emerald-700 bg-emerald-950/20')}>
          <div className="text-[8px] text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1">
            <AlertTriangle className={cn("w-3 h-3", threatColor)} />
            Threat Status
          </div>
          <div className={cn("text-2xl font-black", threatColor)}>
            {threatLevel}
          </div>
          {stats.down > 0 && (
            <div className="text-[9px] text-red-400 mt-1 flex items-center gap-1">
              <Radio className="w-2 h-2 animate-pulse" />
              {stats.down} Casualty/Distress
            </div>
          )}
        </div>

        {/* Personnel Readiness - Split View */}
        <div className="grid grid-cols-3 gap-2">
          {/* Ready */}
          <div className="bg-emerald-950/20 border border-emerald-800 p-2 rounded flex flex-col items-center">
            <CheckCircle2 className="w-3 h-3 text-emerald-500 mb-1" />
            <span className="text-lg font-black text-emerald-500">{stats.ready}</span>
            <span className="text-[8px] uppercase text-emerald-900 tracking-widest text-center">Ready</span>
          </div>
          
          {/* Engaged */}
          <div className={cn("border p-2 rounded flex flex-col items-center", stats.engaged > 0 ? 'border-amber-800 bg-amber-950/20' : 'border-zinc-800 bg-zinc-900/30')}>
            <Radio className={cn("w-3 h-3 mb-1", stats.engaged > 0 ? 'text-amber-500 animate-pulse' : 'text-zinc-600')} />
            <span className={cn("text-lg font-black", stats.engaged > 0 ? 'text-amber-500' : 'text-zinc-600')}>{stats.engaged}</span>
            <span className="text-[8px] uppercase text-zinc-500 tracking-widest text-center">Engaged</span>
          </div>

          {/* Down/Distress */}
          <div className={cn("border p-2 rounded flex flex-col items-center", stats.down > 0 ? 'border-red-800 bg-red-950/20' : 'border-zinc-800 bg-zinc-900/30')}>
            <AlertTriangle className={cn("w-3 h-3 mb-1", stats.down > 0 ? 'text-red-500 animate-pulse' : 'text-zinc-600')} />
            <span className={cn("text-lg font-black", stats.down > 0 ? 'text-red-500' : 'text-zinc-600')}>{stats.down}</span>
            <span className="text-[8px] uppercase text-zinc-500 tracking-widest text-center">Down</span>
          </div>
        </div>

        {/* Readiness Gauge */}
        <div className="bg-zinc-900/30 border border-zinc-800 p-2 rounded">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] text-zinc-500 uppercase tracking-widest">Readiness</span>
            <span className={cn("text-xs font-bold", readinessPercent >= 80 ? 'text-emerald-500' : readinessPercent >= 50 ? 'text-amber-500' : 'text-red-500')}>
              {readinessPercent}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded overflow-hidden">
            <div 
              className={cn("h-full transition-all", readinessPercent >= 80 ? 'bg-emerald-600' : readinessPercent >= 50 ? 'bg-amber-600' : 'bg-red-600')}
              style={{ width: `${readinessPercent}%` }}
            />
          </div>
        </div>

        {/* Sensors & Summary (compact) */}
        <div className="grid grid-cols-2 gap-2 text-[9px]">
          <div className="bg-zinc-900/30 border border-zinc-800 p-2 rounded">
            <div className="flex items-center justify-between mb-1">
              <div className="text-zinc-500 uppercase tracking-widest">Defcon</div>
              <Shield className="w-3 h-3 text-emerald-600" />
            </div>
            <div className="text-sm font-bold text-white">{defconLevel}</div>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800 p-2 rounded">
            <div className="flex items-center justify-between mb-1">
              <div className="text-zinc-500 uppercase tracking-widest">Total</div>
              <Users className="w-3 h-3 text-zinc-500" />
            </div>
            <div className="text-sm font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800 p-2 rounded">
            <div className="flex items-center justify-between mb-1">
              <div className="text-zinc-500 uppercase tracking-widest">Last Sweep</div>
              <Clock className="w-3 h-3 text-amber-500" />
            </div>
            <div className="text-xs font-semibold text-amber-200">{lastSweep ? formatTime(lastSweep) : 'Pending'}</div>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800 p-2 rounded">
            <div className="flex items-center justify-between mb-1">
              <div className="text-zinc-500 uppercase tracking-widest">Noise Floor</div>
              <Radio className="w-3 h-3 text-emerald-500" />
            </div>
            <div className="text-xs font-semibold text-emerald-300">Nominal</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}