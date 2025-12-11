import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req: Request) => {
	const headers = {
		"Content-Type": "application/json",
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
	};

	if (req.method === "OPTIONS") {
		return new Response(null, { status: 204, headers });
	}

	try {
		console.log("Step 1: Checking environment variables...");
		const LIVEKIT_API_KEY = Deno.env.get("LIVEKIT_API_KEY");
		const LIVEKIT_API_SECRET = Deno.env.get("LIVEKIT_API_SECRET");
		const LIVEKIT_URL = Deno.env.get("LIVEKIT_URL");
		
		console.log("Environment check:", {
			hasKey: !!LIVEKIT_API_KEY,
			hasSecret: !!LIVEKIT_API_SECRET,
			hasUrl: !!LIVEKIT_URL,
			keyLength: LIVEKIT_API_KEY?.length,
			secretLength: LIVEKIT_API_SECRET?.length,
			url: LIVEKIT_URL,
		});

		console.log("Step 2: Importing LiveKit SDK...");
		const { AccessToken } = await import("livekit-server-sdk");
		console.log("LiveKit SDK imported successfully");

		console.log("Step 3: Creating AccessToken...");
		const at = new AccessToken(LIVEKIT_API_KEY!, LIVEKIT_API_SECRET!, {
			identity: "test-user",
			name: "Test User",
		});
		console.log("AccessToken created");

		console.log("Step 4: Adding grant...");
		at.addGrant({
			room: "test-room",
			roomJoin: true,
			canPublish: true,
			canSubscribe: true,
		});
		console.log("Grant added");

		console.log("Step 5: Signing JWT...");
		const token = at.toJwt();
		console.log("JWT signed successfully, length:", token.length);

		return new Response(
			JSON.stringify({
				success: true,
				token: token.substring(0, 50) + "...",
				serverUrl: LIVEKIT_URL,
				message: "All steps completed successfully",
			}),
			{ status: 200, headers }
		);
	} catch (err) {
		console.error("Error occurred:", err);
		return new Response(
			JSON.stringify({
				success: false,
				error: err.message,
				stack: err.stack,
				name: err.name,
			}),
			{ status: 500, headers }
		);
	}
});
