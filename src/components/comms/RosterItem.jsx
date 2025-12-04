import React from 'react';
import { Mic, MicOff, Ear } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import StatusChip from '@/components/status/StatusChip';
import { getRankColorClass } from '@/components/utils/rankUtils';
import RankBadge from './RankBadge';

const RosterItem = ({ participant, isSpeaking, isMuted, isPtt, onHail, isWhisperTarget }) => {
  const speakingStyle = isSpeaking ? 'bg-green-900/30 animate-pulse' : '';
  const whisperStyle = isWhisperTarget ? 'border border-amber-600/50 bg-amber-900/10' : '';

  return (
    <div className={cn("flex items-center justify-between p-2", speakingStyle, whisperStyle)}>
      <div className="flex items-center gap-3">
        <div>
          {isMuted ? (
            <MicOff className="w-4 h-4 text-zinc-600" />
          ) : isPtt ? (
            <Mic className="w-4 h-4 text-burnt-orange" />
          ) : (
            <Mic className="w-4 h-4 text-zinc-400" />
          )}
        </div>
        <div className="truncate">
          <div className="flex items-center gap-2 text-sm text-tech-white font-bold truncate">
            <RankBadge rank={participant.rank} />
            {participant.callsign || participant.rsi_handle || participant.full_name}
          </div>
          <div className={cn("text-[11px] uppercase font-mono", getRankColorClass(participant.rank, 'text'))}>
            {participant.rank || 'VAGRANT'}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono truncate">
            {participant.role || 'UNASSIGNED'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusChip status={participant.status} size="xs" showLabel={false} />
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6 hover:bg-zinc-800 text-zinc-500 hover:text-tech-white",
            isWhisperTarget ? "text-amber-400" : ""
          )}
          onClick={onHail}
          title={`Hail ${participant.callsign || participant.full_name}`}
        >
          <Ear className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default RosterItem;
