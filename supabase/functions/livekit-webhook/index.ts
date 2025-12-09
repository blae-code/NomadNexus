/**
 * LiveKit Webhook Edge Function
 * Handles POST events from LiveKit for room/participant presence mirroring.
 *
 * Example LiveKit webhook config:
 *
 *   webhook_urls:
 *     - url: https://your-supabase-project/functions/v1/livekit-webhook
 *       secret: $LIVEKIT_WEBHOOK_SECRET
 *
 * Sample payload:
 * {
 *   "event": "participant_joined",
 *   "room": "campfire-alpha",
 *   "participant": {
 *     "identity": "user-123",
 *     "metadata": "{\"userId\":\"uuid-abc\",\"role\":\"Scout\"}"
 *   },
 *   "timestamp": 1702050000
 * }
 *
 * Frontend presence visualizations may use either LiveKit live data or this mirrored table.
 */
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("PROJECT_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";
const LIVEKIT_WEBHOOK_SECRET = Deno.env.get("LIVEKIT_WEBHOOK_SECRET") || "";

const REQUIRED_ENVS = [
  ["SUPABASE_URL", SUPABASE_URL],
  ["SERVICE_ROLE_KEY", SERVICE_ROLE_KEY],
  ["LIVEKIT_WEBHOOK_SECRET", LIVEKIT_WEBHOOK_SECRET],
];

const json = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });

const getClient = () => createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const ensureVoicePresenceTable = async (supabase: any) => {
  const ddl = `
    create table if not exists public.voice_presence (
      id uuid primary key default gen_random_uuid(),
      room_name text not null,
      participant_identity text not null,
      user_id uuid,
      joined_at timestamptz not null,
      left_at timestamptz,
      active boolean not null default true,
      unique(room_name, participant_identity)
    );
    alter table public.voice_presence enable row level security;
    do $$ begin
      if not exists (select 1 from pg_policies where tablename = 'voice_presence' and policyname = 'voice_presence_service_role_all') then
        create policy "voice_presence_service_role_all" on public.voice_presence
          for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
      end if;
    end $$;
  `;
  const { error } = await supabase.rpc("exec_sql", { sql: ddl });
  if (error) {
    console.warn("voice_presence ensure failed (exec_sql missing?)", error.message);
  }
};

const verifySignature = async (req: Request, secret: string): Promise<boolean> => {
  // LiveKit sends X-Livekit-Signature: HMAC_SHA256_HEX
  const sig = req.headers.get("x-livekit-signature") || req.headers.get("X-Livekit-Signature");
  if (!sig) return false;
  const body = await req.text();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const hex = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
  // LiveKit sends hex lowercase
  return sig === hex;
};

serve(async (req: Request) => {
  const missing = REQUIRED_ENVS.filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    console.error("Missing envs", missing.join(","));
    return json(500, { error: "INTERNAL_SERVER_ERROR" });
  }

  if (req.method !== "POST") return json(405, { error: "METHOD_NOT_ALLOWED" });

  // Signature verification
  const validSig = await verifySignature(req.clone(), LIVEKIT_WEBHOOK_SECRET);
  if (!validSig) return json(401, { error: "INVALID_SIGNATURE" });

  let event: any;
  try {
    event = await req.json();
  } catch (err) {
    console.error("Invalid JSON", err);
    return json(400, { error: "BAD_REQUEST", details: "Invalid JSON" });
  }

  const supabase = getClient();
  // Ensure table exists
  await ensureVoicePresenceTable(supabase);

  const { event: eventType, room, participant } = event;
  const roomName = event.room || event.room_name || room;
  const identity = participant?.identity || event.participant_identity;
  let userId: string | null = null;
  if (participant?.metadata) {
    try {
      const meta = JSON.parse(participant.metadata);
      userId = meta.userId || null;
    } catch {}
  }

  if (eventType === "participant_joined") {
    // Upsert presence
    const { error } = await supabase.from("voice_presence").upsert({
      room_name: roomName,
      participant_identity: identity,
      user_id: userId,
      joined_at: new Date().toISOString(),
      left_at: null,
      active: true,
    }, { onConflict: "room_name,participant_identity" });
    if (error?.message?.includes("relation")) {
      await ensureVoicePresenceTable(supabase);
      await supabase.from("voice_presence").upsert({
        room_name: roomName,
        participant_identity: identity,
        user_id: userId,
        joined_at: new Date().toISOString(),
        left_at: null,
        active: true,
      }, { onConflict: "room_name,participant_identity" });
    }
  } else if (eventType === "participant_left") {
    // Mark left
    await supabase.from("voice_presence").update({
      left_at: new Date().toISOString(),
      active: false,
    }).eq("room_name", roomName).eq("participant_identity", identity);
  } else if (eventType === "room_finished") {
    // Mark all as left
    await supabase.from("voice_presence").update({
      left_at: new Date().toISOString(),
      active: false,
    }).eq("room_name", roomName).is("left_at", null);
  }

  return json(200, { ok: true });
});
