# Production Setup Checklist

**Last Updated:** December 9, 2025  
**Status:** Migrations & Functions Deployed ✅ | Manual Config Required ⏳

---

## ✅ Completed Deployment Steps

### Database Migrations
- ✅ `20250109000001_notification_queue.sql` deployed
- ✅ `20250109000002_voice_net_bridges.sql` deployed
- ✅ `20250109000003_voice_nets_rbac.sql` deployed
- ✅ `20250109000004_voice_presence.sql` deployed

### Edge Functions
- ✅ `livekit-token` deployed
- ✅ `academy-request` deployed
- ✅ `academy-accept` deployed
- ✅ `notifications-subscribe` deployed
- ✅ `handle-rescue-request` deployed
- ✅ `livekit-webhook` deployed
- ✅ `net-bridge` deployed

**Dashboard:** https://supabase.com/dashboard/project/zzsvexgiqxoyezblumpg/functions

---

## ✅ Configuration Complete

### Step 1: Environment Variables in Supabase

**Location:** Supabase Dashboard → Project Settings → Edge Functions → Environment Variables

✅ **Status:** All variables configured

The following variables are already set:

```env
# LiveKit Configuration
✅ LIVEKIT_URL
✅ LIVEKIT_API_KEY
✅ LIVEKIT_API_SECRET
✅ LIVEKIT_WEBHOOK_SECRET

# Web Push (VAPID Keys)
✅ NEXT_PUBLIC_VAPID_PUBLIC_KEY
✅ VAPID_PRIVATE_KEY
✅ VAPID_SUBJECT

# Supabase
✅ SUPABASE_URL
✅ SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ SUPABASE_DB_URL
✅ PROJECT_URL (alias for SUPABASE_URL)
✅ SERVICE_ROLE_KEY (alias for SUPABASE_SERVICE_ROLE_KEY)
```

All Edge Functions now have access to these environment variables.

---

### Step 2: Configure LiveKit Webhook

**Location:** LiveKit Dashboard → Settings → Webhooks

✅ **Status:** Already configured

Your webhook is already set up with:
- **URL:** `https://zzsvexgiqxoyezblumpg.supabase.co/functions/v1/livekit-webhook`
- **Secret:** Configured in `LIVEKIT_WEBHOOK_SECRET` env var
- **Events subscribed:**
  - ✅ `participant_joined`
  - ✅ `participant_left`
  - ✅ `room_finished`

**To verify it's working:**
1. Join a LiveKit room via the frontend
2. Check Supabase SQL Editor:
   ```sql
   SELECT * FROM voice_presence 
   ORDER BY joined_at DESC 
   LIMIT 5;
   ```
3. You should see presence entries for active participants

---

## 🧪 Testing Checklist

Once manual configuration is complete, test these flows:

### 1. LiveKit Token Generation
```bash
# Get a JWT from Supabase (login as test user)
# Then test token endpoint:
curl -X POST https://zzsvexgiqxoyezblumpg.supabase.co/functions/v1/livekit-token \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"roomName":"test-room","participantName":"TestUser"}'
```

**Expected Response:**
```json
{
  "token": "eyJhbGc...",
  "serverUrl": "wss://..."
}
```

### 2. Academy Request Flow
```bash
# Create mentorship request
curl -X POST https://zzsvexgiqxoyezblumpg.supabase.co/functions/v1/academy-request \
  -H "Authorization: Bearer CADET_JWT" \
  -H "Content-Type: application/json" \
  -d '{"skillId":"uuid-of-skill"}'
```

**Expected Response:**
```json
{
  "requestId": "uuid",
  "status": "PENDING"
}
```

### 3. Push Notification Registration
```bash
# Register for push notifications
curl -X POST https://zzsvexgiqxoyezblumpg.supabase.co/functions/v1/notifications-subscribe \
  -H "Authorization: Bearer USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://fcm.googleapis.com/...",
    "auth": "auth-token",
    "p256dh": "p256dh-key"
  }'
```

**Expected Response:**
```json
{
  "success": true
}
```

### 4. Rescue Flare (Scout+ only)
```bash
curl -X POST https://zzsvexgiqxoyezblumpg.supabase.co/functions/v1/handle-rescue-request \
  -H "Authorization: Bearer SCOUT_JWT" \
  -H "Content-Type: application/json" \
  -d '{"location":"Stanton III","flareType":"MEDICAL"}'
```

**Expected:** Push notifications sent to subscribed rescue/medic users

### 5. Net Bridging (Founder+ only)
```bash
# Create two voice nets first, then link them:
curl -X POST https://zzsvexgiqxoyezblumpg.supabase.co/functions/v1/net-bridge \
  -H "Authorization: Bearer FOUNDER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceNetId":"uuid-1",
    "targetNetId":"uuid-2",
    "action":"link"
  }'
```

**Verify in database:**
```sql
SELECT * FROM voice_net_bridges;
```

---

## 🔍 Monitoring & Troubleshooting

### View Function Logs
```bash
npx supabase functions logs livekit-token --follow
```

Or in Supabase Dashboard → Edge Functions → [Function Name] → Logs

### Check Presence Mirror
```sql
-- Active participants
SELECT 
  room_name,
  participant_identity,
  participant_metadata->>'rank' as rank,
  joined_at
FROM voice_presence 
WHERE left_at IS NULL;

-- Stale presence (webhook issues?)
SELECT COUNT(*) 
FROM voice_presence 
WHERE left_at IS NULL 
  AND joined_at < now() - interval '10 minutes';
```

### Check Notification Queue
```sql
-- Pending notifications
SELECT type, COUNT(*) 
FROM notification_queue 
WHERE sent_at IS NULL 
GROUP BY type;

-- Recent deliveries
SELECT * FROM notification_queue 
WHERE sent_at IS NOT NULL 
ORDER BY sent_at DESC 
LIMIT 10;
```

### Common Issues

**Error: "LIVEKIT_API_KEY not set"**
- Solution: Set environment variables in Supabase Dashboard
- Redeploy functions after adding env vars

**Webhook signature fails**
- Solution: Ensure `LIVEKIT_WEBHOOK_SECRET` matches exactly in both LiveKit and Supabase
- No extra spaces or quotes

**Token returns 403**
- Check user's rank in profiles table
- Verify voice_nets has min_rank_to_join/rx/tx columns
- Confirm migrations applied: `npx supabase migration list`

**Push notifications not delivering**
- Verify VAPID keys match between backend and frontend subscription
- Check browser console for subscription errors
- Verify push_subscriptions table has entries

---

## 📚 Reference Documentation

- **API Reference:** `docs/BACKEND_IMPLEMENTATION_SUMMARY.md`
- **Full Deployment Guide:** `docs/DEPLOYMENT_RUNBOOK.md`
- **Testing Examples:** `docs/EDGE_FUNCTIONS_LOCAL_TESTING.md`
- **LiveKit Integration:** `docs/livekit-integration.md`

---

## 🚀 Ready to Test

1. ✅ Step 1: Environment variables configured
2. ✅ Step 2: LiveKit webhook configured
3. **Test all 5 flows listed above** ← Start here
4. Verify frontend integration (useLiveKitToken hook)
5. Monitor function logs for 24 hours
6. Update VOICE_COMMS_DEPLOYMENT_VALIDATION.md with results

---

**Deployment Progress:** 4/5 steps complete (Migrations + Functions + Configuration deployed | Testing pending)
