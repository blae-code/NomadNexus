
/**
 * POST /api/handle-rescue-request
 * Body: { flareId?: string, netCode?: string }
 * Auth required; only Scout+ can raise medical flares.
 * Notifies all rescue/medic users via Web Push.
 *
 * Example frontend call:
 * await supabase.functions.invoke('handle-rescue-request', { body: { flareId, netCode } });
 */
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import webPush from "web-push";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("PROJECT_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";
const VAPID_PUBLIC_KEY = Deno.env.get("NEXT_PUBLIC_VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

const REQUIRED_ENVS = [
  ["SUPABASE_URL", SUPABASE_URL],
  ["SERVICE_ROLE_KEY", SERVICE_ROLE_KEY],
  ["VAPID_PUBLIC_KEY", VAPID_PUBLIC_KEY],
  ["VAPID_PRIVATE_KEY", VAPID_PRIVATE_KEY],
];

const RATE_LIMIT_WINDOW_MS = 15000; // 15s per user
const rateLimitMap = new Map<string, number>();

webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

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

const isScoutOrAbove = (rank?: string | null) => {
  const ladder = ["vagrant", "scout", "voyager", "founder", "pioneer"];
  const idx = ladder.indexOf((rank || "").toLowerCase());
  return idx >= 1;
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

  let body: { flareId?: string; netCode?: string };
  try {
    body = await req.json();
  } catch (err) {
    console.error("Invalid JSON", err);
    return json(400, { error: "BAD_REQUEST", details: "Invalid JSON" });
  }

  const supabase = getClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) return json(401, { error: "UNAUTHENTICATED" });

  const userId = authData.user.id;
  // Rate limit per user
  const now = Date.now();
  const last = rateLimitMap.get(userId) || 0;
  if (now - last < RATE_LIMIT_WINDOW_MS) {
    return json(429, { error: "RATE_LIMITED", details: "Try again soon." });
  }
  rateLimitMap.set(userId, now);

  // RBAC: must be Scout+
  const { data: profile, error: profileError } = await supabase.from("profiles").select("rank, roles").eq("id", userId).maybeSingle();
  if (profileError || !profile) return json(403, { error: "FORBIDDEN", details: "Profile not found" });
  if (!isScoutOrAbove(profile.rank)) return json(403, { error: "FORBIDDEN", details: "Insufficient rank" });

  // Find all rescue-capable users
  const { data: responders, error: profilesError } = await supabase
    .from("profiles")
    .select("id")
    .or("roles.cs.@.Rescue,roles.cs.@.Medic");
  if (profilesError) throw profilesError;
  const responderIds = (responders || []).map((r: any) => r.id);
  if (!responderIds.length) return json(200, { status: "NO_RESPONDERS" });

  // Get push subscriptions
  const { data: subs, error: subsError } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_id")
    .in("user_id", responderIds);
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
          title: "CRITICAL ALERT: NOMAD DOWN",
          body: "Medical distress signal detected in sector.",
          icon: "/icons/medical_flare.png",
          badge: "/icons/badge_redscar.png",
          data: { url: `/nexus/map?focus=${body.flareId || body.netCode || "unknown"}` },
        })
      );
      notified += 1;
    } catch (err: any) {
      const statusCode = err?.statusCode || err?.status;
      console.error("Push send error", statusCode, err?.message || err);
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    }
  }

  return json(200, { status: "FLARE_LAUNCHED", respondersNotified: notified });
});
