import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

const PROJECT_URL = Deno.env.get('PROJECT_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';

if (!PROJECT_URL || !SERVICE_ROLE_KEY) {
  console.error('Supabase environment variables PROJECT_URL or SERVICE_ROLE_KEY are missing.');
}

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY);

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

type PushSubscriptionPayload = {
  userId?: string;
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const { userId, endpoint, keys } = (await req.json()) as PushSubscriptionPayload;

    if (!userId || !endpoint || !keys?.p256dh || !keys?.auth) {
      return jsonResponse({ error: 'userId, endpoint, and keys are required' }, 400);
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      { onConflict: 'endpoint' },
    );

    if (error) throw error;

    return jsonResponse({ status: 'SUBSCRIBED' });
  } catch (error) {
    console.error('push-subscribe error', error);
    return jsonResponse({ error: 'Internal Server Error' }, 500);
  }
});
