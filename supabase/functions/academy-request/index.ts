/**
 * POST /api/academy/request
 * Body: { skillId: string, cadetId?: string }
 * Derives cadetId from authenticated user when omitted.
 * Response: { requestId: string, status: 'PENDING' }
 *
 * Example frontend call:
 * await supabase.functions.invoke('academy-request', { body: { skillId: '<uuid>' } });
 */
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("PROJECT_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";

const REQUIRED_ENVS = [
  ["SUPABASE_URL", SUPABASE_URL],
  ["SERVICE_ROLE_KEY", SERVICE_ROLE_KEY],
];

type RequestBody = { skillId?: string; cadetId?: string };

type Profile = { id: string; rank?: string | null; roles?: string[] | null };

type Skill = { id: string; name?: string | null };

type Certification = { user_id: string };

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

const getProfile = async (supabase: SupabaseClient, userId: string) => {
  const { data, error } = await supabase.from("profiles").select("id, rank, roles").eq("id", userId).maybeSingle();
  return { profile: data as Profile | null, error };
};

const ensureNotificationQueueTable = async (supabase: SupabaseClient) => {
  const ddl = `
    create table if not exists public.notification_queue (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null,
      payload jsonb not null,
      status text default 'PENDING',
      created_at timestamptz default now()
    );
    alter table public.notification_queue enable row level security;
    do $$ begin
      if not exists (select 1 from pg_policies where tablename = 'notification_queue' and policyname = 'notification_queue_service_role_all') then
        create policy "notification_queue_service_role_all" on public.notification_queue
          for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
      end if;
    end $$;
  `;
  const { error } = await supabase.rpc("exec_sql", { sql: ddl });
  if (error) {
    console.warn("notification_queue ensure failed (exec_sql missing?)", error.message);
  }
};

const insertNotifications = async (supabase: SupabaseClient, userIds: string[], payload: Record<string, unknown>) => {
  if (!userIds.length) return;
  const { error } = await supabase.from("notification_queue").insert(
    userIds.map((id) => ({ user_id: id, payload }))
  );
  if (error?.message?.includes("relation")) {
    await ensureNotificationQueueTable(supabase);
    const retry = await supabase.from("notification_queue").insert(userIds.map((id) => ({ user_id: id, payload })));
    if (retry.error) throw retry.error;
    return;
  }
  if (error) throw error;
};

const isBrigged = (profile?: Profile | null) => {
  const roles = profile?.roles || [];
  return roles.includes("brigged") || roles.includes("brig");
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

  let body: RequestBody;
  try {
    body = await req.json();
  } catch (err) {
    console.error("Invalid JSON", err);
    return json(400, { error: "BAD_REQUEST", details: "Invalid JSON" });
  }

  const { skillId, cadetId: cadetIdInput } = body;
  if (!skillId) return json(400, { error: "BAD_REQUEST", details: "skillId is required" });

  const supabase = getClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) return json(401, { error: "UNAUTHENTICATED" });

  const cadetId = cadetIdInput || authData.user.id;
  if (cadetId !== authData.user.id) return json(403, { error: "FORBIDDEN", details: "Cannot create requests for other users." });

  const { profile, error: profileError } = await getProfile(supabase, cadetId);
  if (profileError || !profile) return json(403, { error: "FORBIDDEN", details: "Profile not found" });
  if (isBrigged(profile)) return json(403, { error: "FORBIDDEN", details: "User is brigged" });

  const { data: skillRow, error: skillError } = await supabase.from("skills").select("id, name").eq("id", skillId).maybeSingle();
  if (skillError || !skillRow) return json(400, { error: "BAD_REQUEST", details: "Invalid skillId" });

  try {
    const { data: insertRows, error: insertError } = await supabase
      .from("instruction_requests")
      .insert({ skill_id: skillId, cadet_id: cadetId, status: "PENDING" })
      .select("id")
      .single();
    if (insertError) throw insertError;

    const { data: certs, error: certError } = await supabase
      .from("certifications")
      .select("user_id")
      .eq("skill_id", skillId);
    if (certError) throw certError;

    const mentorIds = (certs as Certification[] | null)?.map((c) => c.user_id) || [];
    if (mentorIds.length) {
      const payload = {
        type: "academy_request",
        title: "Academy Request",
        message: `ALERT: Cadet requesting instruction in ${skillRow.name || "requested skill"}.`,
        skillId,
        cadetId,
        requestId: insertRows.id,
      };
      await insertNotifications(supabase, mentorIds, payload);
    }

    return json(200, { requestId: insertRows.id, status: "PENDING" });
  } catch (err: any) {
    console.error("academy-request error", err?.message || err);
    return json(500, { error: "INTERNAL_SERVER_ERROR" });
  }
});
