import { useEffect, useMemo, useState } from "react";
import { ActivitySquare, Compass, PanelsTopLeft, RadioTower, Settings, ToggleRight } from "lucide-react";
import { RoomAudioRenderer } from "@livekit/components-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useLiveKitToken } from "@/hooks/useLiveKitToken";
import { useLiveKit } from "@/hooks/useLiveKit";
import AudioProcessor from "@/api/AudioProcessor";
import SpatialMixer from "@/api/SpatialMixer";
import { NexusBadge, NexusButton, NexusCard, Scanline } from "../components/ui/SciFiComponents";
import LiveKitErrorBoundary from "../components/comms/LiveKitErrorBoundary";
import { TheTicker } from "./TheTicker";
import { CommsDeck } from "./CommsDeck";

const navModes = [
  { id: "ops", label: "Ops", icon: <PanelsTopLeft className="h-5 w-5" /> },
  { id: "map", label: "Nav", icon: <Compass className="h-5 w-5" /> },
  { id: "comm", label: "Comms", icon: <RadioTower className="h-5 w-5" /> },
  { id: "sys", label: "Systems", icon: <ActivitySquare className="h-5 w-5" /> },
  { id: "config", label: "Config", icon: <Settings className="h-5 w-5" /> },
];

export const NomadShell = () => {
  const [isDeckOpen, setIsDeckOpen] = useState<boolean>(true);
  const [activeMode, setActiveMode] = useState<string>("ops");
  const { data: profile } = useUserProfile();
  const { connectShell, room, shellConnectionState, connectionState, error: liveKitError } = useLiveKit();

  const participantName = useMemo(
    () => profile?.callsign || profile?.rsi_handle || profile?.email || "Nomad-Shell-Operator",
    [profile?.callsign, profile?.email, profile?.rsi_handle]
  );
  const roomName = "nomad-ops-shell";
  const { token, serverUrl, isLoading, error } = useLiveKitToken(roomName, participantName, profile?.id, profile?.rank);

  useEffect(() => {
    // Prime audio engine singletons early so LiveKitRoom can route audio immediately after connect.
    AudioProcessor.getInstance();
    new SpatialMixer();
  }, []);

  useEffect(() => {
    console.log('[NomadShell] useEffect triggered:', { 
      hasToken: !!token, 
      hasServerUrl: !!serverUrl, 
      hasParticipantName: !!participantName,
      shellConnectionState,
      roomName,
      profileRank: profile?.rank,
      profileId: profile?.id
    });
    
    if (!token || !serverUrl || !participantName) {
      console.log('[NomadShell] Missing required params, skipping connection');
      return;
    }
    if (shellConnectionState === "connected" || shellConnectionState === "connecting") {
      console.log('[NomadShell] Already connected or connecting, skipping');
      return;
    }
    
    console.log('[NomadShell] Calling connectShell...');
    connectShell({
      roomName,
      participantName,
      role: profile?.rank,
      userId: profile?.id,
      tokenOverride: token,
      serverUrlOverride: serverUrl,
    });
  }, [token, serverUrl, participantName, shellConnectionState, connectShell, roomName, profile?.rank, profile?.id]);

  const activeFlavor = useMemo(() => {
    switch (activeMode) {
      case "map":
        return "Calculating jump lattice across Stanton...";
      case "comm":
        return "Routing bands across SYN-TOWER relays.";
      case "sys":
        return "Diagnostics sweeping through power couplings.";
      case "config":
        return "Loading bridge preferences and overrides.";
      default:
        return "Awaiting telemetry packet...";
    }
  }, [activeMode]);

  if (!token || !serverUrl) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-sm uppercase tracking-[0.2em] text-zinc-500">
        {isLoading ? "Establishing LiveKit uplink..." : error ? <span className="bg-red-900 text-red-300 px-2 py-1 rounded">LiveKit link failed: {error}</span> : "Awaiting LiveKit token."}
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-sm uppercase tracking-[0.2em] text-zinc-500">
        {liveKitError ? <span className="bg-red-900 text-red-300 px-2 py-1 rounded">LiveKit error: {liveKitError.message || liveKitError}</span> : <span className="bg-zinc-950 text-zinc-400 px-2 py-1 rounded">LiveKit {connectionState || "idle"}...</span>}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black">
      {/* RoomAudioRenderer handles WebRTC audio routing - room is managed by useLiveKit context */}
      {room && <RoomAudioRenderer />}
      <div className="h-screen w-screen bg-black p-6">
        <LiveKitErrorBoundary>
          <div className="relative flex h-full flex-col overflow-hidden border border-slate-700 bg-gradient-to-b from-[#050505] via-gunmetal to-black text-tech-white">
            <TheTicker />

            <div className="flex flex-1">
              <aside className="flex w-20 flex-col items-center gap-4 border-r border-slate-800 bg-gunmetal/80 px-3 py-6">
                {navModes.map((mode) => (
                  <NexusButton
                    key={mode.id}
                    variant={activeMode === mode.id ? "primary" : "ghost"}
                    icon={mode.icon}
                    aria-pressed={activeMode === mode.id}
                    onClick={() => setActiveMode(mode.id)}
                    className="w-full justify-center"
                  >
                    {mode.label}
                  </NexusButton>
                ))}
                <div className="mt-auto w-full">
                  <NexusButton
                    variant={isDeckOpen ? "primary" : "ghost"}
                    icon={<ToggleRight className="h-4 w-4" />}
                    onClick={() => setIsDeckOpen((open) => !open)}
                    className="w-full justify-center"
                  >
                    Deck
                  </NexusButton>
                </div>
              </aside>

              <main className="relative flex-1 bg-[radial-gradient(circle_at_20%_20%,rgba(204,85,0,0.08),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(30,41,59,0.35),transparent_35%)]">
                <div className="absolute inset-0 border border-slate-800" />
                <Scanline intensity={0.12} />
                <div className="relative z-10 flex h-full flex-col gap-6 p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <NexusBadge label="Redscar Nomads" status="online" />
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-300">{activeFlavor}</p>
                    </div>
                    <NexusButton variant="ghost" icon={<Settings className="h-4 w-4" />}>
                      Bridge Prefs
                    </NexusButton>
                  </div>

                  <div className="grid h-full grid-cols-3 gap-4">
                    <NexusCard title="Mission Board" meta="OPS" className="col-span-2 flex flex-col justify-between">
                      <div className="space-y-3 text-sm text-slate-200">
                        <p>Deployment staging is armed. All pilots maintain launch readiness.</p>
                        <p>Last ping: VIPER-12 confirms escort corridor is clear.</p>
                        <p className="text-burnt-orange">Mission queue updated 2m ago.</p>
                      </div>
                    </NexusCard>
                    <NexusCard title="Telemetry" meta="Live Feed">
                      <div className="space-y-2 text-xs text-slate-300">
                        <p>Beacon Range: 42.7 AU</p>
                        <p>Fuel Reserves: 87%</p>
                        <p className="text-indicator-green">Power Grid: Stable</p>
                        <p className="text-red-400">Interference: 3.1%</p>
                      </div>
                    </NexusCard>
                    <NexusCard title="Dispatch" meta="SCANS" className="col-span-3">
                      <div className="grid grid-cols-3 gap-3 text-sm text-slate-200">
                        <div className="border border-slate-700 p-3">
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Echo Array</p>
                          <p className="text-burnt-orange">Ping every 6s</p>
                        </div>
                        <div className="border border-slate-700 p-3">
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Cargo Flow</p>
                          <p className="text-indicator-green">Nominal</p>
                        </div>
                        <div className="border border-slate-700 p-3">
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Intrusions</p>
                          <p className="text-red-400">None flagged</p>
                        </div>
                      </div>
                    </NexusCard>
                  </div>
                </div>
              </main>
            </div>

            <CommsDeck isOpen={isDeckOpen} />
          </div>
        </LiveKitErrorBoundary>
      </div>
    </div>
  );
};

export default NomadShell;
