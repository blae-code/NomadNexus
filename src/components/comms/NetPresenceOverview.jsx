import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Radio, Users, Volume2, Zap, Lock, Flame, Shield, Signal } from 'lucide-react';
import { cn } from '@/lib/utils';
import VoicePresenceIndicator from './VoicePresenceIndicator';
import ConnectionStrengthIndicator from './ConnectionStrengthIndicator';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useLiveKit } from '@/hooks/useLiveKit';
import { AUDIO_STATE } from '@/hooks/useLiveKit';

/**
 * NetPresenceOverview
 * Cutting-edge visualization showing user presence across all voice nets
 * Real-time display of who's in which channel
 *
 * TODO: This component currently only shows participants for the *active* net.
 * For a global view, a backend presence solution is required. This could be a
 * Supabase table updated by a LiveKit agent via webhooks on participant join/leave.
 * The UI would then subscribe to this table for a real-time global presence view.
 */
export default function NetPresenceOverview({ compact = false, onNetSelect, connectionMetrics }) {
  const { remoteAudioTracks, localAudioLevel, audioState, activeNet, room } = useLiveKit();

  // Fetch all active voice nets
  const { data: voiceNets = [] } = useQuery({
    queryKey: ['presence-voice-nets'],
    queryFn: async () => {
      if (!supabase) return [];
      const { data } = await supabase
        .from('voice_nets')
        .select('*')
        .order('priority', { ascending: true });
      return data || [];
    },
    refetchInterval: 3000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => supabase.from('profiles').select('*'),
  });

  const roomParticipants = useMemo(() => {
    if (!activeNet?.code) return {};

    const participants = remoteAudioTracks.map(p => {
      const user = allUsers.find(u => u.id === p.userId);
      return {
        userId: p.participantId,
        callsign: user?.callsign || p.participantName,
        rank: user?.rank,
        role: user?.role,
        isSpeaking: p.isSpeaking,
        isMuted: p.muted,
        audioLevel: p.audioLevel,
        connectionQuality: p.connectionQuality,
      };
    });

    if (room?.localParticipant) {
      const user = allUsers.find(u => u.id === room.localParticipant.identity);
      participants.push({
        userId: room.localParticipant.identity,
        callsign: user?.callsign || room.localParticipant.name,
        rank: user?.rank,
        role: user?.role,
        isSpeaking: audioState === AUDIO_STATE.CONNECTED_OPEN,
        isMuted: audioState === AUDIO_STATE.CONNECTED_MUTED,
        audioLevel: localAudioLevel,
        connectionQuality: connectionMetrics?.quality || 'good',
        isLocal: true,
      });
    }

    return {
      [activeNet.code]: participants,
    };
  }, [remoteAudioTracks, localAudioLevel, audioState, activeNet, room, allUsers, connectionMetrics]);

  const getNetIcon = (type) => {
    switch (type) {
      case 'command': return <Shield className="w-3 h-3" />;
      case 'focused': return <Flame className="w-3 h-3" />;
      case 'campfire': return <Flame className="w-3 h-3" />;
      default: return <Radio className="w-3 h-3" />;
    }
  };

  const getNetColor = (type) => {
    switch (type) {
      case 'command': return 'from-red-950/30 to-red-900/10 border-red-900/50';
      case 'focused': return 'from-red-950/20 to-orange-900/10 border-orange-900/50';
      case 'campfire': return 'from-orange-950/20 to-amber-900/10 border-amber-900/50';
      default: return 'from-emerald-950/20 to-teal-900/10 border-teal-900/50';
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {voiceNets.filter(net => roomParticipants[net.code]?.length > 0).map((net) => {
          const participants = roomParticipants[net.code] || [];
          return (
            <motion.button
              key={net.id}
              onClick={() => onNetSelect?.(net)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ x: 4, transition: { duration: 0.1 } }}
              className={cn(
                "w-full p-2 bg-gradient-to-r border rounded-none group",
                getNetColor(net.type),
                "hover:border-opacity-100 transition-all"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getNetIcon(net.type)}
                  <span className="text-xs font-bold text-white uppercase">{net.code}</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {participants.length}
                  </Badge>
                </div>
                <Volume2 className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  }

  return (
    <Card className="bg-zinc-950/50 border-zinc-900">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-200">
              Voice Net Presence
            </h3>
          </div>
          <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">
            {voiceNets.length} NETS
          </Badge>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            <AnimatePresence>
              {voiceNets.map((net, index) => {
                const participants = roomParticipants[net.code] || [];
                const hasActivity = participants.length > 0;
                const activeSpeakers = participants.filter(p => p.isSpeaking).length;

                return (
                  <motion.div
                    key={net.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      onClick={() => onNetSelect?.(net)}
                      className={cn(
                        "w-full group relative overflow-hidden border transition-all hover:border-opacity-100",
                        getNetColor(net.type),
                        hasActivity ? "border-opacity-80" : "border-opacity-30"
                      )}
                    >
                      {/* Animated background on hover */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.6 }}
                      />

                      <div className="relative p-3 space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "p-1.5 rounded-sm border",
                              hasActivity ? "bg-emerald-900/30 border-emerald-800/50" : "bg-zinc-900/30 border-zinc-800/50"
                            )}>
                              {getNetIcon(net.type)}
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black font-mono text-white uppercase tracking-tight">
                                  {net.code}
                                </span>
                                {net.type === 'focused' && (
                                  <Badge variant="destructive" className="text-[8px] px-1 py-0 h-4">
                                    PTT
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                {net.label}
                              </span>
                            </div>
                          </div>

                          {/* Participant Count */}
                          <div className="flex items-center gap-2">
                            {activeSpeakers > 0 && (
                              <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                                className="flex items-center gap-1 text-emerald-400"
                              >
                                <Volume2 className="w-3 h-3" />
                                <span className="text-[10px] font-bold">{activeSpeakers}</span>
                              </motion.div>
                            )}
                            <div className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-sm border",
                              hasActivity 
                                ? "bg-emerald-950/40 border-emerald-900/50 text-emerald-400" 
                                : "bg-zinc-900/40 border-zinc-800/50 text-zinc-600"
                            )}>
                              <Users className="w-3 h-3" />
                              <span className="text-[10px] font-bold font-mono">
                                {participants.length}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Compact Connection Strength Indicator */}
                        {hasActivity && (
                          <ConnectionStrengthIndicator
                            quality={connectionMetrics?.quality || (hasActivity ? 'good' : 'fair')}
                            latency={connectionMetrics?.latencyMs ?? 0}
                            jitter={connectionMetrics?.jitter ?? 0}
                            packetLoss={connectionMetrics?.packetLoss ?? 0}
                            size="sm"
                            showMetrics={false}
                          />
                        )}

                        {/* Participants Grid */}
                        {participants.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="pt-2 border-t border-zinc-800/50"
                          >
                            <div className="flex flex-wrap gap-2">
                              {participants.map((participant) => (
                                <VoicePresenceIndicator
                                  key={participant.userId}
                                  user={participant}
                                  isSpeaking={participant.isSpeaking}
                                  isMuted={participant.isMuted}
                                  audioLevel={participant.audioLevel}
                                  size="sm"
                                  showDetails={false}
                                  className="group-hover:scale-105 transition-transform"
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {/* Empty State */}
                        {participants.length === 0 && (
                          <div className="text-center py-2 text-[10px] text-zinc-600 uppercase tracking-wider">
                            No active participants
                          </div>
                        )}
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Summary Bar */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[10px] uppercase tracking-wider">
          <span className="text-zinc-600">Total Active</span>
          <span className="text-emerald-400 font-bold font-mono">
            {Object.values(roomParticipants).flat().length} USERS
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
