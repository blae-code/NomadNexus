/**
 * Supabase Edge Function: livekit-token
 *
 * Request (POST application/json):
 * { roomName: string, participantName: string, identity?: string, role?: string }
 *
 * Example curl:
 * curl -i -X POST "$SUPABASE_URL/functions/v1/livekit-token" \
 *   -H "Authorization: Bearer $SUPABASE_JWT" \
 *   -H "Content-Type: application/json" \
 *   -d '{"roomName":"campfire-alpha","participantName":"Starfarer"}'
 *
 * Grant mapping (by rank):
 * - pioneer/founder/voyager/scout: join + publish + subscribe + publishData
 * - vagrant (or below min_tx): join + subscribe only (listen-only)
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@supabase/supabase-js";

const LIVEKIT_API_KEY = Deno.env.get("LIVEKIT_API_KEY") ?? "";
const LIVEKIT_API_SECRET = Deno.env.get("LIVEKIT_API_SECRET") ?? "";
const LIVEKIT_URL = Deno.env.get("LIVEKIT_URL") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_KEY") ?? "";

const REQUIRED_ENVS = [
	["LIVEKIT_API_KEY", LIVEKIT_API_KEY],
	["LIVEKIT_API_SECRET", LIVEKIT_API_SECRET],
	["LIVEKIT_URL", LIVEKIT_URL],
	["SUPABASE_URL", SUPABASE_URL],
	["SUPABASE_SERVICE_KEY", SUPABASE_SERVICE_KEY],
];

const RANK_ORDER = ["vagrant", "scout", "voyager", "founder", "pioneer"];

const jsonResponse = (status: number, payload: Record<string, unknown>) =>
	new Response(JSON.stringify(payload), {
		status,
		headers: { "Content-Type": "application/json" },
	});

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
	if (header?.toLowerCase().startsWith("bearer ")) {
		return header.slice(7).trim();
	}
	const cookies = parseCookies(req.headers.get("cookie"));
	return cookies["sb-access-token"] || cookies["supabase-auth-token"] || null;
};

const normalizeRank = (rank?: string | null) => {
	const normalized = (rank || "").toString().trim().toLowerCase();
	return normalized || "vagrant";
};

const hasRankOrAbove = (rank: string | null | undefined, minimum: string) => {
	const userIdx = RANK_ORDER.indexOf(normalizeRank(rank));
	const minIdx = RANK_ORDER.indexOf(normalizeRank(minimum));
	if (minIdx === -1) return true;
	if (userIdx === -1) return false;
	return userIdx >= minIdx;
};

const deriveGrants = (userRank: string, net?: { min_rank_to_join?: string | null; min_rank_to_rx?: string | null; min_rank_to_tx?: string | null }) => {
	const rank = normalizeRank(userRank);
	const minJoin = normalizeRank(net?.min_rank_to_join || net?.min_rank_to_rx || "scout");
	const minRx = normalizeRank(net?.min_rank_to_rx || minJoin || "scout");
	const minTx = normalizeRank(net?.min_rank_to_tx || "scout");

	const canJoin = hasRankOrAbove(rank, minJoin);
	const canSubscribe = hasRankOrAbove(rank, minRx);
	const canPublish = hasRankOrAbove(rank, minTx) && rank !== "vagrant";

	return {
		canJoin,
		canSubscribe,
		canPublish,
		canPublishData: canPublish,
	};
};

serve(async (req: Request) => {
	const missingEnv = REQUIRED_ENVS.filter(([, value]) => !value).map(([key]) => key);
	if (missingEnv.length) {
		console.error("Missing required env vars:", missingEnv.join(","));
		return jsonResponse(500, { error: "INTERNAL_SERVER_ERROR" });
	}

	if (req.method !== "POST") {
		return jsonResponse(405, { error: "METHOD_NOT_ALLOWED" });
	}

	let body: { roomName?: string; participantName?: string; identity?: string; role?: string };
	try {
		body = await req.json();
	} catch (err) {
		console.error("Invalid JSON body", err);
		return jsonResponse(400, { error: "BAD_REQUEST", details: "Invalid JSON" });
	}

	const { roomName, participantName, identity, role } = body;
	if (!roomName || !participantName) {
		return jsonResponse(400, { error: "BAD_REQUEST", details: "roomName and participantName are required" });
	}

	const token = getAuthToken(req);
	if (!token) {
		return jsonResponse(401, { error: "UNAUTHORIZED" });
	}

	const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

	const { data: authData, error: authError } = await supabase.auth.getUser(token);
	if (authError || !authData?.user) {
		console.error("Supabase auth failed", authError);
		return jsonResponse(401, { error: "UNAUTHORIZED" });
	}

	const user = authData.user;

	const { data: profile, error: profileError } = await supabase
		.from("profiles")
		.select("id, rank, roles")
		.eq("id", user.id)
		.maybeSingle();

	if (profileError || !profile) {
		console.error("Profile lookup failed", profileError);
		return jsonResponse(403, { error: "FORBIDDEN", details: "Profile not found" });
	}

	const { data: voiceNet, error: netError } = await supabase
		.from("voice_nets")
		.select("*")
		.eq("code", roomName)
		.maybeSingle();

	if (netError) {
		console.warn("voice_nets lookup failed; defaulting to Scout+ join", netError.message);
	}

	const userRank = normalizeRank(profile.rank || profile.roles?.[0]);
	const grants = deriveGrants(userRank, voiceNet ?? undefined);

	if (!grants.canJoin || !grants.canSubscribe) {
		return jsonResponse(403, { error: "INSUFFICIENT_CLEARANCE" });
	}

	const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
		identity: identity || user.id,
		name: participantName,
		metadata: JSON.stringify({
			userId: user.id,
			role: role || profile.roles?.[0] || userRank,
			rank: profile.rank || userRank,
		}),
	});

	at.addGrant({
		room: roomName,
		roomJoin: true,
		canPublish: grants.canPublish,
		canSubscribe: grants.canSubscribe,
		canPublishData: grants.canPublishData,
	});

	try {
		const livekitToken = at.toJwt();
		return jsonResponse(200, { token: livekitToken, serverUrl: LIVEKIT_URL });
	} catch (err) {
		console.error("Token signing failed", err);
		return jsonResponse(500, { error: "INTERNAL_SERVER_ERROR" });
	}
});