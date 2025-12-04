import React from 'react';
import { Volume2, VolumeX, Headphones, GitBranch } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useLiveKit } from '@/hooks/useLiveKit';
import { cn } from '@/lib/utils';

const VerticalSlider = ({ value, onChange }) => (
  <div className="h-32 flex items-center justify-center rotate-[-90deg]">
    <Slider
      value={[value]}
      min={0}
      max={1}
      step={0.05}
      className="w-32"
      onValueChange={(vals) => onChange(vals[0])}
    />
  </div>
);

export default function CommsMixer() {
  const { remoteAudioTracks, updateTrackMix, toggleSoloTrack, soloTrack, prioritySpeaker } = useLiveKit();

  if (!remoteAudioTracks || remoteAudioTracks.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-xs uppercase tracking-[0.18em] text-zinc-500 border border-slate-800 bg-black/40">
        Awaiting incoming audio tracks...
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-3 pb-2">
        {remoteAudioTracks.map((track) => {
          const isSoloed = soloTrack === track.sid;
          const isPriority = prioritySpeaker && prioritySpeaker.participantId === track.participantId;
          return (
            <div
              key={track.sid}
              className={cn(
                'flex min-w-[120px] flex-col items-center gap-2 rounded-md border border-slate-800 bg-slate-900/60 p-3',
                isSoloed ? 'ring-2 ring-burnt-orange/60' : '',
                isPriority ? 'shadow-[0_0_12px_rgba(16,185,129,0.35)]' : ''
              )}
            >
              <div className="text-[11px] font-mono uppercase text-center leading-tight text-slate-200 truncate w-full">
                {track.participantName}
              </div>
              <div className="text-[10px] text-slate-500 truncate w-full text-center">{track.publicationName}</div>
              <VerticalSlider
                value={track.volume ?? 1}
                onChange={(value) => updateTrackMix(track.sid, { volume: value })}
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-8 w-8', track.muted ? 'text-red-400' : 'text-slate-300')}
                  onClick={() => updateTrackMix(track.sid, { muted: !track.muted })}
                >
                  {track.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant={isSoloed ? 'primary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => toggleSoloTrack(track.sid)}
                >
                  <Headphones className="h-4 w-4" />
                </Button>
              </div>
              <div className="w-full">
                <div className="text-[10px] uppercase text-slate-500">Pan</div>
                <Slider
                  value={[track.pan ?? 0]}
                  min={-1}
                  max={1}
                  step={0.1}
                  onValueChange={(vals) => updateTrackMix(track.sid, { pan: vals[0] })}
                />
              </div>
              {isPriority && (
                <div className="flex items-center gap-1 text-[10px] uppercase text-emerald-400">
                  <GitBranch className="h-3 w-3" /> Priority
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
