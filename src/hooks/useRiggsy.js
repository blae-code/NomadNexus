import { useEffect, useRef, useState } from 'react';
import { useLiveKit } from '@/hooks/useLiveKit';
import ShipVoice from '@/api/ShipVoice';

// Riggsy STT/TTS: ALT to trigger simulated transcript; hooks ready for Deepgram/Piper
export const useRiggsy = () => {
  const { publishData } = useLiveKit();
  const [listening, setListening] = useState(false);
  const voiceRef = useRef(null);

  useEffect(() => {
    voiceRef.current = new ShipVoice();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && !listening) {
        setListening(true);
        voiceRef.current?.announce('Riggsy online, say your command.', 1, 1);
        // TODO: integrate Deepgram streaming here; for now simulate
        setTimeout(() => {
          const simulated = 'Riggsy, pull up Stanton system.';
          handleTranscript(simulated);
          setListening(false);
        }, 2000);
      }
    };
    const handleKeyUp = () => setListening(false);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [listening]);

  const handleTranscript = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('stanton')) {
      publishData({ type: 'HOLO_ACTION', action: 'LOAD_SYSTEM', args: { system: 'Stanton' }, ts: Date.now() });
      voiceRef.current?.announce('Loading Stanton system.', 1, 0.9);
    } else if (lower.includes('hammerhead')) {
      publishData({ type: 'HOLO_ACTION', action: 'DEPLOY_ASSET', args: { asset: 'Hammerhead Wing' }, ts: Date.now() });
      voiceRef.current?.announce('Deploying Hammerhead wing.', 1, 0.9);
    } else {
      voiceRef.current?.announce("Command not recognized.", 1, 1);
    }
  };

  return { listening };
};
