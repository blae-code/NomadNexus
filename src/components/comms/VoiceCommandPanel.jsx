import React, { useState } from 'react';
import { useLiveKit, AUDIO_STATE } from '@/hooks/useLiveKit';
import { usePTT } from '@/hooks/usePTT';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ConnectionStrengthIndicator from '@/components/comms/ConnectionStrengthIndicator';
import { 
  Mic, 
  MicOff, 
  Radio, 
  Flame, 
  Shield, 
  Volume2, 
  VolumeX,
  Headphones,
  MessageSquare,
  AlertTriangle,
  Zap,
  Users,
  Signal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { hasMinRank } from '@/components/permissions';

/**
 * VoiceCommandPanel
 * Consolidated voice comms control panel with all LiveKit features
 * Adapts UI based on user rank/permissions
 */
export default function VoiceCommandPanel({ user, net, compact = false }) {
  const {
    audioState,
    connectionState,
    connectionMetrics,
    room,
    setMicrophoneEnabled,
    publishFlare,
    publishMuteAll,
    broadcastMode,
    setBroadcast,
    currentWhisperTarget,
    publishWhisper,
    stopWhisper,
    prioritySpeaker,
    devices,
  } = useLiveKit();

  const { isPTTActive, setPTTActive } = usePTT();
  const [whisperMode, setWhisperMode] = useState(false);

  // Permission checks
  const canTransmit = user && net && hasMinRank(user, net.min_rank_to_tx || 'scout');
  const canFlare = user && hasMinRank(user, 'scout');
  const canMuteAll = user && hasMinRank(user, 'founder');
  const canBroadcast = user && hasMinRank(user, 'voyager');
  const canWhisper = user && hasMinRank(user, 'scout');

  // Connection status
  const isConnected = connectionState === 'connected';
  const isTransmitting = audioState === AUDIO_STATE.CONNECTED_OPEN || isPTTActive;
  const isMuted = audioState === AUDIO_STATE.CONNECTED_MUTED;

  // Status color for UI
  const statusColor = isTransmitting 
    ? 'text-emerald-500 border-emerald-500/50' 
    : isMuted 
      ? 'text-zinc-600 border-zinc-800' 
      : 'text-amber-500 border-amber-500/50';

  const handleFlare = (variant) => {
    if (!canFlare || !isConnected) return;
    const location = net?.code || 'UNKNOWN';
    publishFlare(variant, location);
  };

  const handleMuteAll = () => {
    if (!canMuteAll || !isConnected) return;
    publishMuteAll();
  };

  const handleBroadcast = () => {
    if (!canBroadcast || !isConnected) return;
    setBroadcast(!broadcastMode);
  };

  const handleWhisper = () => {
    if (!canWhisper || !isConnected) return;
    setWhisperMode(!whisperMode);
    // Note: Actual whisper target selection happens in roster
    if (whisperMode && currentWhisperTarget) {
      stopWhisper();
    }
  };

  if (compact) {
    // Get connection quality from room stats
    const getConnectionQuality = () => {
      if (!isConnected) return 'offline';
      return connectionMetrics?.quality || 'good';
    };

    return (
      <div className="space-y-2 p-2 bg-zinc-950/80 border border-zinc-900/50">
        {/* Connection Strength Indicator */}
        <ConnectionStrengthIndicator
          quality={getConnectionQuality()}
          latency={connectionMetrics?.latencyMs ?? 0}
          jitter={connectionMetrics?.jitter ?? 0}
          packetLoss={connectionMetrics?.packetLoss ?? 0}
          size="sm"
          showMetrics={false}
        />

        {/* Controls */}
        <div className="flex items-center justify-between gap-2">
          {/* PTT Button */}
          <Button
            size="sm"
            disabled={!canTransmit || !isConnected}
            onMouseDown={() => setPTTActive(true)}
            onMouseUp={() => setPTTActive(false)}
            onTouchStart={() => setPTTActive(true)}
            onTouchEnd={() => setPTTActive(false)}
            className={cn(
              "flex-1 font-mono text-[10px] uppercase tracking-widest transition-all",
              isTransmitting 
                ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/50" 
                : "bg-zinc-900 border-zinc-800 text-amber-500 hover:bg-zinc-800"
            )}
          >
            <Radio className="w-3 h-3 mr-1" />
            {isTransmitting ? 'TX' : 'PTT'}
          </Button>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            {canFlare && (
              <Button
                size="sm"
                variant="ghost"
                disabled={!isConnected}
                onClick={() => handleFlare('COMBAT')}
                className="w-8 h-8 p-0 text-orange-500 hover:text-orange-400 hover:bg-orange-950/30"
                title="Combat Flare"
              >
                <Shield className="w-4 h-4" />
              </Button>
            )}
            {canBroadcast && (
              <Button
                size="sm"
                variant="ghost"
                disabled={!isConnected}
                onClick={handleBroadcast}
                className={cn(
                  "w-8 h-8 p-0",
                  broadcastMode 
                    ? "text-emerald-500 bg-emerald-950/30" 
                    : "text-zinc-600 hover:text-zinc-400"
                )}
                title="Broadcast Mode"
              >
                <Zap className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full Panel View
  return (
    <div className="flex flex-col gap-4 p-4 bg-zinc-950/50 border border-zinc-900">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full transition-all", 
            isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
          )} />
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            {isConnected ? 'NET ACTIVE' : 'DISCONNECTED'}
          </span>
        </div>
        
        {prioritySpeaker && (
          <Badge variant="outline" className="bg-amber-950/30 text-amber-500 border-amber-900 text-[9px]">
            PRIORITY SPEAKER ACTIVE
          </Badge>
        )}
      </div>

      <Separator className="bg-zinc-900" />

      {/* Primary PTT Control */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase text-zinc-600 font-bold tracking-wider">Transmit Control</div>
        <Button
          size="lg"
          disabled={!canTransmit || !isConnected}
          onMouseDown={() => setPTTActive(true)}
          onMouseUp={() => setPTTActive(false)}
          onTouchStart={() => setPTTActive(true)}
          onTouchEnd={() => setPTTActive(false)}
          className={cn(
            "w-full h-16 font-mono text-sm uppercase tracking-widest transition-all relative overflow-hidden",
            isTransmitting 
              ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
              : "bg-zinc-900 border-2 border-zinc-800 text-amber-500 hover:bg-zinc-800 hover:border-amber-900"
          )}
        >
          {isTransmitting && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          )}
          <div className="relative z-10 flex items-center justify-center gap-2">
            {isTransmitting ? <Mic className="w-5 h-5" /> : <Radio className="w-5 h-5" />}
            <span>{isTransmitting ? 'TRANSMITTING' : 'PUSH TO TALK'}</span>
          </div>
        </Button>
        <div className="text-[9px] text-zinc-600 text-center font-mono">
          Press <kbd className="px-1 py-0.5 bg-zinc-900 border border-zinc-800 rounded">SPACE</kbd> or hold button
        </div>
      </div>

      {!canTransmit && (
        <div className="p-3 bg-red-950/20 border border-red-900/50 text-red-500 text-[10px] font-mono uppercase tracking-wider text-center">
          Insufficient clearance to transmit
        </div>
      )}

      <Separator className="bg-zinc-900" />

      {/* Tactical Actions */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase text-zinc-600 font-bold tracking-wider">Tactical Commands</div>
        <div className="grid grid-cols-2 gap-2">
          {/* Combat Flare */}
          {canFlare && (
            <Button
              size="sm"
              variant="outline"
              disabled={!isConnected}
              onClick={() => handleFlare('COMBAT')}
              className="flex flex-col items-center justify-center h-20 border-orange-900 bg-orange-950/20 text-orange-500 hover:bg-orange-950/40 hover:text-orange-400"
            >
              <Shield className="w-6 h-6 mb-1" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Combat Flare</span>
            </Button>
          )}

          {/* Medical Flare */}
          {canFlare && (
            <Button
              size="sm"
              variant="outline"
              disabled={!isConnected}
              onClick={() => handleFlare('MEDICAL')}
              className="flex flex-col items-center justify-center h-20 border-red-900 bg-red-950/20 text-red-500 hover:bg-red-950/40 hover:text-red-400"
            >
              <Flame className="w-6 h-6 mb-1" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Medical Flare</span>
            </Button>
          )}

          {/* Broadcast Mode */}
          {canBroadcast && (
            <Button
              size="sm"
              variant="outline"
              disabled={!isConnected}
              onClick={handleBroadcast}
              className={cn(
                "flex flex-col items-center justify-center h-20 transition-all",
                broadcastMode 
                  ? "border-emerald-900 bg-emerald-950/40 text-emerald-400" 
                  : "border-zinc-800 bg-zinc-950/20 text-zinc-500 hover:bg-zinc-900"
              )}
            >
              <Zap className="w-6 h-6 mb-1" />
              <span className="text-[9px] font-bold uppercase tracking-wider">
                {broadcastMode ? 'Broadcasting' : 'Broadcast'}
              </span>
            </Button>
          )}

          {/* Whisper Mode */}
          {canWhisper && (
            <Button
              size="sm"
              variant="outline"
              disabled={!isConnected}
              onClick={handleWhisper}
              className={cn(
                "flex flex-col items-center justify-center h-20 transition-all",
                whisperMode 
                  ? "border-amber-900 bg-amber-950/40 text-amber-400" 
                  : "border-zinc-800 bg-zinc-950/20 text-zinc-500 hover:bg-zinc-900"
              )}
            >
              <MessageSquare className="w-6 h-6 mb-1" />
              <span className="text-[9px] font-bold uppercase tracking-wider">
                {whisperMode ? 'Whisper Active' : 'Whisper'}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Commander Controls */}
      {canMuteAll && (
        <>
          <Separator className="bg-zinc-900" />
          <div className="space-y-2">
            <div className="text-[10px] uppercase text-red-600 font-bold tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Command Override
            </div>
            <Button
              size="sm"
              variant="destructive"
              disabled={!isConnected}
              onClick={handleMuteAll}
              className="w-full bg-red-900 hover:bg-red-800 border border-red-800"
            >
              <VolumeX className="w-4 h-4 mr-2" />
              PRIORITY MUTE ALL
            </Button>
            <div className="text-[9px] text-red-600/60 text-center font-mono">
              Silences all participants except command rank
            </div>
          </div>
        </>
      )}

      {/* Audio Device Info */}
      {devices.microphones.length > 0 && (
        <>
          <Separator className="bg-zinc-900" />
          <div className="space-y-1">
            <div className="text-[10px] uppercase text-zinc-600 font-bold tracking-wider">Audio Device</div>
            <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-mono">
              <Headphones className="w-3 h-3" />
              <span className="truncate">
                {devices.microphones.find(m => m.deviceId === room?.localParticipant?.audioTrack?.deviceId)?.label || 'Default Microphone'}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Connection Stats */}
      <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[9px] font-mono text-zinc-600">
        <span>NET: {net?.code || 'NONE'}</span>
        <span className={cn(isConnected ? 'text-emerald-600' : 'text-red-600')}>
          {isConnected ? '●' : '○'} {connectionState.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
