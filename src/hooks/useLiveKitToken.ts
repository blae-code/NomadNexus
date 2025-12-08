import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type UseLiveKitTokenResult = {
  token: string | null;
  serverUrl: string | null;
  error: string | null;
  isLoading: boolean;
};

export const useLiveKitToken = (roomName: string | null, participantName: string | null, identity?: string, role?: string): UseLiveKitTokenResult => {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
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

        if (!data?.token) throw new Error('Token missing in response');

        setToken(data.token);
        const suppliedUrl = data.serverUrl || data.url || data.livekitUrl;
        const fallbackUrl = import.meta.env?.VITE_LIVEKIT_URL || null;
        setServerUrl(suppliedUrl || fallbackUrl);
        console.log('[NomadLink] Secure Uplink Established.');
      } catch (err: any) {
        console.error('Failed to fetch LiveKit token', err);
        setError(err?.message || 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, [roomName, participantName, identity, role]);

  return { token, serverUrl, error, isLoading };
};

export default useLiveKitToken;
