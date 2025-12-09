import React from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Radio, Signal, Users, Flame, ShieldAlert, Network, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccessFocusedVoice, hasMinRank } from "@/components/permissions";
import ActiveNetPanel from "@/components/comms/ActiveNetPanel";
import VoiceCommandPanel from "@/components/comms/VoiceCommandPanel";
import NetPresenceOverview from "@/components/comms/NetPresenceOverview";
import NetworkStatusMonitor from "@/components/comms/NetworkStatusMonitor";
import CompactSignalMeter from "@/components/comms/CompactSignalMeter";
import CommsFeatureMatrix from "@/components/comms/CommsFeatureMatrix";
import { useLiveKit } from '@/hooks/useLiveKit';
import { useLiveKitToken } from '@/hooks/useLiveKitToken';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LiveKitErrorBoundary from './LiveKitErrorBoundary';
import { useNavigate } from 'react-router-dom';

export default function CommsDashboardPanel({ user, eventId, className }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedNet, setSelectedNet] = React.useState(null);
  const [userSquadId, setUserSquadId] = React.useState(null);
  const [createLabel, setCreateLabel] = React.useState('');
  const [createCode, setCreateCode] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [bridgeSourceId, setBridgeSourceId] = React.useState('');
  const [bridgeTargetId, setBridgeTargetId] = React.useState('');
  const [bridges, setBridges] = React.useState([]);
  const [showFeatureMatrix, setShowFeatureMatrix] = React.useState(false);
  const {
    connectNet,
    activeNet,
    room,
    connectionState,
    audioState,
    connectionMetrics,
  } = useLiveKit();

  const participantName = React.useMemo(
    () => user?.callsign || user?.rsi_handle || user?.email || 'Nomad-Net-Operator',
    [user?.callsign, user?.email, user?.rsi_handle]
  );
  const netRoomName = selectedNet?.code || null;
  const identity = user?.id || participantName;
  const role = user?.rank;
  const { token: netToken, serverUrl: netServerUrl } = useLiveKitToken(netRoomName, participantName, identity, role);

  const handleDouseCampfire = async (net) => {
    if (!net?.id) {
      setErrorMsg('Invalid campfire.');
      return;
    }
    if (!canManageCampfires) {
      setErrorMsg('Scout+ required to douse campfires.');
      return;
    }
    setErrorMsg('');
    setIsSaving(true);
    const cacheKey = ['comms-panel-nets', eventId];
    const previousNets = queryClient.getQueryData(cacheKey);
    try {
      if (net.type !== 'campfire' && net.type !== 'general') {
        throw new Error('Only campfires can be doused.');
      }

      // Cancel any active refetches to prevent stale data overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: cacheKey });

      // Optimistically remove to avoid waiting for poll/invalidations
      queryClient.setQueryData(cacheKey, (old = []) => old.filter(n => n.id !== net.id));

      const { error } = await supabase
        .from('voice_nets')
        .delete()
        .eq('id', net.id);
      if (error) throw error;
      if (selectedNet?.id === net.id) setSelectedNet(null);
      
      // Invalidate to refetch latest state from server
      await queryClient.invalidateQueries({ queryKey: cacheKey });
    } catch (err) {
      console.error('Douse campfire failed', err);
      if (previousNets) queryClient.setQueryData(cacheKey, previousNets);
      setErrorMsg(err?.message || 'Failed to douse campfire.');
    } finally {
      setIsSaving(false);
    }
  };

  // Capability gates
  const canBroadcast = user && hasMinRank(user, 'voyager');
  const canWhisper = user && hasMinRank(user, 'scout');
  const canMuteAll = user && hasMinRank(user, 'founder');
  const canFlare = user && hasMinRank(user, 'scout');

  // Fetch user's squad
  useQuery({
    queryKey: ['comms-panel-squad', eventId, user?.id],
    queryFn: async () => {
       if (!eventId || !user) return null;
       const { data: statuses } = await supabase
         .from('player_status')
         .select('assigned_squad_id')
         .eq('user_id', user.id)
         .eq('event_id', eventId);
       if (statuses?.[0]?.assigned_squad_id) {
         setUserSquadId(statuses[0].assigned_squad_id);
         return statuses[0].assigned_squad_id;
       }
       const { data: memberships } = await supabase
         .from('squad_members')
         .select('squad_id')
         .eq('user_id', user.id);
       if (memberships?.[0]) {
         setUserSquadId(memberships[0].squad_id);
         return memberships[0].squad_id;
       }
       setUserSquadId(null);
       return null;
    },
    enabled: !!eventId && !!user
  });

  // Fetch voice nets - always fetch general/campfire nets, plus event-specific if eventId provided
  const { data: voiceNets = [], isLoading } = useQuery({
    queryKey: ['comms-panel-nets', eventId],
    queryFn: async () => {
      if (!supabase) return [];
      
      // Always fetch general campfires/bonfires (no event_id or null event_id)
      const { data: generalNets, error: generalError } = await supabase
        .from('voice_nets')
        .select('*')
        .is('event_id', null)
        .order('priority', { ascending: true });
      
      if (generalError) console.error('General nets fetch failed:', generalError);
      
      // If we have an event, also fetch event-specific nets
      let eventNets = [];
      if (eventId) {
        const { data, error } = await supabase
          .from('voice_nets')
          .select('*')
          .eq('event_id', eventId)
          .order('priority', { ascending: true });
        if (error) console.error('Event nets fetch failed:', error);
        else eventNets = data || [];
      }
      
      return [...(generalNets || []), ...eventNets];
    },
    refetchInterval: 5000,
    initialData: []
  });

  // Auto-select user's squad net
  React.useEffect(() => {
    if (userSquadId && voiceNets.length > 0 && !selectedNet) {
      const squadNet = voiceNets.find(n => n.linked_squad_id === userSquadId);
      if (squadNet) {
        setSelectedNet(squadNet);
      }
    }
  }, [userSquadId, voiceNets, selectedNet]);

  // Join LiveKit net room when selection + token are ready
  React.useEffect(() => {
    if (!selectedNet || !netRoomName || !netToken || !netServerUrl) return;
    connectNet({
      roomName: netRoomName,
      participantName,
      role,
      userId: user?.id,
      linkedSquadId: selectedNet.linked_squad_id,
      tokenOverride: netToken,
      serverUrlOverride: netServerUrl,
      netId: selectedNet.id,
      position: selectedNet.position_hint || {},
    });
  }, [selectedNet, netRoomName, netToken, netServerUrl, participantName, role, user?.id, connectNet]);

  // Check permissions
  const hasAccess = user && canAccessFocusedVoice(user);
  const canManageCampfires = user && hasMinRank(user, 'scout');
  const canControlSquad = user && hasMinRank(user, 'scout');
  const canControlWing = user && hasMinRank(user, 'voyager');
  const canControlFleet = user && hasMinRank(user, 'founder');
  const canBridge = user && hasMinRank(user, 'founder');

  if (!hasAccess) {
    return (
      <div className={cn("h-full flex flex-col items-center justify-center text-zinc-600 bg-zinc-950/30 border border-zinc-800/50", className)}>
        <Signal className="w-8 h-8 text-red-900 opacity-50 mb-2" />
        <div className="text-xs font-bold uppercase tracking-wider text-red-800">Insufficient Clearance</div>
        <div className="text-[10px] text-zinc-600 mt-1">Scout+ required for voice nets</div>
      </div>
    );
  }

  // No longer block UI when no event - general comms are always available

  if (isLoading) {
    return (
      <div className={cn("h-full flex flex-col items-center justify-center text-zinc-600 bg-zinc-950/30 border border-zinc-800/50", className)}>
        <div className="text-xs text-emerald-500 animate-pulse font-bold">SCANNING FREQUENCIES...</div>
      </div>
    );
  }

  // Categorize nets
  // Campfires: Casual, can exist without events, open voice
  const campfires = voiceNets.filter(n => n.type === 'general' || n.type === 'campfire');
  
  // Bonfires: Focused PTT-only channels, always attached to events
  const bonfires = voiceNets.filter(n => n.type === 'focused' && n.event_id);
  
  // Squad and Command nets
  const squadNets = voiceNets.filter(n => n.linked_squad_id && n.type !== 'focused');
  const commandNets = voiceNets.filter(n => n.type === 'command' || n.priority <= 2);
  const allNetOptions = voiceNets.map(n => ({ id: n.id, label: `${n.code} — ${n.label}` }));

  // Create / update helpers
  const handleCreateNet = async (type) => {
    setErrorMsg('');
    setIsSaving(true);
    try {
      const code = createCode?.trim() || `NET-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const label = createLabel?.trim() || (type === 'campfire' ? 'New Campfire' : 'New Bonfire');
      const payload = {
        code,
        label,
        type: type === 'campfire' ? 'campfire' : 'focused',
        priority: type === 'campfire' ? 4 : 2,
        event_id: type === 'campfire' ? null : eventId || null,
      };
      if (type === 'bonfire' && !eventId) {
        setErrorMsg('Select an event to attach a Bonfire.');
        setIsSaving(false);
        return;
      }
      const { error } = await supabase.from('voice_nets').insert(payload);
      if (error) throw error;
      setCreateLabel('');
      setCreateCode('');
      queryClient.invalidateQueries({ queryKey: ['comms-panel-nets', eventId] });
    } catch (err) {
      console.error('Create net failed', err);
      setErrorMsg(err?.message || 'Failed to create net');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBridgeLink = () => {
    setErrorMsg('');
    if (!canBridge) {
      setErrorMsg('Founder+ required to bridge nets');
      return;
    }
    if (!bridgeSourceId || !bridgeTargetId || bridgeSourceId === bridgeTargetId) {
      setErrorMsg('Select distinct source and target nets');
      return;
    }
    setBridges((prev) => {
      const next = prev.filter(b => b.sourceId !== bridgeSourceId); // replace existing source bridge
      next.push({ sourceId: bridgeSourceId, targetId: bridgeTargetId });
      return next;
    });
  };

  const handleBridgeUnlink = (netId) => {
    setBridges((prev) => prev.filter(b => b.sourceId !== netId && b.targetId !== netId));
  };

  const handleUpdateLabel = async () => {
    if (!selectedNet) return;
    setErrorMsg('');
    setIsSaving(true);
    try {
      const label = createLabel?.trim();
      if (!label) {
        setErrorMsg('Enter a label to update.');
        setIsSaving(false);
        return;
      }
      const { error } = await supabase
        .from('voice_nets')
        .update({ label })
        .eq('id', selectedNet.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['comms-panel-nets', eventId] });
    } catch (err) {
      console.error('Update net failed', err);
      setErrorMsg(err?.message || 'Failed to update net');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LiveKitErrorBoundary>
      <div className={cn("h-full flex flex-col bg-zinc-950/30 border border-zinc-800/50", className)}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/50 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Comms</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFeatureMatrix(!showFeatureMatrix)}
              className="p-1.5 hover:bg-zinc-800/50 rounded transition-colors"
              title={showFeatureMatrix ? 'Hide feature matrix' : 'Show all features'}
            >
              <Info className="w-4 h-4 text-cyan-400/70 hover:text-cyan-400" />
            </button>
            <CompactSignalMeter 
              quality={connectionMetrics?.quality || (connectionState === 'connected' ? 'excellent' : 'poor')}
              connectionState={connectionState}
              showLabel={true}
            />
          </div>
        </div>

        {/* Feature Matrix Toggle */}
        {showFeatureMatrix && (
          <div className="px-3 py-2 bg-zinc-950/70 border-b border-zinc-900/50 max-h-48 overflow-y-auto custom-scrollbar">
            <CommsFeatureMatrix user={user} compact={true} />
          </div>
        )}

        {/* Capability Chips - Reorganized for clarity */}
        <div className="px-3 py-2 bg-zinc-950/50 border-b border-zinc-900/50 space-y-2">
          {/* Monitoring & Diagnostics Always Available */}
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-400">
            <span className="font-bold">Monitoring:</span>
            <Badge variant="outline" className="border-cyan-800/60 text-cyan-300 bg-cyan-950/20">QoS Live</Badge>
            <Badge variant="outline" className="border-cyan-800/60 text-cyan-300 bg-cyan-950/20">Presence</Badge>
          </div>

          {/* Rank-Gated Features */}
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-400 flex-wrap">
            <span className="font-bold w-full mb-1">Messaging:</span>
            <Badge variant="outline" className={cn("border-amber-800/60", canWhisper ? "text-amber-300 bg-amber-950/20" : "text-zinc-600 line-through opacity-50")}>Whisper</Badge>
            <Badge variant="outline" className={cn("border-amber-800/60", canBroadcast ? "text-amber-300 bg-amber-950/20" : "text-zinc-600 line-through opacity-50")}>Broadcast</Badge>
            <Badge variant="outline" className={cn("border-orange-800/60", canFlare ? "text-orange-300 bg-orange-950/20" : "text-zinc-600 line-through opacity-50")}>Flares</Badge>
          </div>

          {/* Admin Controls */}
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-400 flex-wrap">
            <span className="font-bold w-full mb-1">Controls:</span>
            <Badge variant="outline" className={cn("border-red-800/60", canMuteAll ? "text-red-300 bg-red-950/20" : "text-zinc-600 line-through opacity-50")}>Global Mute</Badge>
            <Badge variant="outline" className={cn("border-cyan-800/60", hasMinRank(user, 'voyager') ? "text-cyan-300 bg-cyan-950/20" : "text-zinc-600 line-through opacity-50")}>Fleet Routing</Badge>
            <Badge variant="outline" className={cn("border-cyan-800/60", hasMinRank(user, 'founder') ? "text-cyan-300 bg-cyan-950/20" : "text-zinc-600 line-through opacity-50")}>Net Bridging</Badge>
          </div>
        </div>

        {/* Degradation banner */}
        {(connectionMetrics?.latencyMs > 180 || connectionMetrics?.packetLoss > 3) && (
          <div className="px-3 py-2 bg-gradient-to-r from-orange-950/60 via-red-950/50 to-zinc-950/40 border-b border-red-900/40 text-[10px] uppercase tracking-widest text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-300" />
              <span>
                Network degraded · RTT {connectionMetrics?.latencyMs?.toFixed?.(0) ?? connectionMetrics?.latencyMs} ms · Loss {connectionMetrics?.packetLoss ?? 0}%
              </span>
            </div>
            <div className="text-[9px] text-amber-300/80">
              Tip: reduce bitrate / disable video / fall back to PTT
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Live Network Health */}
          <div className="px-3 py-2 bg-black/40 border-b border-zinc-800/50">
            <NetworkStatusMonitor
              connectionState={connectionState}
              latency={connectionMetrics?.latencyMs ?? 0}
              jitter={connectionMetrics?.jitter ?? 0}
              packetLoss={connectionMetrics?.packetLoss ?? 0}
              bandwidth={{ in: connectionMetrics?.bandwidth?.inKbps ?? 0, out: connectionMetrics?.bandwidth?.outKbps ?? 0 }}
            />
          </div>

          {/* Ops controls (rank-gated quick routing & bridging) */}
          <div className="px-3 py-2 border-b border-zinc-800/50 bg-black/30 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-400 uppercase tracking-widest">
              <span className="font-bold text-zinc-300">Ops Controls</span>
              {!eventId && <span className="text-amber-400">Select an event to route ops</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!canControlFleet || commandNets.length === 0}
                onClick={() => commandNets[0] && setSelectedNet(commandNets[0])}
                className="h-7 px-2 text-[10px] border-red-800/70 text-red-300 hover:bg-red-900/20 disabled:opacity-40"
              >
                Route Fleet Command
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!canControlWing || bonfires.length === 0}
                onClick={() => bonfires[0] && setSelectedNet(bonfires[0])}
                className="h-7 px-2 text-[10px] border-amber-800/70 text-amber-300 hover:bg-amber-900/20 disabled:opacity-40"
              >
                Route Wing (Bonfire)
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!canControlSquad || squadNets.length === 0}
                onClick={() => squadNets[0] && setSelectedNet(squadNets[0])}
                className="h-7 px-2 text-[10px] border-emerald-800/70 text-emerald-300 hover:bg-emerald-900/20 disabled:opacity-40"
              >
                Route Squad
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={campfires.length === 0}
                onClick={() => campfires[0] && setSelectedNet(campfires[0])}
                className="h-7 px-2 text-[10px] border-orange-800/70 text-orange-300 hover:bg-orange-900/20 disabled:opacity-40"
              >
                Route Campfire
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={bridgeSourceId}
                onChange={(e) => setBridgeSourceId(e.target.value)}
                className="px-2 py-1 text-[10px] bg-black border border-zinc-800 text-zinc-200"
              >
                <option value="">Source net to bridge</option>
                {allNetOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
              <select
                value={bridgeTargetId}
                onChange={(e) => setBridgeTargetId(e.target.value)}
                className="px-2 py-1 text-[10px] bg-black border border-zinc-800 text-zinc-200"
              >
                <option value="">Target net</option>
                {allNetOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                disabled={!canBridge}
                onClick={handleBridgeLink}
                className="h-7 px-2 text-[10px] border-cyan-800/70 text-cyan-200 hover:bg-cyan-900/20 disabled:opacity-40"
              >
                Link / Bridge
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={!canBridge || (!bridgeSourceId && !bridgeTargetId)}
                onClick={() => {
                  handleBridgeUnlink(bridgeSourceId || bridgeTargetId);
                  setBridgeSourceId('');
                  setBridgeTargetId('');
                }}
                className="h-7 px-2 text-[10px] text-zinc-400 hover:bg-zinc-800/40 disabled:opacity-40"
              >
                Unlink
              </Button>
              <span className="text-[10px] text-zinc-500">Bridges are local/UI; full audio routing in Comms Console.</span>
            </div>
          </div>
          {/* Manage bar always visible */}
          <div className="px-3 py-2 border-b border-zinc-800/50 bg-zinc-900/30 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={createLabel}
                onChange={(e) => setCreateLabel(e.target.value)}
                placeholder="Label"
                className="px-2 py-1 text-[10px] bg-black border border-zinc-800 text-zinc-200 w-32"
              />
              <input
                value={createCode}
                onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                placeholder="Code"
                className="px-2 py-1 text-[10px] bg-black border border-zinc-800 text-zinc-200 w-24"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={isSaving || !canManageCampfires}
                onClick={() => handleCreateNet('campfire')}
                className="h-7 px-2 text-[10px] border-orange-800/70 text-orange-300 hover:bg-orange-900/20 disabled:opacity-40"
              >
                + Campfire
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isSaving || !canManageCampfires || !eventId}
                onClick={() => handleCreateNet('bonfire')}
                className="h-7 px-2 text-[10px] border-red-800/70 text-red-300 hover:bg-red-900/20 disabled:opacity-40"
                title={!eventId ? 'Select an active event to create a bonfire' : undefined}
              >
                + Bonfire (event)
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={isSaving || !selectedNet || !canManageCampfires}
                onClick={handleUpdateLabel}
                className="h-7 px-2 text-[10px] text-emerald-300 hover:bg-emerald-900/20 disabled:opacity-40"
              >
                Update Label
              </Button>
              {errorMsg && <span className="text-[10px] text-red-400">{errorMsg}</span>}
              {!canManageCampfires && (
                <span className="text-[10px] text-zinc-500">Scout+ required to create/manage nets</span>
              )}
            </div>

            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Available Nets</div>
          </div>

          {voiceNets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 p-4">
              <Flame className="w-8 h-8 text-orange-500/30 mb-2" />
              <div className="text-xs text-zinc-500 mb-2">No channels available</div>
              <div className="text-[10px] text-zinc-600 mt-1 text-center leading-relaxed">
                <strong className="text-orange-400">Campfires</strong>: Casual voice, always available<br/>
                <strong className="text-red-400">Bonfires</strong>: Focused PTT, event-based
              </div>
              <div className="mt-3 text-[10px] text-zinc-500">Use the controls above to create or route nets.</div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Net Selector */}
              <div className="px-3 py-2 border-b border-zinc-800/50 bg-zinc-900/30">
                <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                  {commandNets.length > 0 && (
                    <>
                      <div className="text-[9px] text-red-400 uppercase tracking-widest mb-1">Command</div>
                      {commandNets.map(net => (
                        <button
                          key={net.id}
                          onClick={() => setSelectedNet(net)}
                          className={cn(
                            "w-full text-left px-2 py-1 text-[10px] border border-zinc-800 hover:border-red-700 hover:bg-red-950/20 flex justify-between items-center",
                            selectedNet?.id === net.id && "border-red-700 bg-red-950/30 text-red-100"
                          )}
                        >
                          <span className="font-bold">{net.code}</span>
                          <div className="flex items-center gap-1 text-zinc-500">
                            <span>{net.label}</span>
                            {bridges.find(b => b.sourceId === net.id) && (
                              <span className="text-[9px] text-cyan-300">→ {voiceNets.find(n => n.id === bridges.find(b => b.sourceId === net.id).targetId)?.code || 'Linked'}</span>
                            )}
                            {bridges.find(b => b.targetId === net.id) && (
                              <span className="text-[9px] text-cyan-500">⇢ bridged</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  
                  {squadNets.length > 0 && (
                    <>
                      <div className="text-[9px] text-emerald-400 uppercase tracking-widest mb-1 mt-2">Squad Nets</div>
                      {squadNets.map(net => (
                        <button
                          key={net.id}
                          onClick={() => setSelectedNet(net)}
                          className={cn(
                            "w-full text-left px-2 py-1 text-[10px] border border-zinc-800 hover:border-emerald-700 hover:bg-emerald-950/20 flex justify-between items-center",
                            selectedNet?.id === net.id && "border-emerald-700 bg-emerald-950/30 text-emerald-100"
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span className="font-bold">{net.code}</span>
                          </div>
                          <div className="flex items-center gap-1 text-zinc-500 text-[9px]">
                            <span>{net.label}</span>
                            {bridges.find(b => b.sourceId === net.id) && (
                              <span className="text-cyan-300">→ {voiceNets.find(n => n.id === bridges.find(b => b.sourceId === net.id).targetId)?.code || 'Linked'}</span>
                            )}
                            {bridges.find(b => b.targetId === net.id) && (
                              <span className="text-cyan-500">⇢ bridged</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {bonfires.length > 0 && (
                    <>
                      <div className="text-[9px] text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <span>🔥 Bonfires</span>
                        <span className="text-zinc-600 text-[8px]">(PTT Only)</span>
                      </div>
                      {bonfires.map(net => (
                        <button
                          key={net.id}
                          onClick={() => setSelectedNet(net)}
                          className={cn(
                            "w-full text-left px-2 py-1 text-[10px] border border-zinc-800 hover:border-red-700 hover:bg-red-950/20 flex justify-between items-center",
                            selectedNet?.id === net.id && "border-red-700 bg-red-950/30 text-red-100"
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            <span className="font-bold">{net.code}</span>
                          </div>
                          <div className="flex items-center gap-1 text-zinc-500 text-[9px]">
                            <span>{net.label}</span>
                            {bridges.find(b => b.sourceId === net.id) && (
                              <span className="text-cyan-300">→ {voiceNets.find(n => n.id === bridges.find(b => b.sourceId === net.id).targetId)?.code || 'Linked'}</span>
                            )}
                            {bridges.find(b => b.targetId === net.id) && (
                              <span className="text-cyan-500">⇢ bridged</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  
                  {campfires.length > 0 && (
                    <>
                      <div className="text-[9px] text-orange-400 uppercase tracking-widest mb-1 mt-2 flex items-center gap-1">
                        <span>Campfires</span>
                        <span className="text-zinc-600 text-[8px]">(Casual)</span>
                      </div>
                      {campfires.map(net => (
                        <div
                          key={net.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedNet(net)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedNet(net);
                            }
                          }}
                          className={cn(
                            "w-full text-left px-2 py-1 text-[10px] border border-zinc-800 hover:border-orange-700 hover:bg-orange-950/20 flex justify-between items-center",
                            selectedNet?.id === net.id && "border-orange-700 bg-orange-950/30 text-orange-100"
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            <span className="font-bold">{net.code}</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-500 text-[9px]">
                            <span>{net.label}</span>
                            {bridges.find(b => b.sourceId === net.id) && (
                              <span className="text-cyan-300">→ {voiceNets.find(n => n.id === bridges.find(b => b.sourceId === net.id).targetId)?.code || 'Linked'}</span>
                            )}
                            {bridges.find(b => b.targetId === net.id) && (
                              <span className="text-cyan-500">⇢ bridged</span>
                            )}
                            {canManageCampfires && (
                              <button
                                type="button"
                                className="ml-2 px-2 py-0.5 border border-red-800/70 text-red-300 hover:bg-red-900/30 rounded disabled:opacity-50"
                                disabled={isSaving}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDouseCampfire(net);
                                }}
                                title="Douse campfire"
                              >
                                {isSaving ? 'Dousing…' : 'Douse'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Active Net Panel + Voice Controls Split View */}
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-2">
                {selectedNet ? (
                  <>
                    <div className="px-3 py-2 bg-emerald-950/30 border border-emerald-900/50 text-[10px] uppercase tracking-widest text-emerald-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">Active Net</span>
                        <span className="text-emerald-100">{activeNet?.code || selectedNet.code}</span>
                      </div>
                      <span className="text-emerald-300/70">LiveKit Room: {activeNet?.code || 'connecting...'}</span>
                    </div>

                    {/* Voice Command Panel - Always visible when net selected */}
                    <div className="shrink-0">
                      <VoiceCommandPanel
                        user={user}
                        net={selectedNet}
                        compact
                      />
                    </div>
                    
                    {/* Tabbed View: Active Net Roster vs Global Presence */}
                    <Tabs defaultValue="roster" className="flex-1 min-h-0 flex flex-col">
                      <TabsList className="shrink-0 grid w-full grid-cols-2 bg-zinc-900/50">
                        <TabsTrigger value="roster" className="data-[state=active]:bg-emerald-950/50 text-[10px]">
                          <Users className="w-3 h-3 mr-1" />
                          Current Net
                        </TabsTrigger>
                        <TabsTrigger value="presence" className="data-[state=active]:bg-cyan-950/50 text-[10px]">
                          <Network className="w-3 h-3 mr-1" />
                          All Nets
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="roster" className="flex-1 min-h-0 overflow-hidden m-0">
                        <ActiveNetPanel
                          net={selectedNet}
                          user={user}
                          eventId={eventId}
                          room={room}
                          connectionState={connectionState}
                          audioState={audioState}
                          connectionMetrics={connectionMetrics}
                          compact
                        />
                      </TabsContent>
                      
                      <TabsContent value="presence" className="flex-1 min-h-0 overflow-hidden m-0">
                        <NetPresenceOverview
                          eventId={eventId}
                          currentNetId={selectedNet?.id}
                          connectionMetrics={connectionMetrics}
                          compact
                        />
                      </TabsContent>
                    </Tabs>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 p-4">
                    <Radio className="w-6 h-6 opacity-20 mb-2" />
                    <div className="text-xs text-zinc-500">Select a net to connect</div>
                    <div className="text-[10px] text-zinc-600 mt-2 text-center">
                      Voice controls will appear once connected
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </LiveKitErrorBoundary>
  );
}
