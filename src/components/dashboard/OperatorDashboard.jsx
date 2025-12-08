import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabaseApi } from '@/lib/supabaseApi';
import { Radio, Activity, Users, AlertTriangle } from 'lucide-react';
import CommsEventSelector from '@/components/comms/CommsEventSelector'; // Reuse
import ActiveNetPanel from '@/components/comms/ActiveNetPanel'; // Reuse if possible, or make a simpler version
import StatusChip from '@/components/status/StatusChip';

export default function OperatorDashboard({ user }) {
  // Fetch Active Nets
  const { data: activeNets } = useQuery({
    queryKey: ['operator-active-nets'],
    queryFn: () => supabaseApi.entities.VoiceNet.list({ filter: { status: 'active' } }),
    refetchInterval: 5000,
    initialData: []
  });

  // Fetch All Users Status
  const { data: playerStatuses } = useQuery({
    queryKey: ['operator-player-status'],
    queryFn: () => supabaseApi.entities.PlayerStatus.list(),
    refetchInterval: 3000,
    initialData: []
  });

  // Simple summary counts
  const statusCounts = playerStatuses.reduce((acc, curr) => {
     acc[curr.status] = (acc[curr.status] || 0) + 1;
     return acc;
  }, {});

  return (
    <div className="h-full w-full flex flex-col gap-3 p-3 bg-black">
      {/* Main Row: Comms + Personnel */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Left: Comms Overview */}
        <div className="flex-1 flex flex-col gap-3 min-h-0 min-w-0">
          {/* Active Frequencies */}
          <div className="flex-1 bg-zinc-900/50 border border-zinc-800 p-3 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center gap-2 mb-3 text-emerald-500 shrink-0">
              <Radio className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Active Frequencies</h3>
            </div>
            
            {activeNets.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs font-mono border border-dashed border-zinc-800">
                NO ACTIVE NETS // SILENCE
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2">
                {activeNets.map(net => (
                  <div key={net.id} className="bg-zinc-950 border border-zinc-800 p-2 flex justify-between items-center text-xs">
                    <div>
                      <div className="text-emerald-400 font-bold font-mono">{net.code}</div>
                      <div className="text-[10px] text-zinc-500 uppercase">{net.label}</div>
                    </div>
                    <div className="text-zinc-400 font-mono">100%</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Alerts */}
          <div className="flex-1 bg-zinc-900/50 border border-zinc-800 p-3 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center gap-2 mb-3 text-amber-500 shrink-0">
              <AlertTriangle className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">System Alerts</h3>
            </div>
            <div className="text-[9px] font-mono space-y-1 text-zinc-400 overflow-y-auto">
              <div className="flex gap-2">
                <span className="text-zinc-600 shrink-0">14:20:01</span>
                <span className="text-emerald-500 shrink-0">[SYS]</span>
                <span>Uplink established</span>
              </div>
              <div className="flex gap-2">
                <span className="text-zinc-600 shrink-0">14:18:22</span>
                <span className="text-amber-500 shrink-0">[WARN]</span>
                <span>Signal degradation in Sector 4</span>
              </div>
              <div className="flex gap-2">
                <span className="text-zinc-600 shrink-0">14:15:00</span>
                <span className="text-blue-500 shrink-0">[INFO]</span>
                <span>Event initialized</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Personnel Status */}
        <div className="w-72 bg-zinc-900/50 border border-zinc-800 flex flex-col min-h-0 overflow-hidden">
          <div className="p-3 border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <Users className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Personnel Status</h3>
            </div>
            
            {/* Summary Chips */}
            <div className="flex gap-2 flex-wrap text-[9px]">
              <div className="px-2 py-1 bg-zinc-950 border border-zinc-800">
                TOTAL: <span className="text-white font-bold">{playerStatuses.length}</span>
              </div>
              <div className="px-2 py-1 bg-emerald-900/20 border border-emerald-900/50 text-emerald-500">
                READY: <span className="text-white font-bold">{statusCounts['READY'] || 0}</span>
              </div>
              <div className="px-2 py-1 bg-red-900/20 border border-red-900/50 text-red-500">
                DOWN: <span className="text-white font-bold">{statusCounts['DOWN'] || 0}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {playerStatuses.length === 0 ? (
              <div className="text-center text-zinc-600 text-xs py-4">NO TELEMETRY</div>
            ) : (
              playerStatuses.map(status => (
                <div key={status.id} className="flex items-center justify-between p-1.5 bg-zinc-950/50 border border-zinc-800/50 hover:border-zinc-700 text-[9px]">
                  <div className="text-zinc-300 font-mono truncate">
                    {status.user_id.slice(0, 6)}...
                  </div>
                  <StatusChip status={status.status} size="xs" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}