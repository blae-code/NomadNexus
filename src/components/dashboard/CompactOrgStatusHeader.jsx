import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabaseApi } from '@/lib/supabaseApi';
import { Activity, AlertTriangle, Users, CheckCircle2, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * CompactOrgStatusHeader
 * Minimal org stats display for embedding in dashboard headers
 * Shows threat level, readiness %, key personnel counts at a glance
 */
export default function CompactOrgStatusHeader() {
  // Determine Active Event
  const { data: activeEvent } = useQuery({
    queryKey: ['compact-header-active-event'],
    queryFn: async () => {
      const events = await supabaseApi.entities.Event.list({
        filter: { status: 'active' },
        sort: { start_time: -1 },
        limit: 1
      });
      return events[0] || null;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['compact-header-org-stats', activeEvent?.id],
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

  const threatLevel = stats.down > 0 ? 'HIGH' : stats.engaged > 0 ? 'ACTIVE' : 'NOMINAL';
  const threatColor = stats.down > 0 ? 'text-red-500' : stats.engaged > 0 ? 'text-amber-500' : 'text-emerald-500';
  const readinessPercent = stats.total > 0 ? Math.round((stats.ready / stats.total) * 100) : 0;

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gradient-to-r from-zinc-950/80 to-zinc-900/60 border-b border-zinc-800/50">
      {/* Active Operation */}
      <div className="flex items-center gap-2 min-w-0">
        <Activity className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
        <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Op:</div>
        <div className="text-sm font-bold text-white truncate max-w-xs">
          {activeEvent ? activeEvent.title : 'NO ACTIVE OPS'}
        </div>
        {activeEvent && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />}
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-zinc-700/50" />

      {/* Threat Level */}
      <div className="flex items-center gap-2">
        <AlertTriangle className={cn("w-3.5 h-3.5 flex-shrink-0", threatColor)} />
        <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Threat:</div>
        <div className={cn("text-sm font-bold", threatColor)}>
          {threatLevel}
        </div>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-zinc-700/50" />

      {/* Readiness */}
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
        <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Ready:</div>
        <div className={cn("text-sm font-bold", readinessPercent >= 80 ? 'text-emerald-500' : readinessPercent >= 50 ? 'text-amber-500' : 'text-red-500')}>
          {readinessPercent}%
        </div>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-zinc-700/50" />

      {/* Key Personnel */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Ready:</span>
          <span className="text-sm font-bold text-emerald-400">{stats.ready}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Engaged:</span>
          <span className="text-sm font-bold text-amber-400">{stats.engaged}</span>
        </div>
        {stats.down > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Down:</span>
            <span className="text-sm font-bold text-red-400">{stats.down}</span>
          </div>
        )}
      </div>

      {/* Total Personnel */}
      <div className="ml-auto flex items-center gap-2 pr-2 border-l border-zinc-700/50 pl-4">
        <Users className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
        <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Total:</div>
        <div className="text-sm font-bold text-zinc-200">{stats.total}</div>
      </div>
    </div>
  );
}
