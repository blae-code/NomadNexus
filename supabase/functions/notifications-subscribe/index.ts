/**
 * POST /api/notifications/subscribe
 * Body: { endpoint: string, auth: string, p256dh: string }
 * Derives user_id from Supabase auth.
 * Upserts into push_subscriptions.
 * Response: { success: true }
 *
 * Example frontend call:
 * await supabase.functions.invoke('notifications-subscribe', { body: { endpoint, auth, p256dh } });
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

const ensurePushSubscriptionsTable = async (supabase: any) => {
  const ddl = `
    create table if not exists public.push_subscriptions (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null,
      endpoint text not null,
      auth text not null,
      p256dh text not null,
      created_at timestamptz default now(),
      unique(user_id, endpoint)
    );
    alter table public.push_subscriptions enable row level security;
    do $$ begin
      if not exists (select 1 from pg_policies where tablename = 'push_subscriptions' and policyname = 'push_subscriptions_service_role_all') then
        create policy "push_subscriptions_service_role_all" on public.push_subscriptions
          for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
      end if;
    end $$;
  `;
  const { error } = await supabase.rpc("exec_sql", { sql: ddl });
  if (error) {
    console.warn("push_subscriptions ensure failed (exec_sql missing?)", error.message);
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

  let body: { endpoint?: string; auth?: string; p256dh?: string };
  try {
    body = await req.json();
  } catch (err) {
    console.error("Invalid JSON", err);
    return json(400, { error: "BAD_REQUEST", details: "Invalid JSON" });
  }

  const { endpoint, auth, p256dh } = body;
  if (!endpoint || !auth || !p256dh) return json(400, { error: "BAD_REQUEST", details: "Missing fields" });

  const supabase = getClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) return json(401, { error: "UNAUTHENTICATED" });

  const user_id = authData.user.id;

  try {
    const { error } = await supabase.from("push_subscriptions").upsert({ user_id, endpoint, auth, p256dh }, { onConflict: "user_id,endpoint" });
    if (error?.message?.includes("relation")) {
      await ensurePushSubscriptionsTable(supabase);
      const retry = await supabase.from("push_subscriptions").upsert({ user_id, endpoint, auth, p256dh }, { onConflict: "user_id,endpoint" });
      if (retry.error) throw retry.error;
      return json(200, { success: true });
    }
    if (error) throw error;
    return json(200, { success: true });
  } catch (err: any) {
    console.error("notifications-subscribe error", err?.message || err);
    return json(500, { error: "INTERNAL_SERVER_ERROR" });
  }
});
