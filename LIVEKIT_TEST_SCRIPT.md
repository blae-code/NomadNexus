# LiveKit Bleeding Edge Comms - Test Script
**Date**: December 9, 2025  
**Status**: Starting Test Suite  
**Goal**: Validate end-to-end voice comms system with rank-based tactical features

---

## TEST 1: Frontend Auth → Token Generation → Room Join

**What We're Testing**: Can users authenticate with Supabase and receive LiveKit tokens with correct rank-based permissions?

### Prerequisites
1. Have the app running: `npm run dev`
2. Navigate to app at `http://localhost:5173`
3. Have access to Supabase dashboard and function logs

### Steps

**Step 1a: Log in with a Scout user**
- Go to Login page
- Use any Scout-ranked user credentials (or create one if needed)
- Verify you reach the Comms Console/Dashboard

**Step 1b: Monitor token generation**
- Open browser DevTools (F12 → Console)
- Look for log: `[NomadLink] Secure Uplink Established.`
- If missing, check Network tab → Supabase functions calls

**Step 1c: Check Supabase function logs**
- Go to Supabase Dashboard → Edge Functions → livekit-token
- Click Logs tab
- Should see successful invocations with your user ID

**Step 1d: Verify token contains correct grants**
- In browser console, run:
  ```javascript
  // Decode JWT from useLiveKitToken hook (advanced: paste actual token)
  const token = "YOUR_TOKEN_HERE"; 
  const parts = token.split('.');
  const decoded = JSON.parse(atob(parts[1]));
  console.log(decoded);
  ```
- Check `grants` object has:
  - `canPublish: true` (if Scout+)
  - `canSubscribe: true`
  - `canPublishData: true` (if Scout+)

**Test Result**: ✅ PASS / ❌ FAIL / 🟡 PARTIAL

**Notes:**
```
[Results to be filled in after testing]
```

---

## TEST 2: Real-Time Participant Presence & Controls

**What We're Testing**: Do participants show up in the UI with speaking indicators? Do rank-based controls work?

### Prerequisites
- 2+ logged-in users at different ranks (Scout, Voyager, Founder preferred)
- Both users in same voice net

### Steps

**Step 2a: Join same voice net**
- User 1 (Scout): Select a voice net (e.g., "Campfire Alpha")
- Wait for "LiveKit room: connecting..." → shows "Connected"
- User 2 (Voyager): Join same net on different device/browser

**Step 2b: Verify presence panel updates**
- Both users should see each other in "Active Net Roster" (right panel)
- Names should display with rank insignia
- Status: should say "Online" 

**Step 2c: Test speaking indicators**
- User 1 speaks into mic (press spacebar for PTT or hold button)
- User 2 should see User 1's name highlight (emerald glow)
- When User 1 stops, glow should fade

**Step 2d: Test rank-gated controls**

| Control | Required Rank | User 1 (Scout) | User 2 (Voyager) |
|---------|---------------|----------------|------------------|
| Mute participant | Founder+ | ❌ Disabled | ✅ If User 2 is Founder |
| Whisper target | Scout+ | ✅ Can target | ✅ Can target |
| Broadcast | Voyager+ | ❌ Disabled | ✅ Enabled |
| Flare button | Scout+ | ✅ Enabled | ✅ Enabled |

**Test Result**: ✅ PASS / ❌ FAIL / 🟡 PARTIAL

**Notes:**
```
[Results to be filled in after testing]
```

---

## TEST 3: Spatial Audio & Role-Based Profiles

**What We're Testing**: Does audio apply role-based filters? Does spatial position affect stereo field?

### Prerequisites
- 2 users in same voice net
- Headphones (to test stereo positioning)
- Different roles if possible (e.g., one Ranger, one Industry)

### Steps

**Step 3a: Test role-based audio profile**
- User 1 selects role (if role selector available)
- User 1 speaks
- User 2 listens - does audio sound like it's been EQ'd?
  - Ranger role: Should sound crisp, clear
  - Industry role: Should sound more bass-heavy
  - Command role: Should sound compressed/professional
  
*Note: This is subtle and requires practiced ear*

**Step 3b: Test spatial audio (if position metadata available)**
- In voice net, check if participants have position metadata
- Move participant position (if UI supports it)
- Does voice pan left/right in stereo field?

**Step 3c: Test helmet comms distortion**
- Enable "Helmet Comms" mode (if available in UI)
- Listen for distortion/radio effect on audio

**Test Result**: ✅ PASS / ❌ FAIL / 🟡 PARTIAL

**Notes:**
```
[Results to be filled in after testing]
```

---

## TEST 4: Webhook → Presence Mirror Sync

**What We're Testing**: Does LiveKit webhook automatically populate voice_presence table?

### Prerequisites
- 2+ users can join voice rooms
- Access to Supabase SQL Editor
- LiveKit webhook configured (already done)

### Steps

**Step 4a: Join room and trigger webhook**
- User 1: Join a voice net
- Wait 2-3 seconds for webhook to fire

**Step 4b: Check presence table**
- Go to Supabase Dashboard → SQL Editor
- Run this query:
  ```sql
  SELECT * FROM voice_presence 
  WHERE joined_at > now() - interval '5 minutes'
  ORDER BY joined_at DESC;
  ```
- Should see entry with:
  - `room_name` = the net code (e.g., "campfire-alpha")
  - `participant_identity` = User 1's ID
  - `participant_metadata` = includes rank
  - `joined_at` = recent timestamp
  - `left_at` = NULL (while in room)

**Step 4c: Test stale cleanup**
- Run:
  ```sql
  SELECT COUNT(*) as stale_entries
  FROM voice_presence 
  WHERE left_at IS NULL 
    AND joined_at < now() - interval '10 minutes';
  ```
- Should be 0 (cleanup function removes entries older than 5 min)

**Step 4d: Leave room and verify cleanup**
- User 1: Leave voice net
- Wait 2-3 seconds
- Run:
  ```sql
  SELECT * FROM voice_presence 
  WHERE participant_identity = 'USER_1_ID'
  ORDER BY joined_at DESC;
  ```
- Should have `left_at` timestamp populated

**Test Result**: ✅ PASS / ❌ FAIL / 🟡 PARTIAL

**Notes:**
```
[Results to be filled in after testing]
```

---

## TEST 5: Voice Net Bridging (Founder+ Only)

**What We're Testing**: Can only Founder+ create bridges between voice nets?

### Prerequisites
- 2 voice nets created (Net A, Net B)
- 1 Founder-ranked user
- 1 Scout-ranked user

### Steps

**Step 5a: Scout attempts to bridge (should fail)**
- Scout user: Open voice nets UI
- Try to bridge Net A → Net B
- Expected: Button disabled or permission denied message

**Step 5b: Founder bridges nets (should succeed)**
- Founder user: Open voice nets UI
- Select Net A as source
- Select Net B as target
- Click "Link Nets" or "Bridge" button
- Expected: Success message

**Step 5c: Verify database entry**
- Go to Supabase SQL Editor
- Run:
  ```sql
  SELECT * FROM voice_net_bridges 
  WHERE source_net_id IN (
    SELECT id FROM voice_nets WHERE code IN ('NET_A_CODE', 'NET_B_CODE')
  );
  ```
- Should see entry with:
  - `source_net_id` = Net A ID
  - `target_net_id` = Net B ID
  - `created_by` = Founder user ID
  - `created_at` = recent

**Step 5d: Verify bridging functionality**
- User joins Net A
- User joins Net B (from same session)
- Both audio streams should be available simultaneously (if UI supports it)

**Test Result**: ✅ PASS / ❌ FAIL / 🟡 PARTIAL

**Notes:**
```
[Results to be filled in after testing]
```

---

## TEST 6: PTT & Tactical Commands (Rank-Gated)

**What We're Testing**: Does PTT work? Are rank gates enforced?

### Prerequisites
- Users at Scout+, Voyager+, Founder+ ranks
- Voice net selected

### Steps

**Step 6a: Test PTT hotkey**
- User: Press and hold SPACEBAR
- Should see "TRANSMITTING" indicator appear
- Release SPACEBAR
- Indicator should disappear
- Other users should hear audio (if audio working)

**Step 6b: Test Broadcast (Voyager+ only)**
- Scout user: Try to enable Broadcast toggle
  - Expected: Disabled/unavailable
- Voyager user: Try to enable Broadcast toggle
  - Expected: Enabled, toggles on/off
  - When on, all nets receive your audio

**Step 6c: Test Whisper (Scout+)**
- Scout user: Right-click participant → "Whisper"
- Select a target participant
- Only target should hear audio (private channel)

**Step 6d: Test Mute All (Founder+)**
- Scout user: Try to mute all button
  - Expected: Disabled/unavailable
- Founder user: Click "Mute All" button
  - Expected: All participants silenced
  - Can then "Solo" one participant to hear only them

**Step 6e: Verify data packets publish**
- Open browser Console (F12)
- Look for logs like: `[DataChannel] Publishing flare...`
- These indicate commands are being sent via LiveKit data channel

**Test Result**: ✅ PASS / ❌ FAIL / 🟡 PARTIAL

**Notes:**
```
[Results to be filled in after testing]
```

---

## TEST 7: Tactical Flares (Scout+ Only)

**What We're Testing**: Can Scout+ trigger medical/combat flares? Do notifications work?

### Prerequisites
- Scout+ user
- Access to Supabase to check notifications
- Multiple users to verify flare distribution

### Steps

**Step 7a: Scout triggers medical flare**
- Scout user: In voice net, click flare button → select "MEDICAL"
- Expected: Flare publishes via data channel
- Check console for: `[DataChannel] Publishing flare: MEDICAL`

**Step 7b: Verify notification queue**
- Go to Supabase SQL Editor
- Run:
  ```sql
  SELECT * FROM notification_queue 
  WHERE type = 'FLARE' 
    AND payload->>'flareType' = 'MEDICAL'
  ORDER BY created_at DESC
  LIMIT 5;
  ```
- Should see entry with:
  - `recipient_id` = other users/admins
  - `payload` = includes flareType, originator, location
  - `sent_at` = NULL (unless push notifications fully implemented)

**Step 7c: Vagrant attempts flare (should fail)**
- Vagrant user: Try to access flare button
  - Expected: Disabled or no flare icon visible

**Step 7d: Test both flare types**
- Scout: Trigger "MEDICAL" flare
- Scout: Trigger "COMBAT" flare
- Verify both show in notification_queue with correct type

**Step 7e: Test flare UI feedback**
- After triggering flare, UI should show:
  - Brief success animation
  - "Flare sent to {X} recipients"
  - Icon/badge indicating flare is active

**Test Result**: ✅ PASS / ❌ FAIL / 🟡 PARTIAL

**Notes:**
```
[Results to be filled in after testing]
```

---

## TEST 8: Full E2E Multi-User Scenario

**What We're Testing**: Do all systems work together in realistic scenario?

### Prerequisites
- 3 devices/browsers (or users)
- Users at Scout, Voyager, Founder ranks preferred
- All can join same voice net

### Test Scenario: Search & Rescue Operation

**Setup**:
- **Ranger** (Scout): Team member, can transmit, receive, flare
- **Mission Lead** (Voyager): Can broadcast, whisper, see all
- **Fleet Commander** (Founder): Can mute, solo, bridge nets

**Execution**:

**Step 8a: Team assembles in net**
1. Ranger joins "Rescue-Net-1"
2. Mission Lead joins "Rescue-Net-1"
3. Fleet Commander joins from another net, bridges "Rescue-Net-1" to "Command-Net"
4. Verify all 3 see each other

**Step 8b: Ranger broadcasts intel**
1. Ranger: Press SPACEBAR, speak "Contact at Stanton III"
2. Mission Lead: Hears transmission, sees Ranger's name highlighted
3. Fleet Commander: Hears via bridge, sees Ranger's data

**Step 8c: Mission Lead whispers to Ranger**
1. Mission Lead: Right-click Ranger → Whisper
2. Mission Lead: Speak private instruction
3. Ranger: Hears only Mission Lead
4. Fleet Commander: Cannot hear whisper

**Step 8d: Ranger triggers rescue flare**
1. Ranger: Click flare button → "MEDICAL"
2. Check Supabase: notification_queue has entry
3. Verify payload includes Ranger's location, flareType
4. Other users see visual indication

**Step 8e: Fleet Commander broadcasts priority message**
1. Fleet Commander: Enable Broadcast
2. Fleet Commander: Speak "Acknowledged. Medical team en route"
3. All nets receive message (via bridge)
4. UI shows "BROADCAST" label on Fleet Commander's voice

**Step 8f: Leave and cleanup**
1. Ranger leaves Rescue-Net-1
2. Mission Lead leaves Rescue-Net-1
3. Check voice_presence: both have left_at populated
4. Fleet Commander leaves, bridge remains available for re-use

**Test Result**: ✅ PASS / ❌ FAIL / 🟡 PARTIAL

**Critical Points**:
- [ ] No audio glitches or lag
- [ ] No UI unresponsiveness
- [ ] No console errors
- [ ] All rank gates enforced
- [ ] Database entries correct

**Notes:**
```
[Results to be filled in after testing]
```

---

## TEST SUMMARY

After completing all tests, fill in this summary:

| Test # | Name | Result | Issues | Notes |
|--------|------|--------|--------|-------|
| 1 | Auth → Token → Join | ? | ? | ? |
| 2 | Presence & Controls | ? | ? | ? |
| 3 | Spatial Audio | ? | ? | ? |
| 4 | Webhook Sync | ? | ? | ? |
| 5 | Net Bridging | ? | ? | ? |
| 6 | PTT & Commands | ? | ? | ? |
| 7 | Tactical Flares | ? | ? | ? |
| 8 | E2E Scenario | ? | ? | ? |

**Overall Status**: 🟡 NOT STARTED

### Critical Issues Found
```
[To be filled in]
```

### Performance Metrics
```
Token generation time: ? ms
Room join time: ? ms
Presence update latency: ? ms
Audio quality: ?
```

### Recommendations for Launch
```
[To be filled in after testing]
```

---

## Function Logs Reference

During testing, check these logs in Supabase:

**livekit-token function logs**:
```bash
npx supabase functions logs livekit-token --follow
```

**livekit-webhook function logs**:
```bash
npx supabase functions logs livekit-webhook --follow
```

**net-bridge function logs**:
```bash
npx supabase functions logs net-bridge --follow
```

---

## Emergency Rollback

If critical issues found:

1. Disable webhook in LiveKit Dashboard (disable notifications)
2. Reduce function permissions to read-only
3. Inform users of maintenance window
4. Check function logs for root cause
5. Roll back Edge Function code if needed: `npx supabase functions deploy [function-name]`

---

**Test Date**: ___________  
**Tested By**: ___________  
**Approved For Launch**: ___________  

