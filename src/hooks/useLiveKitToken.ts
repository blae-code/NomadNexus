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
    console.log('[useLiveKitToken] Hook called with:', { roomName, participantName, identity, role });
    const fetchToken = async () => {
      if (!roomName || !participantName || !supabase) {
        console.log('[useLiveKitToken] Skipping fetch:', { hasRoom: !!roomName, hasParticipant: !!participantName, hasSupabase: !!supabase });
        return;
      }
      
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('[useLiveKitToken] No active session - user must be logged in');
        setError('No active session');
        return;
      }
      console.log('[useLiveKitToken] Session found for user:', session.user.email);
      
      setIsLoading(true);
      setError(null);

      try {
        console.log('[useLiveKitToken] Invoking livekit-token function...');
        
        // Manual fetch to get more error details
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/livekit-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            roomName,
            participantName,
            identity: identity || participantName,
            role: role || 'Scout',
          }),
        });

        console.log('[useLiveKitToken] Response status:', response.status, response.statusText);
        
        const responseText = await response.text();
        console.log('[useLiveKitToken] Response body:', responseText);
        
        if (!response.ok) {
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = { message: responseText };
          }
          throw new Error(`Function returned ${response.status}: ${JSON.stringify(errorData)}`);
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseErr) {
          console.error('[useLiveKitToken] Failed to parse response as JSON:', { responseText, error: parseErr.message });
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
        }
        
        console.log('[useLiveKitToken] Parsed data:', { 
          keys: Object.keys(data),
          data,
          tokenType: typeof data?.token,
          tokenValue: data?.token,
          serverUrlType: typeof data?.serverUrl,
          serverUrlValue: data?.serverUrl
        });

        if (!data?.token) {
          console.error('[useLiveKitToken] Token missing in response!', { 
            data,
            responseText: responseText.substring(0, 200)
          });
          throw new Error(`Token missing in response: ${JSON.stringify(data)}`);
        }

        if (typeof data.token !== 'string') {
          console.error('[useLiveKitToken] Token is not a string!', { 
            tokenType: typeof data.token,
            tokenValue: data.token
          });
          throw new Error(`Token must be a string, got ${typeof data.token}: ${JSON.stringify(data.token)}`);
        }

        console.log('[useLiveKitToken] Token response:', { 
          hasToken: !!data.token, 
          tokenLength: data.token.length,
          tokenIsString: typeof data.token === 'string',
          tokenPrefix: data.token.substring(0, 20),
          serverUrl: data.serverUrl,
          url: data.url,
          livekitUrl: data.livekitUrl,
          fallbackUrl: import.meta.env?.VITE_LIVEKIT_URL
        });

        setToken(data.token);
        const suppliedUrl = data.serverUrl || data.url || data.livekitUrl;
        const fallbackUrl = import.meta.env?.VITE_LIVEKIT_URL || null;
        const finalUrl = suppliedUrl || fallbackUrl;
        setServerUrl(finalUrl);
        console.log('[useLiveKitToken] Secure Uplink Established. Using serverUrl:', finalUrl);
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
