# NomadNexus Backend Implementation Summary

**Last Updated:** December 9, 2025

## Completed Implementations

### 1. LiveKit Token Generation (`livekit-token`)
**Status:** ✅ **COMPLETE & HARDENED**

- **File:** `supabase/functions/livekit-token/index.ts`
- **Features:**
  - Supabase JWT authentication (bearer token + cookie fallback)
  - Role-based grant generation (Founder/Voyager/Scout: publish+subscribe; Vagrant: listen-only)
  - Room-specific RBAC via `voice_nets.min_rank_to_join/rx/tx`
  - Metadata encoding: `userId`, `role`, `rank`
  - Environment validation and error handling
- **Frontend Hook:** `src/hooks/useLiveKitToken.ts`
- **Used By:** `NomadShell.tsx`, `CommsDashboardPanel.jsx`

### 2. Academy Mentorship Endpoints

#### `academy-request` Edge Function
**Status:** ✅ **COMPLETE**

- **File:** `supabase/functions/academy-request/index.ts`
- **Endpoint:** `POST /api/academy/request`
- **Body:** `{ skillId: string, cadetId?: string }`
- **Features:**
  - Authenticates cadet from JWT
  - Validates against brig status
  - Inserts `instruction_requests` with PENDING status
  - Looks up all certified mentors for skill
  - Enqueues notifications to `notification_queue`
  - Returns `{ requestId, status: 'PENDING' }`

#### `academy-accept` Edge Function
**Status:** ✅ **COMPLETE**

- **File:** `supabase/functions/academy-accept/index.ts`
- **Endpoint:** `POST /api/academy/accept`
- **Body:** `{ requestId: string, guideId?: string }`
- **Features:**
  - Authenticates guide from JWT
  - Validates guide is certified in skill
  - Enforces brig check
  - Generates unique `sim_pod_id`
  - Issues two LiveKit tokens (cadet + guide)
  - Updates request to ACTIVE with sim pod details
  - Returns tokens + serverUrl for immediate room join

### 3. Push Notifications

#### `notifications-subscribe` Edge Function
**Status:** ✅ **COMPLETE**

- **File:** `supabase/functions/notifications-subscribe/index.ts`
- **Endpoint:** `POST /api/notifications/subscribe`
- **Body:** `{ endpoint: string, auth: string, p256dh: string }`
- **Features:**
  - Web Push subscription registration
  - Upserts into `push_subscriptions` table
  - Auto-creates table if missing
  - Validates VAPID keys from environment

#### `handle-rescue-request` Edge Function
**Status:** ✅ **COMPLETE & REFACTORED**

- **File:** `supabase/functions/handle-rescue-request/index.ts`
- **Endpoint:** `POST /api/handle-rescue-request`
- **Body:** `{ flareId?: string, netCode?: string }`
- **Features:**
  - Scout+ RBAC enforcement
  - Per-user rate limiting (15s window, in-memory)
  - Queries rescue/medic role users
  - Sends critical alert Web Push with icon/badge/URL data
  - Auto-prunes failed endpoints (410/404)
  - Returns `{ status: 'FLARE_LAUNCHED', respondersNotified }`

### 4. LiveKit Webhook & Presence Mirror (`livekit-webhook`)
**Status:** ✅ **COMPLETE**

- **File:** `supabase/functions/livekit-webhook/index.ts`
- **Endpoint:** `POST /api/livekit-webhook`
- **Features:**
  - HMAC-SHA256 signature verification from `x-livekit-signature` header
  - Handles: `participant_joined`, `participant_left`, `room_finished`
  - Maintains `voice_presence` table for commander views
  - Parses metadata to extract `userId`
  - Auto-creates table if missing
  - Idempotent and safe for duplicate events
  - Returns `{ ok: true }`

### 5. Voice Net Bridging (`net-bridge`)
**Status:** ✅ **COMPLETE**

- **File:** `supabase/functions/net-bridge/index.ts`
- **Endpoint:** `POST /api/net-bridge`
- **Body:** `{ sourceNetId: string, targetNetId: string, action: 'link' | 'unlink' }`
- **Features:**
  - Founder+ RBAC enforcement
  - Validates both nets exist
  - Creates/deletes `voice_net_bridges` rows
  - Unique constraint on `(source_net_id, target_net_id)`
  - Auto-creates table if missing
  - Returns bridge row on link, `{ deleted: true/false }` on unlink
- **Migration:** `supabase/migrations/20250109_voice_net_bridges.sql`

## Database Tables

### Core Tables Created/Maintained

1. **voice_nets** - Room definitions (type, priority, RLS policies)
2. **voice_net_bridges** - Net linking metadata
3. **voice_presence** - Participant presence mirror (from webhooks)
4. **push_subscriptions** - Web Push endpoint storage
5. **notification_queue** - Async notification payload staging
6. **instruction_requests** - Academy session tracking
7. **certifications** - Mentor-skill relationships

## Environment Variables Required

### LiveKit
- `LIVEKIT_URL` - WebSocket URL
- `LIVEKIT_API_KEY` - Server API key
- `LIVEKIT_API_SECRET` - Server API secret
- `LIVEKIT_WEBHOOK_SECRET` - Webhook signature secret

### Supabase
- `SUPABASE_URL` (or `PROJECT_URL`)
- `SUPABASE_SERVICE_KEY` (or `SERVICE_ROLE_KEY`)

### Web Push
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Public VAPID (exposed to client)
- `VAPID_PRIVATE_KEY` - Private VAPID (server-only)
- `VAPID_SUBJECT` - Notification subject line

## RBAC Hierarchy

```
Vagrant     - Listen-only, no publish, no flares
Scout       - Publish, subscribe, create nets, flares
Voyager     - Scout+ plus broadcast mode, wing command
Founder     - Voyager+ plus fleet command, bridge nets, priority mute
Pioneer     - Full override (rare/admin)
```

## Common Patterns

### Authentication
```typescript
const token = getAuthToken(req); // Bearer or cookie
const { data: { user } } = await supabase.auth.getUser(token);
```

### RBAC Check
```typescript
const isFounderOrAbove = (rank) => {
  const ladder = ["vagrant", "scout", "voyager", "founder", "pioneer"];
  return ladder.indexOf((rank || "").toLowerCase()) >= 3;
};
```

### Table Ensure (fallback)
```typescript
if (error?.message?.includes("relation")) {
  await ensureTable(supabase);
  // retry operation
}
```

## Frontend Integration

### Token Fetching
```typescript
const { token, serverUrl } = useLiveKitToken(roomName, participantName, identity, role);
```

### Room Connection
```typescript
connectNet({
  roomName,
  participantName,
  role,
  userId,
  tokenOverride: token,
  serverUrlOverride: serverUrl
});
```

### Push Subscription
```typescript
await supabase.functions.invoke('notifications-subscribe', { body: { endpoint, auth, p256dh } });
```

### Academy Request
```typescript
await supabase.functions.invoke('academy-request', { body: { skillId } });
```

### Academy Accept
```typescript
const { simPodId, connectionTokens } = await supabase.functions.invoke('academy-accept', { 
  body: { requestId } 
});
```

### Net Bridge
```typescript
await supabase.functions.invoke('net-bridge', { 
  body: { sourceNetId, targetNetId, action: 'link' } 
});
```

## Testing Checklist

- [ ] `supabase functions serve` starts without errors
- [ ] `livekit-token`: Test with valid Supabase JWT, verify role-based grants
- [ ] `academy-request`: Insert and mentor notification enqueue
- [ ] `academy-accept`: Verify token pair generation and sim pod creation
- [ ] `notifications-subscribe`: Upsert subscriptions, verify table
- [ ] `handle-rescue-request`: Scout+ check, rate limit, push send
- [ ] `livekit-webhook`: HMAC verify, participant presence updates
- [ ] `net-bridge`: Link/unlink ops, RBAC enforcement

## Notes

- All Edge Functions use Deno runtime (TypeScript + ESM)
- Import map at `supabase/functions/import_map.json` manages dependencies
- Token functions are the single source of truth; legacy paths removed
- Rate limiting is in-memory; scale horizontally with care
- Webhook receiver is idempotent and safe for replays
