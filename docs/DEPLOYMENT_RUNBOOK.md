# NomadNexus Backend Deployment Runbook

**Version:** 1.0  
**Last Updated:** December 9, 2025  
**Deployment Target:** Production Supabase + LiveKit

---

## Prerequisites

- [ ] Supabase production project created
- [ ] LiveKit server deployed and accessible
- [ ] VAPID keys generated for Web Push notifications
- [ ] Admin access to Supabase dashboard
- [ ] Admin access to LiveKit dashboard
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Git repository cloned locally

---

## Phase 1: Environment Configuration

### 1.1 Set Supabase Environment Variables

In Supabase Dashboard → Project Settings → Functions → Environment Variables:

```env
# LiveKit
LIVEKIT_URL=wss://your-livekit-instance.com
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
LIVEKIT_WEBHOOK_SECRET=your-webhook-secret-here

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:admin@nomadnexus.com

# Supabase (auto-populated, verify they exist)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

**Generate VAPID Keys (if not already done):**
```bash
npm install -D web-push
npx web-push generate-vapid-keys
```

### 1.2 Configure Frontend Environment Variables

In your hosting platform (Vercel/Netlify/etc):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_LIVEKIT_URL=wss://your-livekit-instance.com
```

---

## Phase 2: Database Migrations

### 2.1 Link to Production Project

```bash
cd c:\Users\Owner\NomadNexus

# Link to your production Supabase project
supabase link --project-ref your-project-ref

# Verify link
supabase projects list
```

### 2.2 Push Migrations

```bash
# Review pending migrations
supabase db diff

# Push all migrations to production
supabase db push

# Verify migrations applied
supabase migration list
```

**Expected Migrations:**
- ✅ `20250109_voice_nets_rbac.sql` - Adds min_rank_to_join/rx/tx columns
- ✅ `20250109_voice_net_bridges.sql` - Creates voice_net_bridges table
- ✅ `20250109_voice_presence.sql` - Creates voice_presence table
- ✅ `20250109_notification_queue.sql` - Creates notification_queue table

### 2.3 Verify Tables Exist

```sql
-- Run in Supabase SQL Editor
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'voice_nets', 
    'voice_net_bridges', 
    'voice_presence', 
    'push_subscriptions', 
    'notification_queue'
  );
```

Expected: All 5 tables should appear.

---

## Phase 3: Deploy Edge Functions

### 3.1 Deploy All Functions

```bash
# Deploy all 7 functions
supabase functions deploy livekit-token
supabase functions deploy academy-request
supabase functions deploy academy-accept
supabase functions deploy notifications-subscribe
supabase functions deploy handle-rescue-request
supabase functions deploy livekit-webhook
supabase functions deploy net-bridge

# Verify deployment
supabase functions list
```

### 3.2 Test Function Accessibility

```bash
# Test livekit-token function (requires valid JWT)
curl -i -X POST https://your-project.supabase.co/functions/v1/livekit-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roomName":"test-room","participantName":"TestUser"}'

# Expected: 200 OK with {"token":"...", "serverUrl":"wss://..."}
# Or 401 if JWT is invalid
```

---

## Phase 4: Configure LiveKit Webhook

### 4.1 Register Webhook in LiveKit Dashboard

1. Navigate to LiveKit Dashboard → Settings → Webhooks
2. Add new webhook:
   - **URL:** `https://your-project.supabase.co/functions/v1/livekit-webhook`
   - **Secret:** Same value as `LIVEKIT_WEBHOOK_SECRET` env var
   - **Events to subscribe:**
     - ✅ `participant_joined`
     - ✅ `participant_left`
     - ✅ `room_finished`

3. Save and verify webhook is active

### 4.2 Test Webhook Delivery

```bash
# Trigger a test event (join a room via frontend)
# Check voice_presence table for new entries

# Or send test webhook manually
curl -X POST https://your-project.supabase.co/functions/v1/livekit-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: YOUR_HMAC_SIGNATURE" \
  -d '{
    "event": "participant_joined",
    "room": "test-room",
    "participant": {
      "identity": "test-user-123",
      "sid": "PA_test123",
      "metadata": "{\"userId\":\"uuid-123\",\"role\":\"Scout\"}"
    },
    "timestamp": 1702050000
  }'

# Check voice_presence table
SELECT * FROM voice_presence WHERE room_name = 'test-room' ORDER BY joined_at DESC LIMIT 5;
```

---

## Phase 5: Configure CORS & API Access

### 5.1 Enable CORS for Edge Functions

In Supabase Dashboard → Project Settings → Functions → CORS:

- **Allowed Origins:** Add your frontend domain(s)
  - `https://yourdomain.com`
  - `https://www.yourdomain.com`
  - `http://localhost:5173` (for local dev)

### 5.2 Verify API Gateway Access

Ensure the following are accessible:
- ✅ `https://your-project.supabase.co/functions/v1/livekit-token`
- ✅ `https://your-project.supabase.co/functions/v1/academy-request`
- ✅ `https://your-project.supabase.co/functions/v1/notifications-subscribe`

---

## Phase 6: Verification & Testing

### 6.1 LiveKit Token Generation

**Test with different ranks:**

```bash
# Scout user (should get canPublish: true)
curl -X POST https://your-project.supabase.co/functions/v1/livekit-token \
  -H "Authorization: Bearer SCOUT_JWT" \
  -H "Content-Type: application/json" \
  -d '{"roomName":"test-room","participantName":"Scout1"}'

# Vagrant user (should get canPublish: false or 403)
curl -X POST https://your-project.supabase.co/functions/v1/livekit-token \
  -H "Authorization: Bearer VAGRANT_JWT" \
  -H "Content-Type: application/json" \
  -d '{"roomName":"test-room","participantName":"Vagrant1"}'
```

### 6.2 Academy Flow

```bash
# 1. Create request
curl -X POST https://your-project.supabase.co/functions/v1/academy-request \
  -H "Authorization: Bearer CADET_JWT" \
  -H "Content-Type: application/json" \
  -d '{"skillId":"uuid-of-skill"}'

# Expected: {"requestId":"uuid","status":"PENDING"}

# 2. Accept request (as mentor)
curl -X POST https://your-project.supabase.co/functions/v1/academy-accept \
  -H "Authorization: Bearer MENTOR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"requestId":"uuid-from-step-1"}'

# Expected: {"simPodId":"sim-pod-xxx","connectionTokens":[...]}
```

### 6.3 Push Notifications

```bash
# 1. Subscribe to notifications
curl -X POST https://your-project.supabase.co/functions/v1/notifications-subscribe \
  -H "Authorization: Bearer USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://fcm.googleapis.com/fcm/send/xxx",
    "auth": "auth-string-here",
    "p256dh": "p256dh-key-here"
  }'

# Expected: {"success":true}

# 2. Trigger rescue flare (Scout+ required)
curl -X POST https://your-project.supabase.co/functions/v1/handle-rescue-request \
  -H "Authorization: Bearer SCOUT_JWT" \
  -H "Content-Type: application/json" \
  -d '{"location":"Stanton III - Crusader","flareType":"MEDICAL"}'

# Expected: Push notification delivered to subscribed users
```

### 6.4 Net Bridging (Founder+ only)

```bash
# Create two voice nets first, then:
curl -X POST https://your-project.supabase.co/functions/v1/net-bridge \
  -H "Authorization: Bearer FOUNDER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceNetId":"uuid-net-1",
    "targetNetId":"uuid-net-2",
    "action":"link"
  }'

# Expected: {"id":"uuid","source_net_id":"...","target_net_id":"..."}

# Verify in database
SELECT * FROM voice_net_bridges;
```

---

## Phase 7: Monitoring & Logging

### 7.1 Enable Function Logs

```bash
# Stream logs in real-time
supabase functions logs livekit-token --follow

# Or view in Supabase Dashboard → Functions → Logs
```

### 7.2 Monitor Webhook Events

```sql
-- Check recent presence events
SELECT 
  room_name, 
  participant_identity, 
  joined_at, 
  left_at,
  participant_metadata->>'rank' as rank
FROM voice_presence 
WHERE joined_at > now() - interval '1 hour'
ORDER BY joined_at DESC 
LIMIT 20;

-- Check stale presence (possible webhook failures)
SELECT COUNT(*) as stale_count
FROM voice_presence 
WHERE left_at IS NULL 
  AND joined_at < now() - interval '10 minutes';
```

### 7.3 Monitor Notification Queue

```sql
-- Check pending notifications
SELECT 
  type, 
  COUNT(*) as count,
  MAX(created_at) as latest
FROM notification_queue 
WHERE sent_at IS NULL 
GROUP BY type;

-- Check recent deliveries
SELECT * FROM notification_queue 
WHERE sent_at IS NOT NULL 
ORDER BY sent_at DESC 
LIMIT 10;
```

---

## Phase 8: Rollback Procedures

### 8.1 Rollback Edge Functions

```bash
# Redeploy previous version
git checkout <previous-commit>
supabase functions deploy <function-name>

# Or delete function entirely
supabase functions delete <function-name>
```

### 8.2 Rollback Database Migrations

```bash
# Supabase doesn't support automatic rollbacks
# Manual rollback via SQL:

-- 1. Drop new tables
DROP TABLE IF EXISTS voice_presence CASCADE;
DROP TABLE IF EXISTS notification_queue CASCADE;
DROP TABLE IF EXISTS voice_net_bridges CASCADE;

-- 2. Remove new columns
ALTER TABLE voice_nets DROP COLUMN IF EXISTS min_rank_to_join;
ALTER TABLE voice_nets DROP COLUMN IF EXISTS min_rank_to_rx;
ALTER TABLE voice_nets DROP COLUMN IF EXISTS min_rank_to_tx;
ALTER TABLE voice_nets DROP COLUMN IF EXISTS linked_squad_id;

-- 3. Verify rollback
SELECT * FROM information_schema.tables WHERE table_schema = 'public';
```

### 8.3 Emergency Disable

If critical issues arise:

```bash
# Option 1: Disable all functions via Supabase Dashboard
# Settings → Functions → Toggle "Enable Functions" OFF

# Option 2: Unset critical environment variables
# This will cause functions to return 500 errors gracefully
```

---

## Phase 9: Post-Deployment Validation

### ✅ Final Checklist

- [ ] All 7 Edge Functions deployed and accessible
- [ ] All 4 database migrations applied successfully
- [ ] LiveKit webhook configured and receiving events
- [ ] CORS configured for frontend domain
- [ ] Environment variables set correctly in Supabase
- [ ] LiveKit token generation tested with different ranks
- [ ] Academy request/accept flow tested end-to-end
- [ ] Push notification subscription and delivery tested
- [ ] Net bridging tested (Founder+ only)
- [ ] Webhook presence mirroring verified in voice_presence table
- [ ] Function logs reviewed for errors
- [ ] Frontend integration tested (useLiveKitToken, academy UI, etc.)

---

## Troubleshooting

### Issue: "LIVEKIT_API_KEY not set" error

**Solution:** Verify environment variables in Supabase Dashboard → Functions → Environment Variables. Redeploy functions after adding.

### Issue: Webhook signature verification fails

**Solution:** Ensure `LIVEKIT_WEBHOOK_SECRET` matches exactly between LiveKit dashboard and Supabase env vars. No extra spaces or quotes.

### Issue: Token generation returns 403 "INSUFFICIENT_CLEARANCE"

**Solution:** 
1. Check user's rank in profiles table
2. Verify voice_nets table has min_rank_to_join/rx/tx columns
3. Ensure migrations ran successfully

### Issue: Push notifications not delivering

**Solution:**
1. Verify VAPID keys are correctly set (public key must match client-side subscription)
2. Check browser console for subscription errors
3. Verify push_subscriptions table has valid entries
4. Check function logs for `handle-rescue-request` errors

### Issue: voice_presence table empty despite connections

**Solution:**
1. Verify webhook is registered in LiveKit dashboard
2. Check LiveKit webhook logs for delivery failures
3. Test webhook endpoint manually with curl
4. Verify HMAC signature verification is working

---

## Support & Resources

- **Backend API Reference:** `docs/BACKEND_IMPLEMENTATION_SUMMARY.md`
- **Testing Guide:** `docs/EDGE_FUNCTIONS_LOCAL_TESTING.md`
- **LiveKit Integration:** `docs/livekit-integration.md`
- **Environment Variables:** `.env.example`

**Emergency Contact:** Refer to project maintainers for critical issues.

---

**Deployment Complete! 🚀**

Monitor function logs and database metrics for the first 24 hours to ensure stability.
