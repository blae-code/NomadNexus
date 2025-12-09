import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RoomEvent } from "livekit-client";
import { motion, AnimatePresence } from "framer-motion";
import { supabaseApi } from "@/lib/supabaseApi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, Radio, Shield, Activity, Users, RadioReceiver, ScrollText, Lock, Ear, Signal } from "lucide-react";
import { hasMinRank } from "@/components/permissions";
import { cn } from "@/lib/utils";
import { getRankColorClass } from "@/components/utils/rankUtils";
import { TerminalCard, SignalStrength, PermissionBadge, NetTypeIcon } from "@/components/comms/SharedCommsComponents";
import StatusChip from "@/components/status/StatusChip";
import AudioVisualizer from '@/components/comms/AudioVisualizer';
import RosterItem from './RosterItem';
import VoicePresenceIndicator from './VoicePresenceIndicator';
import ConnectionStrengthIndicator from './ConnectionStrengthIndicator';
import { useLiveKit, AUDIO_STATE } from '@/hooks/useLiveKit';
import { usePTT } from '@/hooks/usePTT';
import CommsErrorBoundary from './CommsErrorBoundary';

function CommsLog({ eventId }) {
  const { data: messages } = useQuery({
    queryKey: ['comms-messages', eventId],
    queryFn: () => supabaseApi.entities.Message.list({
      sort: { created_at: -1 },
      limit: 50
    }),
    refetchInterval: 5000
  });

  const logs = React.useMemo(() => {
    if (!messages) return [];
    return messages
      .filter(m => m.content.includes('[COMMS LOG]'))
      .slice(0, 6);
  }, [messages]);

  return (
    <div className="space-y-3 pt-4 border-t border-zinc-800">
      <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider pb-2">
         <ScrollText className="w-3 h-3" />
         Signal Log (Recent)
      </div>
      <div className="space-y-2">
         {logs.length === 0 ? (
            <div className="text-[10px] text-zinc-500 italic pl-2">No recent traffic recorded.</div>
         ) : (
              logs.map(log => (
                 <div key={log.id} className="text-[10px] font-mono text-zinc-400 pl-2 border-l border-zinc-800">
                  <span className="text-emerald-700 opacity-70 mr-2">
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : '--:--:--'}
                  </span>
                  <span className="text-zinc-300">{log.content.replace(/\[COMMS LOG\]|Tx on|: \*\*SIMULATED TRANSMISSION\*\*/g, '').trim()}</span>
               </div>
            ))
         )}
      </div>
    </div>
  );
}

function NetRoster({ net, eventId, onHail, prioritySpeakerId, whisperTargetId, room, riggsyLinked }) {
  const { audioState, enforceParticipantMute, remoteAudioTracks, localAudioLevel } = useLiveKit();
  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => supabaseApi.entities.User.list(),
    initialData: []
  });
  
  const [currentUser, setCurrentUser] = React.useState(null);
  React.useEffect(() => {
    supabaseApi.auth.me().then(setCurrentUser).catch(() => {});
  }, []);
  const myId = currentUser?.id;

  const { data: statuses } = useQuery({
    queryKey: ['net-roster-statuses', eventId],
    queryFn: () => supabaseApi.entities.PlayerStatus.list({ event_id: eventId }),
    enabled: !!eventId,
    refetchInterval: 3000,
    initialData: []
  });

  const { data: squadMembers } = useQuery({
    queryKey: ['squad-members', net.linked_squad_id],
    queryFn: () => net.linked_squad_id ? supabaseApi.entities.SquadMember.list({ squad_id: net.linked_squad_id }) : [],
    enabled: !!net.linked_squad_id,
    initialData: []
  });

  // Filter users relevant to this net
  const [lkParticipants, setLkParticipants] = useState([]);

  useEffect(() => {
    if (!room) {
      setLkParticipants([]);
      return;
    }
    const update = () => {
      const remotes = Array.from(room.participants?.values?.() || []);
      const locals = room.localParticipant ? [room.localParticipant] : [];
      setLkParticipants([...locals, ...remotes]);
    };
    update();
    room.on(RoomEvent.ParticipantConnected, update);
    room.on(RoomEvent.ParticipantDisconnected, update);
    room.on(RoomEvent.ParticipantMetadataChanged, update);
    room.on(RoomEvent.TrackMuted, update);
    room.on(RoomEvent.TrackUnmuted, update);
    room.on(RoomEvent.ConnectionQualityChanged, update);

    return () => {
      room.off(RoomEvent.ParticipantConnected, update);
      room.off(RoomEvent.ParticipantDisconnected, update);
      room.off(RoomEvent.ParticipantMetadataChanged, update);
      room.off(RoomEvent.TrackMuted, update);
      room.off(RoomEvent.TrackUnmuted, update);
      room.off(RoomEvent.ConnectionQualityChanged, update);
    };
  }, [room]);

  const participants = React.useMemo(() => {
    if (!net) return [];

    const memberIds = net.linked_squad_id ? squadMembers.map((m) => m.user_id) : null;

    const filtered = lkParticipants.filter((p) => {
      const meta = p.metadata ? JSON.parse(p.metadata) : {};
      const userId = meta.userId || p.identity;
      if (net.linked_squad_id && memberIds) return memberIds.includes(userId);
      if (net.type === 'command') {
        const user = allUsers.find((u) => u.id === userId);
        return user ? hasMinRank(user, net.min_rank_to_tx) : true;
      }
      return true;
    });

    let decorated = filtered.map((p) => {
      const meta = p.metadata ? JSON.parse(p.metadata) : {};
      const userId = meta.userId || p.identity;
      const user = allUsers.find((u) => u.id === userId);
      const status = statuses.find((s) => s.user_id === userId);
      const qualityMap = {
        [ConnectionQuality.Excellent]: 'excellent',
        [ConnectionQuality.Good]: 'good',
        [ConnectionQuality.Poor]: 'poor',
        [ConnectionQuality.Lost]: 'offline',
        [ConnectionQuality.Unknown]: 'fair',
      };
      
      const remoteTrack = remoteAudioTracks.find(t => t.participantId === p.identity);

      return {
        id: userId,
        callsign: user?.callsign || p.name || meta.callsign,
        rsi_handle: user?.rsi_handle,
        full_name: user?.full_name,
        rank: meta.rank || user?.rank,
        role: status?.role || meta.role || user?.role || "OTHER",
        status: status?.status || 'READY',
        isSpeaking: p.isLocal ? audioState === AUDIO_STATE.CONNECTED_OPEN : (remoteTrack?.isSpeaking || p.isSpeaking),
        audioLevel: p.isLocal ? localAudioLevel : (remoteTrack?.audioLevel || (p.isSpeaking ? 0.7 : 0)),
        isMuted: p.isLocal ? audioState === AUDIO_STATE.CONNECTED_MUTED : (typeof p.isMicrophoneEnabled === 'boolean' ? !p.isMicrophoneEnabled : false),
        isLocal: p.isLocal,
        connectionQuality: qualityMap[p.connectionQuality] || 'fair',
      };
    });
    
    if (riggsyLinked) {
      decorated.push({
        id: 'riggsy-agent',
        callsign: 'RIGGSY',
        rank: 'SYSTEM',
        role: 'Automation',
        status: 'READY',
        isSpeaking: false,
        audioLevel: 0,
        isMuted: true,
        isLocal: false,
        connectionQuality: 'excellent',
      });
    }

    return decorated.sort((a, b) => {
      const priority = { DISTRESS: 0, DOWN: 1, ENGAGED: 2, READY: 3, OFFLINE: 4 };
      return (priority[a.status] || 99) - (priority[b.status] || 99);
    });
  }, [net, lkParticipants, squadMembers, allUsers, statuses, remoteAudioTracks, audioState, localAudioLevel, riggsyLinked]);

  useEffect(() => {
    statuses.forEach((s) => {
      if (['DOWN', 'UNCONSCIOUS'].includes(s.status)) {
        enforceParticipantMute(s.user_id, true);
      } else {
        enforceParticipantMute(s.user_id, false);
      }
    });
  }, [statuses, enforceParticipantMute]);

  return (
    <div className="space-y-4">
      {/* Enhanced Header with Live Stats and Connection Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-zinc-950/80 to-zinc-900/40 border border-zinc-800/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"
            />
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-300">
                <Users className="w-4 h-4" />
                <span className="font-bold">Active Personnel</span>
              </div>
              <div className="text-[10px] text-zinc-600 font-mono">
                {participants.filter(p => p.isSpeaking).length} speaking · {participants.filter(p => !p.isMuted).length} hot mic
              </div>
            </div>
          </div>
          <Badge className="bg-emerald-950/50 text-emerald-400 border-emerald-900/50 font-mono">
            {participants.length}
          </Badge>
        </div>

        {/* Connection Strength Indicator */}
        <ConnectionStrengthIndicator
          quality={connectionMetrics?.quality || (connectionState === 'connected' ? 'excellent' : 'offline')}
          latency={connectionMetrics?.latencyMs ?? 0}
          jitter={connectionMetrics?.jitter ?? 0}
          packetLoss={connectionMetrics?.packetLoss ?? 0}
          bandwidth={{ inKbps: connectionMetrics?.bandwidth?.inKbps ?? 0, outKbps: connectionMetrics?.bandwidth?.outKbps ?? 0 }}
          size="md"
          showMetrics={true}
        />
      </div>

      {participants.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8 border border-dashed border-zinc-800/50 bg-zinc-950/30 backdrop-blur-sm"
        >
          <Users className="w-8 h-8 mx-auto mb-3 opacity-20 text-zinc-600" />
          <p className="font-mono uppercase tracking-wider text-xs text-zinc-600">
            {net.type === 'general' ? "Open Frequency" : "No active carrier signal detected"}
          </p>
          <p className="text-[10px] text-zinc-700 mt-1">Awaiting connection...</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {participants.map((participant, index) => {
             const isCurrentUser = participant.isLocal;
             const isPriority = prioritySpeakerId && prioritySpeakerId === participant.id;
             const isSpeaking = participant.isSpeaking;
             const audioLevel = participant.audioLevel;

             return (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "relative group overflow-hidden border backdrop-blur-sm transition-all",
                  isSpeaking 
                    ? "border-emerald-500/50 bg-gradient-to-r from-emerald-950/30 to-zinc-900/30 shadow-lg shadow-emerald-500/10" 
                    : "border-zinc-800/50 bg-gradient-to-r from-zinc-950/50 to-zinc-900/30 hover:border-zinc-700/50",
                  participant.connectionQuality === 'poor' && "border-orange-500/60",
                  participant.connectionQuality === 'offline' && "border-red-500/70 bg-red-950/20"
                )}
              >
                <AnimatePresence>
                  {isSpeaking && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: [0.05, 0.1, 0.05],
                        x: ['-100%', '100%']
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ 
                        opacity: { duration: 1, repeat: Infinity },
                        x: { duration: 2, repeat: Infinity, ease: 'linear' }
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent"
                    />
                  )}
                </AnimatePresence>

                <div className="relative p-3 flex items-center gap-3">
                  <VoicePresenceIndicator
                    user={participant}
                    isSpeaking={isSpeaking}
                    isMuted={participant.isMuted}
                    audioLevel={audioLevel}
                    connectionQuality={participant.connectionQuality || 'fair'}
                    isPriority={isPriority}
                    isWhisperTarget={whisperTargetId === participant.id}
                    size="md"
                    showDetails={false}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "font-bold truncate text-sm",
                        isSpeaking ? "text-emerald-300" : "text-zinc-200"
                      )}>
                        {participant.callsign || participant.name || 'Unknown'}
                      </span>
                      {isCurrentUser && audioState === AUDIO_STATE.CONNECTED_OPEN && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 border-amber-800/50 text-amber-400">
                          PTT
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] uppercase tracking-wider font-mono",
                        getRankColorClass(participant.rank)
                      )}>
                        {participant.rank || 'vagrant'}
                      </span>
                      {participant.role && (
                        <>
                          <span className="text-[9px] text-zinc-600">·</span>
                          <span className="text-[9px] text-zinc-500 uppercase">
                            {participant.role}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {isSpeaking && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-end gap-0.5 h-6"
                    >
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            height: audioLevel > (i * 0.2) ? `${20 + (audioLevel * 60)}%` : '20%',
                            backgroundColor: audioLevel > (i * 0.2) ? '#10b981' : '#3f3f46'
                          }}
                          transition={{ duration: 0.1 }}
                          className="w-1 rounded-full"
                        />
                      ))}
                    </motion.div>
                  )}

                  {onHail && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onHail(participant)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2 text-[10px] uppercase tracking-wider"
                    >
                      Hail
                    </Button>
                  )}
                </div>
              </motion.div>
           )})}
        </div>
      )}
    </div>
  );
}

export default function ActiveNetPanel({ net, user, eventId, room, connectionState, audioState, connectionMetrics, compact = false }) {

  // LiveKit props now passed in
  const {
    connect,
    disconnect,
    lastMuteAll,
    muteAcked,
    publishAck,
    setRole,
    roleProfile,
    publishWhisper,
    stopWhisper,
    prioritySpeaker,
    broadcastMode,
    setBroadcast,
  } = useLiveKit();

  // Integrate Push-To-Talk
  const { isPTTActive, setPTTActive } = usePTT({
    onPTTChange: (active) => {
      if (room?.localParticipant) {
        room.localParticipant.setMicrophoneEnabled(active);
      }
    }
  });
  const [whisperTarget, setWhisperTarget] = React.useState(null);
  const [riggsyLinked, setRiggsyLinked] = useState(false); // Mock state for Riggsy presence

  // --- Status Message Banner Logic ---
  let panelStatusMsg = null;
  if (!net) {
    panelStatusMsg = (
      <div className="w-full text-center py-2 bg-zinc-900 text-zinc-400 text-xs font-mono border-b border-zinc-800">
        No frequency selected. Please select a net.
      </div>
    );
  } else if (connectionState === 'disconnected') {
    panelStatusMsg = (
      <div className="w-full text-center py-2 bg-red-900/80 text-red-200 text-xs font-mono border-b border-red-800">
        Disconnected from net.
      </div>
    );
  } else if (audioState === AUDIO_STATE.CONNECTING) {
    panelStatusMsg = (
      <div className="w-full text-center py-2 bg-yellow-900/80 text-yellow-200 text-xs font-mono border-b border-yellow-800">
        Connecting to net...
      </div>
    );
  } else if (audioState === AUDIO_STATE.CONNECTED_OPEN) {
    panelStatusMsg = (
      <div className="w-full text-center py-2 bg-emerald-900/80 text-emerald-200 text-xs font-mono border-b border-emerald-800">
        Transmitting (PTT Open)
      </div>
    );
  } else if (audioState === AUDIO_STATE.CONNECTED) {
    panelStatusMsg = (
      <div className="w-full text-center py-2 bg-zinc-900/80 text-zinc-200 text-xs font-mono border-b border-zinc-800">
        Connected to net.
      </div>
    );
  }

  useEffect(() => {
    if (!net || !user) return undefined;
    const role = user.rank || user.roles?.[0] || 'Vagrant';
    setRole(role);
    connect({
      roomName: net.code,
      participantName: user.callsign || user.rsi_handle || user.full_name || 'Unknown',
      role,
      userId: user.id,
    });
    // For scaffolding, let's assume riggsy is linked when connected to a net
    setRiggsyLinked(true); 
    return () => {
      disconnect();
      setRiggsyLinked(false);
    }
  }, [net?.code, user?.id]);

  const handleWhisper = (targetUser) => {
    if (whisperTarget?.id === targetUser.id) {
      setWhisperTarget(null);
      stopWhisper();
    } else {
      setWhisperTarget(targetUser);
      publishWhisper(targetUser.id);
    }
  };

  const canTx = React.useMemo(() => {
    if (!user || !net) return false;
    return hasMinRank(user, net.min_rank_to_tx);
  }, [user, net]);

    if (!net) {
      return (
        <CommsErrorBoundary>
          <div className="h-full flex flex-col items-center justify-center text-zinc-700 border-2 border-dashed border-zinc-900 rounded-lg bg-zinc-950/50 p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(63,63,70,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] opacity-10" />
            <Radio className="w-16 h-16 mb-6 opacity-20" />
            <p className="uppercase tracking-[0.3em] text-sm font-bold">No Frequency Selected</p>
            <p className="text-xs mt-2 text-zinc-600 font-mono">AWAITING INPUT //</p>
          </div>
        </CommsErrorBoundary>
      );
    }

  const isTransmitting = audioState === AUDIO_STATE.CONNECTED_OPEN;

  return (
    <CommsErrorBoundary>
      <div className="h-full flex flex-col gap-6">
        {/* Status Message Banner */}
        {panelStatusMsg}

        {/* Header Card - Hide in compact mode as controls are in VoiceCommandPanel */}
        {!compact && (
          <TerminalCard className="relative overflow-hidden" active={isTransmitting}>
          {isTransmitting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.05 }}
              className={cn(
                "absolute inset-0 pointer-events-none",
                whisperTarget ? "bg-amber-500" : "bg-emerald-500"
              )}
            />
          )}

          <div className="p-6 pt-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-4">
                  <h2 className={cn(
                    "text-4xl font-black font-mono tracking-tighter leading-none transition-colors duration-150",
                    isTransmitting ? "text-red-500" : "text-white"
                  )}>
                    {net.code}
                  </h2>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <NetTypeIcon type={net.type} />
                  <p className="text-zinc-400 uppercase tracking-widest text-xs font-bold">{net.label}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                {whisperTarget && (
                  <Badge className="bg-amber-950/50 text-amber-500 border-amber-900 animate-pulse">
                    WHISPER TARGET LOCKED
                  </Badge>
                )}
                <PermissionBadge canTx={canTx} minRankTx={net.min_rank_to_tx} minRankRx={net.min_rank_to_rx} />
                <Button
                  size="sm"
                  variant={broadcastMode ? "destructive" : "outline"}
                  className="text-[11px] uppercase tracking-widest"
                  onClick={() => setBroadcast(!broadcastMode)}
                >
                  {broadcastMode ? "Broadcast Active" : "Broadcast Mode"}
                </Button>
                <div className="text-[10px] text-zinc-600 font-mono tracking-widest">ID: {net.id.slice(0, 8).toUpperCase()}</div>
              </div>
            </div>

            {/* PTT Control */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-800">
              <Button
                onMouseDown={() => setPTTActive(true)}
                onMouseUp={() => setPTTActive(false)}
                onTouchStart={() => setPTTActive(true)}
                onTouchEnd={() => setPTTActive(false)}
                className={isPTTActive ? "bg-red-500 text-white" : "bg-zinc-800 text-amber-300"}
              >
                {isPTTActive ? "TRANSMITTING" : "PUSH-TO-TALK"}
              </Button>
              <span className="text-xs text-zinc-400 ml-2">
                Room: {net.code} | State: {connectionState?.toUpperCase()}
              </span>
            </div>
          </div>
        </TerminalCard>
        )}

        {/* Compact Header for compact mode */}
        {compact && (
          <div className="px-3 py-2 bg-zinc-950/50 border-b border-zinc-800/50 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <NetTypeIcon type={net.type} />
                <div>
                  <div className="text-sm font-black font-mono text-white">{net.code}</div>
                  <div className="text-[9px] text-zinc-500 uppercase tracking-wider">{net.label}</div>
                </div>
              </div>
              {whisperTarget && (
                <Badge className="bg-amber-950/50 text-amber-500 border-amber-900 text-[9px]">
                  WHISPER
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Roster & Logs */}
        <TerminalCard className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4">
            <NetRoster
              net={net}
              eventId={eventId}
              prioritySpeakerId={prioritySpeaker?.participantId}
              whisperTargetId={whisperTarget?.id}
              onHail={handleWhisper}
              room={room}
              riggsyLinked={riggsyLinked}
            />
            <CommsLog eventId={eventId} />
          </ScrollArea>
          <div className="py-1 px-2 bg-zinc-950 border-t border-zinc-900">
            <div className="w-full flex justify-between text-[9px] text-zinc-500 font-mono items-center">
              <span className={connectionState === 'connected' ? "text-emerald-500" : "text-zinc-500"}>
                STATUS: {connectionState === 'connected' ? "CONNECTED (SECURE)" : connectionState.toUpperCase()}
              </span>
              <div className="flex items-center gap-3">
                {lastMuteAll && (
                  <button
                    className="px-2 py-0.5 border border-red-800 text-red-400 bg-red-900/30 hover:bg-red-900/60 disabled:opacity-50"
                    disabled={muteAcked || !(roleProfile && ['Pioneer', 'Command'].includes(roleProfile))}
                    onClick={() => publishAck({ type: 'MUTE_ACK', ts: Date.now() })}
                  >
                    {muteAcked ? 'PRIORITY OVERRIDE // ACKNOWLEDGED' : 'PRIORITY OVERRIDE // MUTE ALL — ACK TO CLEAR'}
                  </button>
                )}
                <span>ENCRYPTION: {connectionState === 'connected' ? "AES-256" : "NONE"}</span>
              </div>
            </div>
          </div>
        </TerminalCard>
      </div>
    </CommsErrorBoundary>
  );
}
