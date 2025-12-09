/**
 * POST /api/academy/accept
 * Body: { requestId: string, guideId?: string }
 * Resolves guideId from authenticated user when omitted.
 * Response: { simPodId: string, connectionTokens: { cadet: string, guide: string } }
 *
 * Example frontend call:
 * await supabase.functions.invoke('academy-accept', { body: { requestId: '<uuid>' } });
 */
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AccessToken } from "livekit-server-sdk";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("PROJECT_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";
const LIVEKIT_URL = Deno.env.get("LIVEKIT_URL") || "";
const LIVEKIT_API_KEY = Deno.env.get("LIVEKIT_API_KEY") || "";
const LIVEKIT_API_SECRET = Deno.env.get("LIVEKIT_API_SECRET") || "";

const REQUIRED_ENVS = [
  ["SUPABASE_URL", SUPABASE_URL],
  ["SERVICE_ROLE_KEY", SERVICE_ROLE_KEY],
  ["LIVEKIT_URL", LIVEKIT_URL],
  ["LIVEKIT_API_KEY", LIVEKIT_API_KEY],
  ["LIVEKIT_API_SECRET", LIVEKIT_API_SECRET],
];

type RequestBody = { requestId?: string; guideId?: string };

type InstructionRequest = { id: string; skill_id: string; cadet_id: string; status: string | null; guide_id?: string | null };

type Certification = { user_id: string };

type Profile = { id: string; rank?: string | null; roles?: string[] | null };

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

const fetchInstructionRequest = async (supabase: SupabaseClient, requestId: string) => {
  const { data, error } = await supabase
    .from("instruction_requests")
    .select("id, skill_id, cadet_id, status, guide_id")
    .eq("id", requestId)
    .maybeSingle();
  return { request: data as InstructionRequest | null, error };
};

const assertGuideCertified = async (supabase: SupabaseClient, guideId: string, skillId: string) => {
  const { data, error } = await supabase
    .from("certifications")
    .select("user_id")
    .eq("user_id", guideId)
    .eq("skill_id", skillId)
    .maybeSingle();
  return { certified: !!data, error };
};

const issueLiveKitToken = (params: { identity: string; name: string; roomName: string }) => {
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: params.identity,
    name: params.name,
    metadata: JSON.stringify({ userId: params.identity, role: "Academy", rank: "Academy" }),
  });
  at.addGrant({
    room: params.roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  return at.toJwt();
};

const generateSimPodId = () => `sim-pod-${crypto.randomUUID().slice(0, 8)}`;

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

  const { requestId, guideId: guideIdInput } = body;
  if (!requestId) return json(400, { error: "BAD_REQUEST", details: "requestId is required" });

  const supabase = getClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) return json(401, { error: "UNAUTHENTICATED" });

  const guideId = guideIdInput || authData.user.id;

  const { profile: guideProfile, error: guideProfileError } = await getProfile(supabase, guideId);
  if (guideProfileError || !guideProfile) return json(403, { error: "FORBIDDEN", details: "Guide profile not found" });
  if (isBrigged(guideProfile)) return json(403, { error: "FORBIDDEN", details: "Guide is brigged" });

  const { request, error: reqError } = await fetchInstructionRequest(supabase, requestId);
  if (reqError || !request) return json(400, { error: "BAD_REQUEST", details: "Request not found" });
  if (request.status && request.status !== "PENDING") return json(400, { error: "BAD_REQUEST", details: "Request not pending" });

  const { certified, error: certError } = await assertGuideCertified(supabase, guideId, request.skill_id);
  if (certError) return json(500, { error: "INTERNAL_SERVER_ERROR" });
  if (!certified) return json(403, { error: "FORBIDDEN", details: "Guide not certified for skill" });

  const simPodId = generateSimPodId();

  try {
    const { error: updateError } = await supabase
      .from("instruction_requests")
      .update({ status: "ACTIVE", guide_id: guideId, sim_pod_id: simPodId })
      .eq("id", requestId);
    if (updateError) throw updateError;

    const cadetToken = issueLiveKitToken({ identity: request.cadet_id, name: "Cadet", roomName: simPodId });
    const guideToken = issueLiveKitToken({ identity: guideId, name: "Guide", roomName: simPodId });

    return json(200, {
      simPodId,
      connectionTokens: {
        cadet: cadetToken,
        guide: guideToken,
      },
      serverUrl: LIVEKIT_URL,
    });
  } catch (err: any) {
    console.error("academy-accept error", err?.message || err);
    return json(500, { error: "INTERNAL_SERVER_ERROR" });
  }
});
