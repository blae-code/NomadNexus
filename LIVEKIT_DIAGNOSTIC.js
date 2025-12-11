/**
 * LiveKit Connection Diagnostic
 * 
 * Copy and paste this into browser console (F12) to diagnose connection issues
 */

(async function diagnosticTest() {
  console.clear();
  console.log('🔍 LiveKit Connection Diagnostic\n');

  // Check 1: Is Supabase configured?
  console.log('✓ Check 1: Supabase Configuration');
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    console.log('  VITE_SUPABASE_URL:', supabaseUrl ? '✅ SET' : '❌ MISSING');
    console.log('  VITE_SUPABASE_ANON_KEY:', anonKey ? '✅ SET' : '❌ MISSING');
  } catch (err) {
    console.error('  ❌ Could not read env vars:', err.message);
  }

  // Check 2: Is user authenticated?
  console.log('\n✓ Check 2: User Authentication');
  try {
    const { data: session } = await window.supabase?.auth?.getSession?.();
    if (session?.session) {
      console.log('  ✅ User logged in:', session.session.user.email);
      console.log('  Access token expires:', new Date(session.session.expires_at * 1000).toLocaleString());
    } else {
      console.log('  ❌ User NOT logged in - Cannot fetch LiveKit token without auth!');
      return;
    }
  } catch (err) {
    console.error('  ❌ Auth check failed:', err.message);
    return;
  }

  // Check 3: Try to fetch LiveKit token
  console.log('\n✓ Check 3: LiveKit Token Generation');
  try {
    const { data: { session } } = await window.supabase?.auth?.getSession?.();
    const token = session?.session?.access_token;
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/livekit-token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: 'test-diag-room',
          participantName: 'Diagnostic-Bot',
        }),
      }
    );

    if (!response.ok) {
      console.error('  ❌ Token fetch failed:', response.status, response.statusText);
      const error = await response.json();
      console.error('  Error details:', error);
      return;
    }

    const data = await response.json();
    console.log('  ✅ Token generated successfully');
    console.log('  Token length:', data.token?.length, 'chars');
    console.log('  ServerUrl:', data.serverUrl ? '✅ SET' : '❌ MISSING');
    
    if (data.token) {
      // Decode JWT to check grants
      const parts = data.token.split('.');
      if (parts.length === 3) {
        const decoded = JSON.parse(atob(parts[1]));
        console.log('  Grants:', {
          canPublish: decoded.grants?.canPublish,
          canSubscribe: decoded.grants?.canSubscribe,
          canPublishData: decoded.grants?.canPublishData,
          room: decoded.grants?.room,
        });
      }
    }
  } catch (err) {
    console.error('  ❌ Token fetch failed:', err.message);
  }

  // Check 4: LiveKit server reachability
  console.log('\n✓ Check 4: LiveKit Server Reachability');
  try {
    const livekitUrl = import.meta.env.VITE_LIVEKIT_URL;
    console.log('  LiveKit URL:', livekitUrl);
    
    if (!livekitUrl) {
      console.warn('  ⚠️  VITE_LIVEKIT_URL not configured');
      return;
    }

    // Try to reach LiveKit websocket endpoint
    const wsUrl = livekitUrl.replace('wss://', 'https://').replace('ws://', 'http://');
    const response = await fetch(wsUrl, { method: 'HEAD', mode: 'no-cors' });
    console.log('  ✅ LiveKit server reachable (no-cors check)');
  } catch (err) {
    console.error('  ❌ LiveKit server unreachable:', err.message);
  }

  console.log('\n✅ Diagnostic complete! Check results above for blockers.');
})();
