import React from 'react';
import TacticalMap from '@/components/ops/TacticalMap';
import EventProjectionPanel from '@/components/dashboard/EventProjectionPanel';
import CommsDashboardPanel from '@/components/comms/CommsDashboardPanel';
import CommsAccessPanel from '@/components/comms/CommsAccessPanel';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CommanderDashboard({ user }) {
  const [selectedEventId, setSelectedEventId] = React.useState(null);
  const [showCommsAccessPanel, setShowCommsAccessPanel] = React.useState(false);

  return (
    <div className="h-full w-full flex flex-col">
      {/* Main Content: Two-Column Layout */}
      <div className="flex-1 flex gap-3 p-3 min-h-0 overflow-hidden">
        {/* LEFT COLUMN: Event Projection (top) + Tactical Map (bottom) - Split Vertically */}
        <div className="flex-[2] flex flex-col gap-3 min-h-0 min-w-0">
          {/* Top: Event Projection / Ops Dashboard */}
          <div className="flex-1 border border-zinc-800/50 bg-black/40 overflow-hidden rounded-lg min-h-0">
            <EventProjectionPanel 
              user={user}
              onEventSelect={setSelectedEventId}
              selectedEventId={selectedEventId}
              compact={true}
            />
          </div>

          {/* Bottom: Tactical Map */}
          <div className="flex-1 relative border border-zinc-800/50 bg-black/40 flex flex-col min-w-0 overflow-hidden rounded-lg min-h-0">
            <div className="absolute top-2 left-2 bg-emerald-900/20 text-emerald-500 text-[10px] font-bold px-2 py-1 z-10 border-b border-r border-emerald-900/50 rounded-sm">
              TACTICAL COMMAND INTERFACE
            </div>
            <TacticalMap className="w-full h-full" />
          </div>
        </div>

        {/* RIGHT COLUMN: Comms Dashboard - 1/3 width of available space */}
        <div className="flex-[1] flex flex-col min-h-0 min-w-[320px] max-w-[640px] relative">
          {/* Comms Panel - Full height with proper constraints */}
          <div className="flex-1 border border-zinc-800/50 bg-black/40 overflow-hidden rounded-lg flex flex-col min-h-0">
            <CommsDashboardPanel user={user} eventId={selectedEventId} className="h-full" />
          </div>

          {/* Collapse/Expand Button for Access Panel */}
          <button
            onClick={() => setShowCommsAccessPanel(!showCommsAccessPanel)}
            className="absolute -right-12 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 rounded-r transition-all z-10"
            title={showCommsAccessPanel ? 'Hide access panel' : 'Show access panel'}
          >
            {showCommsAccessPanel ? (
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </button>
        </div>

        {/* FAR RIGHT: Comms Access Panel (Collapsible) */}
        {showCommsAccessPanel && (
          <div className="w-80 border border-zinc-800/50 overflow-hidden shrink-0 flex flex-col min-h-0 rounded-lg animate-in slide-in-from-right-96 duration-300">
            <CommsAccessPanel user={user} />
          </div>
        )}
      </div>
    </div>
  );
}