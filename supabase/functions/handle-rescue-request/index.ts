import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import webPush from 'web-push';

type RescuePayload = {
  type: 'MEDICAL' | 'COMBAT';
  location: string;
  senderId: string;
};

const PROJECT_URL = Deno.env.get('PROJECT_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com';

if (!PROJECT_URL || !SERVICE_ROLE_KEY) {
  console.error('PROJECT_URL or SERVICE_ROLE_KEY missing. Configure environment variables.');
}

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('VAPID keys missing. Configure VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.');
}

webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY);

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const { type, location, senderId } = (await req.json()) as Partial<RescuePayload>;

    if (!type || !location || !senderId) {
      return jsonResponse({ error: 'type, location, and senderId are required' }, 400);
    }

    // Insert flare record
    const { error: insertError } = await supabase
      .from('flares')
      .insert({ type, location, sender_id: senderId, status: 'ACTIVE' });
    if (insertError) throw insertError;

    // Determine target role
    const responderRole = type === 'MEDICAL' ? 'rescue' : 'ranger';

    // Fetch responders with matching role
    const { data: responders, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .contains('roles', [responderRole]);
    if (profilesError) throw profilesError;

    const responderIds = (responders || []).map((r) => r.id);
    if (responderIds.length === 0) {
      return jsonResponse({ status: 'FLARE_LAUNCHED', respondersNotified: 0 });
    }

    // Fetch push subscriptions for responders
    const { data: subs, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, user_id')
      .in('user_id', responderIds);
    if (subsError) throw subsError;

    let notified = 0;

    for (const sub of subs || []) {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title: `FLARE: ${type}`,
            body: `Location: ${location}`,
            data: { type, location },
          }),
        );
        notified += 1;
      } catch (err: any) {
        const statusCode = err?.statusCode || err?.status;
        console.error('Push send error', statusCode, err?.message || err);
        // Remove invalid subscriptions
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      }
    }

    return jsonResponse({ status: 'FLARE_LAUNCHED', respondersNotified: notified });
  } catch (error) {
    console.error('handle-rescue-request error', error);
    return jsonResponse({ error: 'Internal Server Error' }, 500);
  }
});
