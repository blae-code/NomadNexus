import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Radio, Activity, Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Slider as RangeSlider } from "@/components/ui/slider";
import { useLiveKit, AUDIO_STATE } from "@/hooks/useLiveKit";
import { usePTT } from "@/hooks/usePTT";
import { cn } from "@/lib/utils";

export default function AudioControls() {
  const [mode, setMode] = useState("PTT"); // 'OPEN', 'PTT'
  const [showSettings, setShowSettings] = useState(false);
  const [vadLevel, setVadLevel] = useState(0);
  const vadStreamRef = useRef(null);
  const { 
    devices, 
    devicePreferences, 
    updateDevicePreference, 
    updateProcessingPreference, 
    audioState, 
    setMicrophoneEnabled,
    vadThreshold,
    setVadThreshold 
  } = useLiveKit();
  const [isSaved, setIsSaved] = useState(false);

  // Enable PTT hook only when in PTT mode
  if (mode === 'PTT') {
    usePTT();
  }
  
  useEffect(() => {
    if (showSettings) {
      setIsSaved(false);
    } else if (!isSaved) {
      // Mark as saved a moment after closing
      const timer = setTimeout(() => setIsSaved(true), 500);
      return () => clearTimeout(timer);
    }
  }, [showSettings]);

  const isMuted = audioState === AUDIO_STATE.CONNECTED_MUTED;
  const isTransmitting = audioState === AUDIO_STATE.CONNECTED_OPEN;

  // Status color logic
  const statusColor = isTransmitting 
    ? "bg-green-500 text-green-500" 
    : (mode === 'PTT' && !isMuted) 
      ? "bg-orange-600 text-orange-600" 
      : "bg-zinc-600 text-zinc-600";

  const statusLabel = isTransmitting
    ? "TRANSMITTING"
    : (mode === 'PTT' && !isMuted)
      ? "PTT READY"
      : "MUTED";

  // PTT Active state for visual feedback
  const { isPTTActive } = mode === 'PTT' ? usePTT() : { isPTTActive: false };

  const handleModeChange = () => {
    const newMode = mode === 'PTT' ? 'OPEN' : 'PTT';
    setMode(newMode);
    // When switching to OPEN mode, unmute. When switching to PTT, mute (PTT will handle unmuting).
    if (newMode === 'OPEN') {
      setMicrophoneEnabled(true);
    } else {
      setMicrophoneEnabled(false);
    }
  };

  const handleMuteToggle = () => {
    // In PTT mode, the main button acts as a mute toggle for the PTT functionality itself
    if (mode === 'PTT') {
        setMicrophoneEnabled(isMuted);
    } else {
      // In OPEN mode, it's a simple mute/unmute toggle.
      setMicrophoneEnabled(!isTransmitting);
    }
  };

  // Physical PTT Button State for CODEX Phase 3.3
  const pttButtonState = mode === 'PTT' 
    ? (isPTTActive ? 'VOX_ACTIVE' : (isMuted ? 'MUTED' : 'STANDBY'))
    : (isTransmitting ? 'VOX_ACTIVE' : 'MUTED');

  const vadHot = vadLevel > vadThreshold;

  useEffect(() => {
    if (!showSettings) return undefined;
    let audioContext;
    let analyser;
    let raf;
    const setup = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            noiseSuppression: devicePreferences.noiseSuppression,
            echoCancellation: devicePreferences.echoCancellation,
            highpassFilter: devicePreferences.highPassFilter,
          },
        });
        vadStreamRef.current = stream;
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const tick = () => {
          analyser.getByteFrequencyData(dataArray);
          const level = Math.max(...dataArray) / 255;
          setVadLevel(level);
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        console.warn('VAD calibration unavailable', err);
      }
    };
    setup();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (vadStreamRef.current) {
        vadStreamRef.current.getTracks().forEach((t) => t.stop());
        vadStreamRef.current = null;
      }
      analyser?.disconnect();
      audioContext?.close();
    };
  }, [showSettings, devicePreferences]);

  return (
    <div className="flex flex-col items-center justify-center py-4">
       <Dialog open={showSettings} onOpenChange={setShowSettings}>
         <div className="w-full flex justify-end mb-3 items-center gap-2">
            {isSaved && <span className="text-xs text-emerald-500/70 flex items-center gap-1"><Check className="w-3 h-3" /> Stored</span>}
           <DialogTrigger asChild>
             <Button variant="ghost" size="sm" className="gap-2 text-[11px] uppercase tracking-[0.18em]">
               <Settings className="w-4 h-4" />
               Settings
             </Button>
           </DialogTrigger>
         </div>
         <DialogContent className="max-w-xl">
           <DialogHeader>
             <DialogTitle>Device Manager</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
               <div>
                 <p className="text-xs uppercase text-slate-500 mb-1">Microphone</p>
                 <Select
                   value={devicePreferences.microphoneId || undefined}
                   onValueChange={(val) => updateDevicePreference('audioinput', val)}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Select microphone" />
                   </SelectTrigger>
                   <SelectContent>
                     {devices.microphones.map((mic) => (
                       <SelectItem key={mic.deviceId} value={mic.deviceId}>
                         {mic.label || 'Mic'}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <p className="text-xs uppercase text-slate-500 mb-1">Speaker</p>
                 <Select
                   value={devicePreferences.speakerId || undefined}
                   onValueChange={(val) => updateDevicePreference('audiooutput', val)}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Select output" />
                   </SelectTrigger>
                   <SelectContent>
                     {devices.speakers.map((spk) => (
                       <SelectItem key={spk.deviceId} value={spk.deviceId}>
                         {spk.label || 'Speaker'}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </div>

             <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
               {[{ key: 'noiseSuppression', label: 'Noise Suppression' }, { key: 'echoCancellation', label: 'Echo Cancellation' }, { key: 'highPassFilter', label: 'High-Pass Filter' }].map((item) => (
                 <div key={item.key} className="flex items-center justify-between rounded border border-slate-800 px-3 py-2">
                   <div>
                     <p className="text-xs font-semibold text-slate-200">{item.label}</p>
                     <p className="text-[11px] text-slate-500">{item.key === 'highPassFilter' ? 'Filter engine rumble' : 'Improve clarity'}</p>
                   </div>
                   <Switch
                     checked={devicePreferences[item.key]}
                     onCheckedChange={(checked) => updateProcessingPreference(item.key, checked)}
                   />
                 </div>
               ))}
             </div>

             <div className="rounded border border-slate-800 bg-slate-950/60 p-3 space-y-2">
               <div className="flex items-center justify-between text-xs uppercase text-slate-400">
                 <span>Mic Test</span>
                 <span className={cn('font-semibold', vadHot ? 'text-emerald-400' : 'text-slate-500')}>
                   {Math.round(vadLevel * 100)}%
                 </span>
               </div>
               <Progress value={Math.min(100, Math.round(vadLevel * 100))} className={vadHot ? 'bg-emerald-900/40' : ''} />
               <div className="pt-2">
                 <div className="flex items-center justify-between text-[11px] uppercase text-slate-500">
                   <span>VAD Threshold</span>
                   <span>{Math.round(vadThreshold * 100)}%</span>
                 </div>
                 <RangeSlider
                   value={[vadThreshold]}
                   min={0}
                   max={1}
                   step={0.05}
                   onValueChange={(vals) => setVadThreshold(vals[0])}
                 />
                 <p className="text-[11px] text-slate-500 mt-2">
                   Keep the bar below the threshold at idle. If it spikes while quiet, raise the bar to avoid heavy breathing or cockpit hum.
                 </p>
               </div>
             </div>
           </div>
         </DialogContent>
       </Dialog>

       {/* CODEX Phase 3.3: Physical "PUSH-BUTTON" style PTT Control */}
       <div className="w-full mb-4 p-4 border border-zinc-800 bg-zinc-950/50 backdrop-blur">
          <div className="flex items-center justify-between mb-2">
             <span className="label-plate px-2 py-1 text-[10px]">MIC CONTROL</span>
             <div className={cn(
                "px-3 py-1 font-black text-xs tracking-widest transition-all",
                pttButtonState === 'VOX_ACTIVE' 
                   ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500" 
                   : pttButtonState === 'MUTED' 
                      ? "bg-red-500/20 text-red-400 border-2 border-red-500" 
                      : "bg-orange-500/20 text-orange-400 border-2 border-orange-500"
             )}>
                {pttButtonState === 'VOX_ACTIVE' && '● VOX ACTIVE'}
                {pttButtonState === 'MUTED' && '⊘ MUTED'}
                {pttButtonState === 'STANDBY' && '○ STANDBY'}
             </div>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
             {mode === 'PTT' 
                ? "Push-to-talk mode: Hold [SPACE] to transmit" 
                : "Open mic mode: Always broadcasting when unmuted"}
          </div>
       </div>

       <div className="relative w-40 h-40 flex items-center justify-center select-none">
          
          {/* Status Ring */}
          <div className={cn(
             "absolute inset-0 rounded-full border-[6px] transition-all duration-500",
             isMuted ? "border-zinc-800 opacity-30" : 
             isTransmitting ? "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]" :
             mode === 'PTT' ? "border-orange-500/30" : "border-emerald-500/30"
          )} />

          {/* Mode Toggle Button */}
          <button
             onClick={handleModeChange}
             className={cn(
                "absolute -top-3 px-3 py-0.5 rounded-full border bg-zinc-950 text-[10px] font-black tracking-widest transition-all z-10 hover:scale-105 flex items-center gap-2",
                mode === 'PTT' ? "border-orange-900 text-orange-500 hover:border-orange-500" : "border-emerald-900 text-emerald-500 hover:border-emerald-500"
             )}
          >
             {mode === 'PTT' ? <Radio className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
             {mode}
          </button>

          {/* Center Button */}
          <button
             onClick={handleMuteToggle}
             className={cn(
                "w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-200 z-0 group active:scale-95 border-4",
                isMuted 
                   ? "bg-zinc-900/80 border-zinc-800 text-zinc-600" 
                   : "bg-zinc-900 border-zinc-700 text-white hover:border-zinc-500"
             )}
          >
             {isMuted ? (
                <MicOff className="w-8 h-8 mb-1 opacity-50" />
             ) : (
                <Mic className={cn("w-8 h-8 mb-1", isTransmitting ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "")} />
             )}
             <span className={cn("text-[9px] font-black uppercase tracking-widest", isMuted ? "opacity-50" : "")}>
                {isMuted ? "MUTED" : isTransmitting ? "ON AIR" : "READY"}
             </span>
          </button>
          
          {/* PTT Instruction */}
          <div className="absolute -bottom-8 text-center w-full">
             {mode === 'PTT' && !isMuted && (
                <span className={cn("text-[9px] font-mono uppercase tracking-wider", isTransmitting ? "text-emerald-500 font-bold" : "text-zinc-600")}>
                   {isTransmitting ? "TRANSMITTING" : "HOLD [SPACE]"}
                </span>
             )}
          </div>
       </div>
    </div>
  );
}