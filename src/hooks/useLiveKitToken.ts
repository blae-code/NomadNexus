import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type UseLiveKitTokenResult = {
  token: string | null;
  error: string | null;
  isLoading: boolean;
};

export const useLiveKitToken = (roomName: string | null, participantName: string | null, identity?: string, role?: string): UseLiveKitTokenResult => {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchToken = async () => {
      if (!roomName || !participantName || !supabase) return;
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke('livekit-token', {
          body: {
            roomName,
            participantName,
            identity: identity || participantName,
            role: role || 'Scout',
          },
        });

        if (fnError) throw fnError;

        if (data?.token) {
          setToken(data.token);
          console.log('[NomadLink] Secure Uplink Established.');
        } else {
          throw new Error('Token missing in response');
        }
      } catch (err: any) {
        console.error('Failed to fetch LiveKit token', err);
        setError(err?.message || 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, [roomName, participantName, identity, role]);

  return { token, error, isLoading };
};

export default useLiveKitToken;
