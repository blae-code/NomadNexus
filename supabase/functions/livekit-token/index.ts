import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { AccessToken } from 'livekit-server-sdk';

const API_KEY = Deno.env.get('LIVEKIT_API_KEY') ?? '';
const API_SECRET = Deno.env.get('LIVEKIT_API_SECRET') ?? '';

if (!API_KEY || !API_SECRET) {
  console.error('LIVEKIT_API_KEY or LIVEKIT_API_SECRET missing in environment.');
}

serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const { roomName, participantName, identity, role } = await req.json();

    if (!roomName || !identity) {
      return new Response(JSON.stringify({ error: 'roomName and identity are required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const canPublish = role === 'Vagrant' ? false : true;

    const tokenBuilder = new AccessToken(API_KEY, API_SECRET, {
      identity,
      name: participantName || identity,
    });

    tokenBuilder.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish,
      canSubscribe: true,
    });

    const token = await tokenBuilder.toJwt();

    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating LiveKit token', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
});
