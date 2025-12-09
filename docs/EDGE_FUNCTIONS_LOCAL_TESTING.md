# Edge Function Testing Guide

This guide provides step-by-step instructions for testing all 7 backend Edge Functions locally and in production.

## Prerequisites

1. **Supabase CLI installed**: `npm install -g supabase`
2. **Local Supabase running**: `supabase start`
3. **Test data created**: Users at different ranks, test voice nets, etc.
4. **JWT tokens**: For authenticated requests
5. **curl or Postman**: For making HTTP requests

## Getting Started

### Start Local Supabase

```bash
cd c:\Users\Owner\NomadNexus
supabase start
```

Output will show:
- Supabase URL: `http://localhost:54321`
- Anon Key: `eyJhbGc...` (for client)
- Service Role Key: `eyJhbGc...` (for Edge Functions)

### Generate Test JWT Tokens

Use Supabase CLI to generate tokens:

```bash
# Get your local Supabase project reference
supabase projects list

# Generate JWT for a test user (replace PROJECT_REF and USER_ID)
supabase auth users create --email test@example.com --password TestPassword123
supabase auth get-access-token --user-id=<USER_ID>
```

Or use `supabase.auth.getSession()` from frontend to copy real tokens.

### Create Test Data

Before testing flows, create necessary test data:

```sql
-- Create test users (run in Supabase console or SQL editor)
insert into public.profiles (id, email, rank, roles)
values
  ('user-scout', 'scout@test.com', 'scout', '["scout"]'),
  ('user-voyager', 'voyager@test.com', 'voyager', '["voyager"]'),
  ('user-founder', 'founder@test.com', 'founder', '["founder"]'),
  ('user-vagrant', 'vagrant@test.com', 'vagrant', '["vagrant"]');

-- Create test voice nets
insert into public.voice_nets (code, label, type, min_rank_to_tx, min_rank_to_rx)
values
  ('campfire-alpha', 'Campfire Alpha', 'campfire', 'scout', 'scout'),
  ('command-core', 'Command Core', 'command', 'voyager', 'scout'),
  ('fleet-general', 'Fleet General', 'fleet', 'founder', 'scout');

-- Create test skill and certification
insert into public.skills (id, name)
values ('skill-nav', 'Navigation');

insert into public.certifications (user_id, skill_id)
values ('user-scout', 'skill-nav');
```

---

## Function Testing

### 1. LiveKit Token Generation

**Endpoint**: `POST /functions/v1/livekit-token`

**Purpose**: Generate JWT tokens for LiveKit room access with RBAC enforcement

**Test Cases**:

#### 1a. Scout User - Valid Request

```bash
curl -i -X POST http://localhost:54321/functions/v1/livekit-token \
  -H "Authorization: Bearer YOUR_SCOUT_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "campfire-alpha",
    "participantName": "Scout User",
    "identity": "user-scout"
  }'
```

**Expected Response** (200):
```json
{
  "token": "eyJhbGc...",
  "serverUrl": "wss://your-livekit-url"
}
```

✅ **Pass**: Returns token and serverUrl, token includes `canPublish: true`

#### 1b. Vagrant User - Insufficient Clearance

```bash
curl -i -X POST http://localhost:54321/functions/v1/livekit-token \
  -H "Authorization: Bearer YOUR_VAGRANT_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "campfire-alpha",
    "participantName": "Vagrant User",
    "identity": "user-vagrant"
  }'
```

**Expected Response** (403):
```json
{
  "error": "INSUFFICIENT_CLEARANCE"
}
```

✅ **Pass**: Vagrant is blocked from all nets

#### 1c. Scout on Voyager-Only Net

```bash
curl -i -X POST http://localhost:54321/functions/v1/livekit-token \
  -H "Authorization: Bearer YOUR_SCOUT_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "fleet-general",
    "participantName": "Scout User"
  }'
```

**Expected Response** (403):
```json
{
  "error": "INSUFFICIENT_CLEARANCE"
}
```

✅ **Pass**: Scout cannot access Founder+ net

#### 1d. Missing JWT

```bash
curl -i -X POST http://localhost:54321/functions/v1/livekit-token \
  -H "Content-Type: application/json" \
  -d '{"roomName":"campfire-alpha","participantName":"Test"}'
```

**Expected Response** (401):
```json
{
  "error": "UNAUTHORIZED"
}
```

✅ **Pass**: Rejects unauthenticated requests

#### 1e. Missing Required Field

```bash
curl -i -X POST http://localhost:54321/functions/v1/livekit-token \
  -H "Authorization: Bearer YOUR_SCOUT_JWT" \
  -H "Content-Type: application/json" \
  -d '{"roomName":"campfire-alpha"}'
```

**Expected Response** (400):
```json
{
  "error": "BAD_REQUEST",
  "details": "roomName and participantName are required"
}
```

✅ **Pass**: Validates required fields

---

### 2. Academy Request (Mentorship)

**Endpoint**: `POST /functions/v1/academy-request`

**Purpose**: Create mentorship requests and notify certified mentors

**Test Cases**:

#### 2a. Scout Creates Valid Request

```bash
curl -i -X POST http://localhost:54321/functions/v1/academy-request \
  -H "Authorization: Bearer YOUR_SCOUT_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "skillId": "skill-nav"
  }'
```

**Expected Response** (200):
```json
{
  "requestId": "uuid",
  "status": "PENDING"
}
```

**Verify in Database**:
```sql
select * from public.instruction_requests where id = 'uuid';
-- Should show: status='PENDING', student_id='user-scout', skill_id='skill-nav'

select * from public.notification_queue where type='academy_request';
-- Should have entry for certified mentor (user-scout is certified in skill-nav)
```

✅ **Pass**: Request created, mentor notification enqueued

#### 2b. Missing Skill

```bash
curl -i -X POST http://localhost:54321/functions/v1/academy-request \
  -H "Authorization: Bearer YOUR_SCOUT_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "skillId": "nonexistent-skill"
  }'
```

**Expected Response** (400 or 404):
```json
{
  "error": "BAD_REQUEST",
  "details": "Skill not found"
}
```

✅ **Pass**: Validates skill exists

#### 2c. Brigged User Cannot Request

```bash
-- First: Mark user as brigged
update public.profiles set roles = array['brig'] where id = 'user-scout';

curl -i -X POST http://localhost:54321/functions/v1/academy-request \
  -H "Authorization: Bearer YOUR_SCOUT_JWT" \
  -H "Content-Type: application/json" \
  -d '{"skillId": "skill-nav"}'
```

**Expected Response** (403):
```json
{
  "error": "FORBIDDEN",
  "details": "User is brigged"
}
```

✅ **Pass**: Prevents brigged users from requesting

---

### 3. Academy Accept (Mentorship)

**Endpoint**: `POST /functions/v1/academy-accept`

**Purpose**: Accept mentorship request, generate sim pod, issue token pair

**Test Cases**:

#### 3a. Mentor Accepts Valid Request

First, create a request (from test 2a), then accept it:

```bash
# Get the requestId from test 2a, then:
curl -i -X POST http://localhost:54321/functions/v1/academy-accept \
  -H "Authorization: Bearer YOUR_SCOUT_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "uuid-from-test-2a"
  }'
```

**Expected Response** (200):
```json
{
  "status": "ACTIVE",
  "simPodId": "sim-pod-abc123",
  "connectionTokens": {
    "cadet": "eyJhbGc...",
    "guide": "eyJhbGc..."
  },
  "serverUrl": "wss://your-livekit-url"
}
```

**Verify in Database**:
```sql
select * from public.instruction_requests where id = 'uuid-from-test-2a';
-- Should show: status='ACTIVE', guide_id='user-scout'

select * from public.voice_nets where code like 'sim-pod-%';
-- Should have created temporary voice net for sim pod
```

✅ **Pass**: Request accepted, sim pod created, tokens issued

#### 3b. Non-Certified Cannot Accept

```bash
# Create request with Scout requiring a skill Scout isn't certified in
-- Update: create a new skill that Scout is NOT certified in
insert into public.skills (id, name) values ('skill-advanced', 'Advanced Tactics');

-- Create request as Voyager for this skill
-- Then try to accept as Scout (not certified)

curl -i -X POST http://localhost:54321/functions/v1/academy-accept \
  -H "Authorization: Bearer YOUR_SCOUT_JWT" \
  -H "Content-Type: application/json" \
  -d '{"requestId": "uuid-not-certified"}'
```

**Expected Response** (403):
```json
{
  "error": "FORBIDDEN",
  "details": "Not certified in required skill"
}
```

✅ **Pass**: Only certified mentors can accept

#### 3c. Request Already Accepted

```bash
# Accept same request twice
curl -i -X POST http://localhost:54321/functions/v1/academy-accept \
  -H "Authorization: Bearer YOUR_SCOUT_JWT" \
  -H "Content-Type: application/json" \
  -d '{"requestId": "already-active-uuid"}'
```

**Expected Response** (400 or 409):
```json
{
  "error": "BAD_REQUEST",
  "details": "Request is not PENDING"
}
```

✅ **Pass**: Prevents accepting non-PENDING requests

---

### 4. Push Notification Subscribe

**Endpoint**: `POST /functions/v1/notifications-subscribe`

**Purpose**: Register Web Push subscription endpoint

**Test Cases**:

#### 4a. Valid Subscription Registration

```bash
curl -i -X POST http://localhost:54321/functions/v1/notifications-subscribe \
  -H "Authorization: Bearer YOUR_SCOUT_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://fcm.googleapis.com/fcm/send/abc123",
    "auth": "auth-key-base64",
    "p256dh": "p256dh-key-base64"
  }'
```

**Expected Response** (200 or 201):
```json
{
  "subscriptionId": "uuid",
  "status": "registered"
}
```

**Verify in Database**:
```sql
select * from public.push_subscriptions where user_id = 'user-scout';
-- Should have endpoint, auth, p256dh columns populated
```

✅ **Pass**: Subscription registered

#### 4b. Update Existing Subscription

```bash
# Call again with same endpoint but different keys
curl -i -X POST http://localhost:54321/functions/v1/notifications-subscribe \
  -H "Authorization: Bearer YOUR_SCOUT_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://fcm.googleapis.com/fcm/send/abc123",
    "auth": "new-auth-key",
    "p256dh": "new-p256dh-key"
  }'
```

**Expected Response** (200):
```json
{
  "subscriptionId": "uuid",
  "status": "updated"
}
```

✅ **Pass**: Upserts subscription (updates if exists)

#### 4c. Missing Required Field

```bash
curl -i -X POST http://localhost:54321/functions/v1/notifications-subscribe \
  -H "Authorization: Bearer YOUR_SCOUT_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://fcm.googleapis.com/fcm/send/abc123"
  }'
```

**Expected Response** (400):
```json
{
  "error": "BAD_REQUEST",
  "details": "endpoint, auth, and p256dh are required"
}
```

✅ **Pass**: Validates required fields

---

### 5. Handle Rescue Request (Flare Notifications)

**Endpoint**: `POST /functions/v1/handle-rescue-request`

**Purpose**: Send Web Push notifications for medical flares to rescue/medic users

**Test Cases**:

#### 5a. Scout Sends Medical Flare

```bash
curl -i -X POST http://localhost:54321/functions/v1/handle-rescue-request \
  -H "Authorization: Bearer YOUR_SCOUT_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "flareType": "MEDICAL",
    "location": "Stanton III - Crusader"
  }'
```

**Expected Response** (200):
```json
{
  "notificationsSent": 2,
  "failedCount": 0
}
```

**Verify in Database**:
```sql
select * from public.notification_queue 
where type='rescue_flare' and message like '%MEDICAL%';
-- Should have entries for rescue-trained users
```

✅ **Pass**: Flare sent to eligible recipients

#### 5b. Vagrant Cannot Send Flare

```bash
curl -i -X POST http://localhost:54321/functions/v1/handle-rescue-request \
  -H "Authorization: Bearer YOUR_VAGRANT_JWT" \
  -H "Content-Type: application/json" \
  -d '{"flareType":"MEDICAL","location":"Test"}'
```

**Expected Response** (403):
```json
{
  "error": "FORBIDDEN",
  "details": "Insufficient rank (Scout+ required)"
}
```

✅ **Pass**: Scout+ RBAC enforced

#### 5c. Rate Limiting (15s per user)

```bash
# Send flare
curl -s -X POST http://localhost:54321/functions/v1/handle-rescue-request \
  -H "Authorization: Bearer YOUR_SCOUT_JWT" \
  -H "Content-Type: application/json" \
  -d '{"flareType":"MEDICAL","location":"Test1"}'

# Try again immediately
curl -i -X POST http://localhost:54321/functions/v1/handle-rescue-request \
  -H "Authorization: Bearer YOUR_SCOUT_JWT" \
  -H "Content-Type: application/json" \
  -d '{"flareType":"MEDICAL","location":"Test2"}'
```

**Expected Response** (429):
```json
{
  "error": "TOO_MANY_REQUESTS",
  "details": "Rate limit exceeded (15s minimum)"
}
```

✅ **Pass**: Per-user rate limiting works

---

### 6. LiveKit Webhook

**Endpoint**: `POST /functions/v1/livekit-webhook`

**Purpose**: Receive LiveKit events and mirror presence to database

**Test Cases**:

#### 6a. Participant Joined Event (with valid HMAC)

```bash
# Generate HMAC signature (requires LIVEKIT_WEBHOOK_SECRET)
# In Node.js:
# const crypto = require('crypto');
# const secret = 'your-livekit-webhook-secret';
# const payload = JSON.stringify({...event...});
# const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64');

curl -i -X POST http://localhost:54321/functions/v1/livekit-webhook \
  -H "Content-Type: application/json" \
  -H "X-Livekit-Signature: your-hmac-signature" \
  -d '{
    "event": "participant_joined",
    "room": {
      "name": "campfire-alpha"
    },
    "participant": {
      "identity": "user-scout",
      "sid": "participant-sid-123",
      "metadata": "{\"userId\":\"user-scout\",\"role\":\"scout\"}"
    }
  }'
```

**Expected Response** (200):
```json
{
  "status": "ok"
}
```

**Verify in Database**:
```sql
select * from public.voice_presence where room_name = 'campfire-alpha';
-- Should have entry with participant_identity='user-scout', left_at=null
```

✅ **Pass**: Presence recorded

#### 6b. Invalid HMAC Signature

```bash
curl -i -X POST http://localhost:54321/functions/v1/livekit-webhook \
  -H "Content-Type: application/json" \
  -H "X-Livekit-Signature: invalid-signature" \
  -d '{"event":"participant_joined",...}'
```

**Expected Response** (401):
```json
{
  "error": "UNAUTHORIZED",
  "details": "Invalid webhook signature"
}
```

✅ **Pass**: Signature verification enforced

#### 6c. Participant Left Event

```bash
# Same as 6a but with event='participant_left'
curl -i -X POST http://localhost:54321/functions/v1/livekit-webhook \
  -H "Content-Type: application/json" \
  -H "X-Livekit-Signature: valid-hmac" \
  -d '{
    "event": "participant_left",
    "room": {"name": "campfire-alpha"},
    "participant": {"identity": "user-scout"}
  }'
```

**Expected Response** (200):
```json
{
  "status": "ok"
}
```

**Verify in Database**:
```sql
select * from public.voice_presence 
where room_name = 'campfire-alpha' and participant_identity = 'user-scout';
-- Should have left_at timestamp populated
```

✅ **Pass**: Presence updated on leave

---

### 7. Net Bridge

**Endpoint**: `POST /functions/v1/net-bridge`

**Purpose**: Link/unlink two voice nets (Founder+ only)

**Test Cases**:

#### 7a. Founder Links Nets

```bash
curl -i -X POST http://localhost:54321/functions/v1/net-bridge \
  -H "Authorization: Bearer YOUR_FOUNDER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceNetId": "uuid-campfire-alpha",
    "targetNetId": "uuid-command-core",
    "action": "link"
  }'
```

**Expected Response** (200):
```json
{
  "id": "bridge-uuid",
  "sourceNetId": "uuid-campfire-alpha",
  "targetNetId": "uuid-command-core",
  "action": "link"
}
```

**Verify in Database**:
```sql
select * from public.voice_net_bridges;
-- Should have entry linking the two nets
```

✅ **Pass**: Bridge created

#### 7b. Voyager Cannot Bridge (insufficient rank)

```bash
curl -i -X POST http://localhost:54321/functions/v1/net-bridge \
  -H "Authorization: Bearer YOUR_VOYAGER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceNetId": "uuid1",
    "targetNetId": "uuid2",
    "action": "link"
  }'
```

**Expected Response** (403):
```json
{
  "error": "FORBIDDEN",
  "details": "Insufficient rank (Founder+ required)"
}
```

✅ **Pass**: RBAC enforced

#### 7c. Founder Unlinks Nets

```bash
curl -i -X POST http://localhost:54321/functions/v1/net-bridge \
  -H "Authorization: Bearer YOUR_FOUNDER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceNetId": "uuid-campfire-alpha",
    "targetNetId": "uuid-command-core",
    "action": "unlink"
  }'
```

**Expected Response** (200):
```json
{
  "deleted": true
}
```

**Verify in Database**:
```sql
select * from public.voice_net_bridges;
-- Entry should be deleted
```

✅ **Pass**: Bridge deleted

#### 7d. Cannot Bridge Non-Existent Net

```bash
curl -i -X POST http://localhost:54321/functions/v1/net-bridge \
  -H "Authorization: Bearer YOUR_FOUNDER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceNetId": "nonexistent-uuid",
    "targetNetId": "uuid2",
    "action": "link"
  }'
```

**Expected Response** (400 or 404):
```json
{
  "error": "BAD_REQUEST",
  "details": "Net not found"
}
```

✅ **Pass**: Validates nets exist

---

## Summary Test Script

Run all tests in sequence:

```bash
#!/bin/bash

echo "=== Testing LiveKit Token ==="
# Test 1a, 1b, 1c, 1d, 1e

echo "=== Testing Academy Request ==="
# Test 2a, 2b, 2c

echo "=== Testing Academy Accept ==="
# Test 3a, 3b, 3c

echo "=== Testing Push Subscribe ==="
# Test 4a, 4b, 4c

echo "=== Testing Rescue Flare ==="
# Test 5a, 5b, 5c

echo "=== Testing LiveKit Webhook ==="
# Test 6a, 6b, 6c

echo "=== Testing Net Bridge ==="
# Test 7a, 7b, 7c, 7d

echo "All tests completed!"
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| `401 UNAUTHORIZED` on all requests | Missing or invalid JWT | Ensure JWT is valid and passed in Authorization header |
| `500 INTERNAL_SERVER_ERROR` | Missing env variables | Check `supabase secrets list` and ensure all required vars are set |
| Webhook not receiving events | Wrong signature | Verify `LIVEKIT_WEBHOOK_SECRET` matches LiveKit dashboard |
| Token generation returns vagrant grants | Rank lookup failed | Verify `profiles.rank` is set correctly in database |
| Push notifications not sent | No subscriptions | Call `notifications-subscribe` first to register endpoint |
| Rate limiting too strict/loose | Per-user 15s window | Check `handle-rescue-request` rate limit logic |

---

## Next Steps

After completing all tests:

1. ✅ Verify all test cases pass
2. ✅ Document any issues or edge cases
3. ✅ Review function logs: `supabase functions logs <name>`
4. ✅ Check database for expected entries
5. ✅ Proceed to production deployment (see `DEPLOYMENT_RUNBOOK.md`)
