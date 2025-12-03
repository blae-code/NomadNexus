import React, { useState } from 'react';
import { useLiveKit, AUDIO_STATE } from '@/hooks/useLiveKit';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils'; // Make sure cn is imported for class merging

const CommsControlPanel = () => {
  const { audioState, setMicrophoneEnabled } = useLiveKit();
  const isMuted = audioState === AUDIO_STATE.CONNECTED_MUTED;
  const isOpen = audioState === AUDIO_STATE.CONNECTED_OPEN;
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecordingPermissions, setHasRecordingPermissions] = useState(true); // Simulate for now

  const toggleRoomRecording = () => {
    setIsRecording(prev => !prev);
    console.log(`Room recording ${isRecording ? 'stopped' : 'started'}.`);
    // In a real app, this would call a backend function:
    // supabaseApi.functions.invoke('toggleRoomRecording', { roomId: 'currentRoomId', start: !isRecording });
  };

  return (
    <div className="flex items-center justify-center p-4 bg-gunmetal border-t border-burnt-orange">
      <div className="grid grid-cols-4 gap-4 w-full max-w-lg">
        {/* PTT Button */}
        <Button
          className={`
            col-span-1 text-lg font-bold text-tech-white bg-transparent border border-burnt-orange
            hover:bg-burnt-orange hover:text-gunmetal
            active:bg-burnt-orange active:text-gunmetal
            ${isOpen ? 'bg-burnt-orange text-gunmetal' : ''}
          `}
        >
          PUSH TO TRANSMIT
        </Button>

        {/* VOX Toggle */}
        <div className="col-span-1 flex items-center justify-center">
          <Switch
            checked={isOpen}
            onCheckedChange={(checked) => setMicrophoneEnabled(checked)}
            id="vox-switch"
          />
          <Label htmlFor="vox-switch" className="ml-2 text-tech-white font-bold">
            VOX: {isOpen ? 'ON' : 'OFF'}
          </Label>
        </div>

        {/* Kill Switch Button */}
        <Button
          onClick={() => setMicrophoneEnabled(false)}
          className="col-span-1 text-lg font-bold text-indicator-red bg-transparent border border-indicator-red hover:bg-indicator-red hover:text-gunmetal"
        >
          KILL SWITCH
        </Button>

        {/* REC Toggle Button */}
        {hasRecordingPermissions && (
          <Button
            onClick={toggleRoomRecording}
            className={cn(
              "col-span-1 text-lg font-bold bg-zinc-700 text-tech-white border",
              isRecording
                ? "bg-red-500 border-red-300 animate-pulse"
                : "border-zinc-500 hover:bg-zinc-600"
            )}
          >
            {isRecording ? (
              <span className="flex items-center overflow-hidden">
                <span className="animate-marquee whitespace-nowrap">TAPE RUNNING...</span>
              </span>
            ) : (
              "REC"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CommsControlPanel;
