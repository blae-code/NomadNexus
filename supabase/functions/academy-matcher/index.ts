import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import webPush from 'web-push';

type MatcherPayload = {
  skillId: string;
  cadetId: string;
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
    const { skillId, cadetId } = (await req.json()) as Partial<MatcherPayload>;

    if (!skillId || !cadetId) {
      return jsonResponse({ error: 'skillId and cadetId are required' }, 400);
    }

    // Insert instruction request
    const { error: insertError } = await supabase
      .from('instruction_requests')
      .insert({ skill_id: skillId, cadet_id: cadetId, status: 'PENDING' });
    if (insertError) throw insertError;

    // Fetch skill name for message
    const { data: skillRow, error: skillError } = await supabase
      .from('skills')
      .select('name')
      .eq('id', skillId)
      .maybeSingle();
    if (skillError) throw skillError;
    const skillName = skillRow?.name || 'Unknown Skill';

    // Find certified guides
    const { data: certs, error: certError } = await supabase
      .from('certifications')
      .select('user_id')
      .eq('skill_id', skillId);
    if (certError) throw certError;

    const guideIds = (certs || []).map((c) => c.user_id);
    if (guideIds.length === 0) {
      return jsonResponse({ success: true, guidesNotified: 0 });
    }

    // Fetch push subscriptions
    const { data: subs, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, user_id')
      .in('user_id', guideIds);
    if (subsError) throw subsError;

    let guidesNotified = 0;

    for (const sub of subs || []) {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title: `Academy Request: ${skillName}`,
            body: 'A Cadet is requesting mentorship. Click to accept.',
            data: { url: '/nexus/academy' },
          }),
        );
        guidesNotified += 1;
      } catch (err: any) {
        const statusCode = err?.statusCode || err?.status;
        console.error('Push send error', statusCode, err?.message || err);
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      }
    }

    return jsonResponse({ success: true, guidesNotified });
  } catch (error) {
    console.error('academy-matcher error', error);
    return jsonResponse({ error: 'Internal Server Error' }, 500);
  }
});
