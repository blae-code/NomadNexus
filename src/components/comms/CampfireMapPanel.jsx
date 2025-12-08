import React, { useMemo, useState } from 'react';
import CampfireNode from './CampfireNode';
import { Button } from '@/components/ui/button';
import { useLiveKit } from '@/hooks/useLiveKit';
import { hasMinRank } from '@/components/permissions';

/**
 * CampfireMapPanel: Interactive map-style campfire (channel) visualization for the right column.
 * - Shows all campfires (active/inactive) as draggable nodes in a neural-network style layout.
 * - Users of Scout+ rank can light (create) new campfires if an unlit one is available.
 * - Users can drag their "signal" to join a campfire.
 * - Dousing the flame closes a campfire (if permitted).
 */
export default function CampfireMapPanel({
  campfires = [],
  user = {},
  onLightCampfire,
  onDouseCampfire,
  onJoinCampfire,
  currentCampfireId,
  isLoading,
}) {
  // Determine if user can create/douse campfires
  const canCreate = hasMinRank(user, 'scout');


  // Always show at least one unlit campfire
  const hasUnlit = campfires.some(c => !c.id || c.participantCount === 0);
  const campfireList = useMemo(() => {
    if (hasUnlit) return campfires;
    // Add a dummy unlit campfire
    return [
      ...campfires,
      {
        id: undefined,
        name: 'Unlit Campfire',
        participantCount: 0,
        locked: false,
        isLFG: false,
        audioMode: 'VOX',
        isPrioritySpeakerActive: false,
        softCap: 10,
      },
    ];
  }, [campfires, hasUnlit]);

  // Neural-style layout: arrange nodes in a force-directed or spiral pattern
  const nodePositions = useMemo(() => {
    const centerX = 220, centerY = 140, radius = 110;
    const n = campfireList.length;
    return campfireList.map((c, i) => {
      const angle = (2 * Math.PI * i) / Math.max(1, n);
      return {
        ...c,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
  }, [campfireList]);

  // Error state for user feedback
  const [error, setError] = useState("");

  return (
    <div className="relative w-full h-[320px] bg-gradient-to-br from-black via-zinc-900 to-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
      {/* SVG neural net lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {nodePositions.map((a, i) =>
          nodePositions.map((b, j) =>
            i !== j && a.participantCount > 0 && b.participantCount > 0 ? (
              <line
                key={`line-${i}-${j}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#ea580c22"
                strokeWidth={1 + Math.random() * 1.5}
                opacity={0.18}
              />
            ) : null
          )
        )}
      </svg>
      {/* Campfire nodes */}
      {nodePositions.map((campfire, idx) => (
        <div
          key={campfire.id || `unlit-${idx}`}
          className="absolute"
          style={{ left: campfire.x, top: campfire.y, zIndex: campfire.id === currentCampfireId ? 10 : 1 }}
        >
          <CampfireNode
            name={campfire.name || 'Unlit Campfire'}
            participantCount={campfire.participantCount || 0}
            isLocked={campfire.locked}
            isLFG={campfire.isLFG}
            audioMode={campfire.audioMode}
            isPrioritySpeakerActive={campfire.isPrioritySpeakerActive}
            softCap={campfire.softCap}
            isSpeaking={campfire.id === currentCampfireId}
          />
          <div className="flex flex-col items-center mt-1 gap-1">
            {campfire.participantCount === 0 && (
              canCreate ? (
                <Button size="xs" variant="ghost" className="text-emerald-400 border border-emerald-700 px-2 py-0.5 text-[10px]" onClick={async () => {
                  setError("");
                  try {
                    await onLightCampfire?.(campfire);
                  } catch (e) {
                    setError(e?.message || "Failed to light campfire.");
                  }
                }}>
                  Light Campfire
                </Button>
              ) : (
                <Button size="xs" variant="outline" className="px-2 py-0.5 text-[10px]" onClick={async () => {
                  setError("");
                  try {
                    await onJoinCampfire?.(campfire);
                  } catch (e) {
                    setError(e?.message || "Failed to join campfire.");
                  }
                }}>
                  Join
                </Button>
              )
            )}
            {campfire.participantCount > 0 && canCreate && campfire.id && (
              <Button size="xs" variant="destructive" className="px-2 py-0.5 text-[10px]" onClick={async () => {
                setError("");
                try {
                  await onDouseCampfire?.(campfire);
                } catch (e) {
                  setError(e?.message || "Failed to douse campfire.");
                }
              }}>
                Douse Flame
              </Button>
            )}
            {campfire.participantCount > 0 && campfire.id !== currentCampfireId && campfire.id && (
              <Button size="xs" variant="outline" className="px-2 py-0.5 text-[10px]" onClick={async () => {
                setError("");
                try {
                  await onJoinCampfire?.(campfire);
                } catch (e) {
                  setError(e?.message || "Failed to join campfire.");
                }
              }}>
                Join
              </Button>
            )}
          </div>
        </div>
      ))}
      {/* Drag-and-drop signal indicator (future: animated drag) */}
      {/* ...future: user can drag their avatar/signal to a campfire to join... */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
          <span className="text-xs text-zinc-400 animate-pulse">Loading Campfires...</span>
        </div>
      )}
      {error && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-red-900 text-red-200 text-xs px-3 py-1 rounded shadow-lg z-30 animate-in fade-in">
          {error}
        </div>
      )}
    </div>
  );
}
