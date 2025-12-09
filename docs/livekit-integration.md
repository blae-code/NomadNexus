# LiveKit Integration Architecture

## Overview

This document details the LiveKit integration for NomadNexus, serving as the single source of truth for real-time voice communications.

## Token Generation & Authentication

### Production Flow

All LiveKit tokens MUST come from the Supabase Edge Function in production:

```
Client Request → useLiveKitToken hook → supabase/functions/livekit-token → JWT Token Response
```

**Key Files:**
- `src/hooks/useLiveKitToken.ts` - Client-side hook that calls Supabase function
- `supabase/functions/livekit-token/index.ts` - Server-side token generation with AccessToken SDK

**Token Response Structure:**
```typescript
{
  token: string,        // JWT with room grants
  serverUrl: string     // LiveKit server WebSocket URL
}
```

**Security:**
- API keys/secrets stored in Supabase environment (LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL)
- JWT includes grants: roomJoin, canPublish (role-based), canSubscribe
- Vagrant role has canPublish: false (listen-only)

### Legacy Path (REMOVED)

The old `/functions/generateLiveKitToken` endpoint has been removed. All token generation now goes through the Supabase Edge Function for proper security and API key management.

## Room Connection

### Connection Flow

```
1. NomadShell.tsx renders
2. useLiveKitToken fetches token from Supabase function
3. useEffect calls useLiveKit.connect() with token + serverUrl
4. LiveKitProvider creates Room instance with production options
5. Room.connect(serverUrl, token) establishes WebSocket connection
6. Room events fire (TrackSubscribed, ConnectionStateChanged, etc.)
```

### Room Configuration

The Room is created with production-optimized options in `useLiveKit.jsx`:

```javascript
new Room({
  adaptiveStream: true,           // Dynamic quality based on network
  dynacast: true,                  // Selective subscription to save bandwidth
  stopLocalTrackOnUnpublish: true  // Proper cleanup on unpublish
})
```

**adaptiveStream**: Automatically adjusts video/audio quality based on available bandwidth and network conditions.

**dynacast**: Enables selective subscription - only receives tracks that are actually being displayed/heard, reducing bandwidth usage.

**stopLocalTrackOnUnpublish**: Ensures local media tracks are properly stopped when unpublished, preventing resource leaks.

## State Management

### Audio State (Microphone Status)

```javascript
export const AUDIO_STATE = {
  DISCONNECTED: 'DISCONNECTED',      // Not connected to room
  CONNECTED_MUTED: 'CONNECTED_MUTED', // Connected but mic muted
  CONNECTED_OPEN: 'CONNECTED_OPEN'    // Connected with mic active
}
```

**Usage:** UI indicators for mute button state, visual feedback

### Connection State (Network Status)

Normalized values matching LiveKit's ConnectionState enum:

```javascript
// Canonical values used throughout the app
'connected'     // Fully connected and operational
'connecting'    // Initial connection in progress
'reconnecting'  // Attempting to restore connection
'disconnected'  // Clean disconnect or failed
'idle'          // Not yet attempted (local state)
'error'         // Connection failed (local state)
```

**Consumers:**
- `TacticalHeader.jsx` - Connection badge (Connected/Linking/Disconnected)
- `CommsDashboardPanel.jsx` - Detailed network metrics
- `NetworkStatusMonitor.jsx` - Color-coded latency/quality display
- `CompactSignalMeter.jsx` - Signal bars based on connection + quality

## Microphone Control

### setMicrophoneEnabled(boolean)

**Standard Flow:**
1. Validates room connection exists
2. Calls `room.localParticipant.setMicrophoneEnabled(enabled)`
3. Updates audioState to CONNECTED_OPEN or CONNECTED_MUTED

**Command Override (Pioneer/Command Roles):**

When leadership roles activate their mic:
1. Sets `pioneerHot.current = true`
2. Ducks all remote tracks to 20% volume
3. Broadcasts `MUTE_ALL` signal via data channel
4. Other participants hear command override at full volume

When they release:
1. Sets `pioneerHot.current = false`
2. Restores all remote tracks to 100% volume

**Device Selection:**
- Uses `devicePreferences.microphoneId` if configured
- Falls back to system default if not set
- Device switching via `room.switchActiveDevice('audioinput', deviceId)`

**Broadcast Mode:**
- If `broadcastMode` is active, sends `BROADCAST_STATE` signal
- Notifies other participants of announcement/broadcast

## Remote Track Processing

### Track Subscription Flow

```
1. Room emits TrackSubscribed event
2. Check if track is whisper (name starts with 'whisper-')
3. If whisper and not targeted to us: setSubscribed(false)
4. If public or targeted whisper: setSubscribed(true)
5. Process through AudioProcessor with role-based profile
6. Apply spatial mixing if listenerPosition metadata available
7. Store in remoteAudioTracks state
```

### Audio Processing Pipeline

**1. AudioProcessor.processRemoteTrack(track, profile)**
- Applies role-based audio profiles (radio effects, filters)
- Ranger: Radio distortion, narrow frequency (500-3500 Hz)
- Industry: Industrial sound, wider range (200-4000 Hz)
- Command: Clean audio, full range (120-5000 Hz) with compression

**2. SpatialMixer.calculateMix(position, listenerPos, squadPos)**
- Calculates pan and gain based on spatial position metadata
- Squad members closer in space have higher volume
- Returns `{ pan: -1 to 1, gain: 0 to 1 }`

**3. AudioProcessor.updatePanAndGain(trackSid, pan, gain)**
- Applies spatial positioning to track
- Modified by solo/mute/priority speaker states

### Track Mixing States

**Solo Track:**
- When set, all other tracks are muted
- Only the soloed track is audible
- Toggle via `toggleSoloTrack(trackSid)`

**Priority Speaker:**
- Commander+ rank speakers auto-detected via ActiveSpeakersChanged event
- When priority speaker is active, other tracks ducked to 50% volume
- Ensures command communication is always clear

**Muted Tracks:**
- Per-track muting via `updateTrackMix(trackSid, { muted: true })`
- Can enforce participant-level mute: `enforceParticipantMute(participantId, true)`

## Connection Metrics

Real-time metrics tracked via WebRTC stats:

```javascript
{
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline',
  latencyMs: number,      // Round-trip time from candidate-pair stats
  packetLoss: number,     // Percentage (0-100)
  jitter: number,         // Network variance in ms
  bandwidth: {
    inKbps: number,       // Incoming audio bitrate
    outKbps: number       // Outgoing audio bitrate
  }
}
```

**Quality Mapping:**
- ConnectionQuality.Excellent → 'excellent'
- ConnectionQuality.Good → 'good'
- ConnectionQuality.Poor → 'poor'
- ConnectionQuality.Lost → 'offline'

**Stats Polling:**
- Runs every 2.5 seconds when connected
- Parses WebRTC RTCStatsReport for latency, packet loss, jitter, bitrate
- Displayed in NetworkStatusMonitor and CommsDashboardPanel

## Tactical Features

### Flares (Distress Signals)

```javascript
publishFlare('RESCUE', 'Stanton III - Crusader')
```

- Sent via TacticalTransceiver over data channel
- Triggers ShipVoice alert on receivers
- Stored in `lastFlare` state for UI display

### Mute All (Command Override)

```javascript
publishMuteAll()
```

- Broadcast by Pioneer/Command roles when going hot
- Receivers auto-mute and show acknowledgment prompt
- Responders send `MUTE_ACK` signal back

### Whisper (Private Audio)

```javascript
publishWhisper(targetUserId)
stopWhisper()
```

- Creates new local audio track
- Publishes with name: `whisper-${targetUserId}`
- Only recipient subscribes to the track
- Stops broadcasting to main room

### Broadcast Mode

```javascript
setBroadcast(true)
```

- Announces to all participants via `BROADCAST_STATE` signal
- UI indicators show broadcast is active
- Used for org-wide announcements

## Component Integration

### NomadShell.tsx (Entry Point)

```tsx
const { token, serverUrl } = useLiveKitToken(roomName, participantName, userId, role);
const { connect, room, connectionState } = useLiveKit();

useEffect(() => {
  if (token && serverUrl && connectionState !== 'connected') {
    connect({ roomName, participantName, role, userId, tokenOverride: token, serverUrlOverride: serverUrl });
  }
}, [token, serverUrl, connectionState]);
```

**Key Points:**
- Waits for token + serverUrl before connecting
- Only connects once (checks connectionState)
- Passes tokenOverride and serverUrlOverride (REQUIRED in production)

### LiveKitProvider Wrapper

- App wrapped with `<LiveKitProvider>` in `main.jsx`
- Room instance managed entirely within provider context
- No redundant `<LiveKitRoom>` wrappers needed
- `<RoomAudioRenderer>` used only where audio routing is needed

## Best Practices

### ✅ Do

- Always use tokenOverride from useLiveKitToken
- Pass serverUrlOverride from token response
- Check connectionState before attempting operations
- Handle room disconnect in cleanup effects
- Use normalized CONNECTION_STATE values
- Subscribe selectively to whisper tracks

### ❌ Don't

- Don't call legacy token endpoints
- Don't create multiple Room instances
- Don't use LiveKitRoom wrapper when Room is in context
- Don't guess connection state strings - use canonical values
- Don't subscribe to all whisper tracks (privacy)
- Don't forget to cleanup tracks on disconnect

## Troubleshooting

### Token Issues

**Error:** "Token missing in response"
- Check Supabase function logs: `supabase functions logs livekit-token`
- Verify LIVEKIT_API_KEY and LIVEKIT_API_SECRET are set in Supabase dashboard
- Confirm function is deployed: `supabase functions deploy livekit-token`

**Error:** "LiveKit credentials missing"
- Ensure useLiveKitToken returned both token and serverUrl
- Check LIVEKIT_URL is set in Supabase environment
- Verify fallback to VITE_LIVEKIT_URL in .env

### Connection Issues

**State stuck on 'connecting':**
- Check LiveKit server is reachable (WebSocket URL)
- Verify token is valid (not expired, correct room name)
- Check browser console for WebSocket errors

**Frequent reconnects:**
- Network instability - check connectionMetrics.packetLoss
- LiveKit server issues - check server logs
- Token expiration - tokens have TTL, may need refresh

### Audio Issues

**No remote audio:**
- Verify tracks are subscribed (check remoteAudioTracks state)
- Ensure AudioProcessor is initialized
- Check browser audio output device selection
- Verify RoomAudioRenderer is mounted

**Mic not working:**
- Check browser permissions for microphone access
- Verify devicePreferences.microphoneId is correct
- Ensure room.localParticipant.setMicrophoneEnabled was called
- Check audioState is CONNECTED_OPEN

## Backend Edge Functions

All backend support for LiveKit is provided by Supabase Edge Functions. See **[Backend Implementation Summary](BACKEND_IMPLEMENTATION_SUMMARY.md)** for complete API reference.

**Core Functions:**

- **`livekit-token/`** - Canonical token generation endpoint with RBAC enforcement
  - Used by: `useLiveKitToken.ts`
  - Authorization: JWT from Authorization header or cookies
  - Response: `{ token, serverUrl }`

**Companion Functions:**

- **`academy-request/`** - Create mentorship requests; notify certified mentors
- **`academy-accept/`** - Accept requests; generate sim_pod_id; issue token pair
- **`notifications-subscribe/`** - Register Web Push subscriptions for flares
- **`handle-rescue-request/`** - Broadcast MEDICAL flare notifications (Scout+)
- **`livekit-webhook/`** - Receive LiveKit events; mirror presence to database
- **`net-bridge/`** - Create/delete voice_net bridges (Founder+ only)

For request/response shapes, RBAC hierarchy, environment variables, and integration examples, see the **[Backend Implementation Summary](BACKEND_IMPLEMENTATION_SUMMARY.md)**.

## References

- [LiveKit Client SDK Docs](https://docs.livekit.io/client-sdk-js/)
- [LiveKit Server SDK Docs](https://docs.livekit.io/server-sdk-js/)
- [ConnectionState Enum](https://docs.livekit.io/client-sdk-js/enums/ConnectionState.html)
- [Room API Reference](https://docs.livekit.io/client-sdk-js/classes/Room.html)
