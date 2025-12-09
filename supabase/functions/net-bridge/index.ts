/**
 * POST /api/net-bridge
 * Body: { sourceNetId: string, targetNetId: string, action: 'link' | 'unlink' }
 * Auth required; only Founder+ (or Pioneer) can link/unlink nets.
 *
 * Example frontend calls:
 * // Create bridge
 * await supabase.functions.invoke('net-bridge', {
 *   body: { sourceNetId: '<uuid>', targetNetId: '<uuid>', action: 'link' }
 * });
 *
 * // Remove bridge
 * await supabase.functions.invoke('net-bridge', {
 *   body: { sourceNetId: '<uuid>', targetNetId: '<uuid>', action: 'unlink' }
 * });
 *
 * // Subscribe to bridge updates (frontend)
 * supabase
 *   .channel('voice_net_bridges')
 *   .on('postgres_changes', { event: '*', schema: 'public', table: 'voice_net_bridges' }, (payload) => {
 *     console.log('Bridge changed:', payload);
 *   })
 *   .subscribe();
 *
 * Note: This function manages metadata only; actual audio bridging is client-side logic (multi-room join or agent mixing).
 */
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("PROJECT_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";

const REQUIRED_ENVS = [
  ["SUPABASE_URL", SUPABASE_URL],
  ["SERVICE_ROLE_KEY", SERVICE_ROLE_KEY],
];

const json = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });

const parseCookies = (cookieHeader: string | null) => {
  if (!cookieHeader) return {} as Record<string, string>;
  return Object.fromEntries(
    cookieHeader.split(";").map((pair) => {
      const [key, ...rest] = pair.split("=");
      return [key?.trim(), decodeURIComponent(rest.join("=") || "")];
    }),
  );
};

const getAuthToken = (req: Request): string | null => {
  const header = req.headers.get("Authorization") || req.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  const cookies = parseCookies(req.headers.get("cookie"));
  return cookies["sb-access-token"] || cookies["supabase-auth-token"] || null;
};

const getClient = () => createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const isFounderOrAbove = (rank?: string | null) => {
  const ladder = ["vagrant", "scout", "voyager", "founder", "pioneer"];
  const idx = ladder.indexOf((rank || "").toLowerCase());
  return idx >= 3; // founder or pioneer
};

const ensureVoiceNetBridgesTable = async (supabase: any) => {
  const ddl = `
    create table if not exists public.voice_net_bridges (
      id uuid primary key default gen_random_uuid(),
      source_net_id uuid not null references public.voice_nets(id) on delete cascade,
      target_net_id uuid not null references public.voice_nets(id) on delete cascade,
      created_by uuid references public.profiles(id),
      created_at timestamptz default now(),
      unique(source_net_id, target_net_id)
    );
    alter table public.voice_net_bridges enable row level security;
    do $$ begin
      if not exists (select 1 from pg_policies where tablename = 'voice_net_bridges' and policyname = 'voice_net_bridges_service_role_all') then
        create policy "voice_net_bridges_service_role_all" on public.voice_net_bridges
          for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
      end if;
      if not exists (select 1 from pg_policies where tablename = 'voice_net_bridges' and policyname = 'voice_net_bridges_auth_select') then
        create policy "voice_net_bridges_auth_select" on public.voice_net_bridges
          for select using (auth.role() = 'authenticated');
      end if;
    end $$;
  `;
  const { error } = await supabase.rpc("exec_sql", { sql: ddl });
  if (error) {
    console.warn("voice_net_bridges ensure failed (exec_sql missing?)", error.message);
  }
};

serve(async (req: Request) => {
  const missing = REQUIRED_ENVS.filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    console.error("Missing envs", missing.join(","));
    return json(500, { error: "INTERNAL_SERVER_ERROR" });
  }

  if (req.method !== "POST") return json(405, { error: "METHOD_NOT_ALLOWED" });

  const token = getAuthToken(req);
  if (!token) return json(401, { error: "UNAUTHENTICATED" });

  let body: { sourceNetId?: string; targetNetId?: string; action?: string };
  try {
    body = await req.json();
  } catch (err) {
    console.error("Invalid JSON", err);
    return json(400, { error: "BAD_REQUEST", details: "Invalid JSON" });
  }

  const { sourceNetId, targetNetId, action } = body;
  if (!sourceNetId || !targetNetId || !action) {
    return json(400, { error: "BAD_REQUEST", details: "sourceNetId, targetNetId, and action are required" });
  }
  if (action !== "link" && action !== "unlink") {
    return json(400, { error: "BAD_REQUEST", details: "action must be 'link' or 'unlink'" });
  }

  const supabase = getClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) return json(401, { error: "UNAUTHENTICATED" });

  const userId = authData.user.id;
  const { data: profile, error: profileError } = await supabase.from("profiles").select("rank, roles").eq("id", userId).maybeSingle();
  if (profileError || !profile) return json(403, { error: "FORBIDDEN", details: "Profile not found" });
  if (!isFounderOrAbove(profile.rank)) return json(403, { error: "FORBIDDEN", details: "Founder+ required" });

  // Ensure table exists
  await ensureVoiceNetBridgesTable(supabase);

  if (action === "link") {
    // Validate both nets exist
    const { data: sourceNet, error: sourceError } = await supabase.from("voice_nets").select("id, type").eq("id", sourceNetId).maybeSingle();
    const { data: targetNet, error: targetError } = await supabase.from("voice_nets").select("id, type").eq("id", targetNetId).maybeSingle();
    if (sourceError || !sourceNet) return json(400, { error: "BAD_REQUEST", details: "Source net not found" });
    if (targetError || !targetNet) return json(400, { error: "BAD_REQUEST", details: "Target net not found" });

    // Insert bridge
    const { data: bridge, error: insertError } = await supabase
      .from("voice_net_bridges")
      .upsert({ source_net_id: sourceNetId, target_net_id: targetNetId, created_by: userId }, { onConflict: "source_net_id,target_net_id" })
      .select()
      .single();

    if (insertError?.message?.includes("relation")) {
      await ensureVoiceNetBridgesTable(supabase);
      const retry = await supabase
        .from("voice_net_bridges")
        .upsert({ source_net_id: sourceNetId, target_net_id: targetNetId, created_by: userId }, { onConflict: "source_net_id,target_net_id" })
        .select()
        .single();
      if (retry.error) throw retry.error;
      return json(200, { bridge: retry.data });
    }
    if (insertError) throw insertError;
    return json(200, { bridge });
  } else if (action === "unlink") {
    // Delete bridge
    const { data, error: deleteError } = await supabase
      .from("voice_net_bridges")
      .delete()
      .eq("source_net_id", sourceNetId)
      .eq("target_net_id", targetNetId)
      .select();
    if (deleteError) throw deleteError;
    return json(200, { deleted: !!data?.length });
  }

  return json(400, { error: "BAD_REQUEST" });
});
