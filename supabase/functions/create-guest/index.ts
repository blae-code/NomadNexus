import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

const PROJECT_URL = Deno.env.get('PROJECT_URL') ?? Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON_KEY =
  Deno.env.get('ANON_KEY') ??
  Deno.env.get('SUPABASE_ANON_KEY') ?? // fallback for local dev
  '';
const GUEST_DOMAIN = Deno.env.get('GUEST_DOMAIN') ?? 'guest.nomad.redscar.dev';

const adminClient = PROJECT_URL && SERVICE_ROLE_KEY ? createClient(PROJECT_URL, SERVICE_ROLE_KEY) : null;
const anonClient = PROJECT_URL && ANON_KEY ? createClient(PROJECT_URL, ANON_KEY) : null;

const randomString = (len = 24) => crypto.randomUUID().replace(/-/g, '').slice(0, len);
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!adminClient || !anonClient) {
    return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500, headers: corsHeaders });
  }

  try {
    const { callsign, rsi_handle, provisional_only } = await req.json().catch(() => ({ callsign: null }));
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const safeCallsign = (callsign || 'guest').toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'guest';
    const safeRsi = typeof rsi_handle === 'string' ? rsi_handle.trim() : '';
    const email = `guest+${randomString(8)}@${GUEST_DOMAIN}`;
    const password = randomString(32);

    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        callsign: safeCallsign,
        is_guest: true,
        guest_expires_at: expiresAt,
        rsi_handle: safeRsi,
        provisional_only: !!provisional_only,
      },
    });

    if (createError || !userData?.user) {
      throw new Error(createError?.message || 'Failed to create guest');
    }

    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert(
        {
          id: userData.user.id,
          is_guest: true,
          guest_expires_at: expiresAt,
          callsign: safeCallsign,
          rsi_handle: safeRsi || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (profileError) throw profileError;

    const { data: sessionData, error: signinError } = await anonClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signinError || !sessionData?.session) {
      throw new Error(signinError?.message || 'Failed to establish guest session');
    }

    return new Response(
      JSON.stringify({
        ok: true,
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_at: sessionData.session.expires_at,
        guest: { email, callsign: safeCallsign, rsi_handle: safeRsi, provisional_only: !!provisional_only, guest_expires_at: expiresAt },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('create-guest failed', err);
    return new Response(JSON.stringify({ error: err?.message || 'create-guest failed' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
