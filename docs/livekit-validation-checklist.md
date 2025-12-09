# LiveKit Integration Hardening - Validation Checklist

## Pre-Deployment Validation

Run through this checklist before deploying the LiveKit integration changes to production.

---

## 1. Code Quality ✅

- [x] No TypeScript/JavaScript errors in modified files
- [x] No ESLint errors introduced
- [x] All imports resolved correctly
- [x] No unused variables or dead code

**Status:** All checks passed (only unrelated CSS compatibility warnings)

---

## 2. Token Generation Path ✅

### Verify Legacy Path Removed

```bash
# Should return 0 results
grep -r "/functions/generateLiveKitToken" src/
```

**Expected:** No matches (legacy path removed)

### Verify Supabase Function Called

```bash
# Should find usages in useLiveKitToken.ts
grep -r "supabase.functions.invoke('livekit-token'" src/
```

**Expected:** Found in `src/hooks/useLiveKitToken.ts`

---

## 3. Supabase Edge Function

### Deploy Updated Function

```bash
cd supabase
supabase functions deploy livekit-token
```

**Expected:** Deployment successful

### Test Function Response

```bash
# Test via Supabase CLI
supabase functions invoke livekit-token --data '{
  "roomName": "test-room",
  "participantName": "test-user",
  "identity": "user-123",
  "role": "Scout"
}'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOi...",
  "serverUrl": "ws://your-livekit-server:7880"
}
```

### Verify Environment Variables

Check Supabase Dashboard → Settings → Edge Functions:

- [ ] `LIVEKIT_API_KEY` is set
- [ ] `LIVEKIT_API_SECRET` is set
- [ ] `LIVEKIT_URL` is set (e.g., `ws://your-server:7880`)

---

## 4. Room Configuration

### Verify Production Settings

Check `src/hooks/useLiveKit.jsx` line ~239:

```javascript
const lkRoom = new Room({
  adaptiveStream: true,           // ✓ Required
  dynacast: true,                  // ✓ Required
  stopLocalTrackOnUnpublish: true  // ✓ Required
});
```

**Status:** ✅ All production settings confirmed

---

## 5. Component Integration

### Check NomadShell.tsx

- [x] `LiveKitRoom` import removed
- [x] `LiveKitRoom` wrapper removed
- [x] `RoomAudioRenderer` conditionally rendered when room exists
- [x] `connect()` called with tokenOverride and serverUrlOverride

### Check useLiveKit.jsx

- [x] `connect()` requires tokenOverride and serverUrlOverride
- [x] Clear error message if credentials missing
- [x] No fallback to legacy token path

---

## 6. Connection State Normalization

### Verify Canonical Values Used

Check these files use string values: 'connected', 'connecting', 'disconnected', etc.

- [x] `src/components/layout/TacticalHeader.jsx` - deriveStatus()
- [x] `src/components/comms/CommsDashboardPanel.jsx` - connectionMetrics
- [x] `src/components/comms/NetworkStatusMonitor.jsx` - color mapping
- [x] `src/components/comms/CompactSignalMeter.jsx` - icon selection

**Status:** All components use normalized values

---

## 7. Documentation

### Verify Documentation Created

- [x] `docs/livekit-integration.md` - Architecture guide
- [x] `docs/livekit-hardening-summary.md` - Change summary
- [x] `src/hooks/useLiveKit.jsx` - File header documentation

### Verify Documentation Accuracy

- [x] Token flow diagram matches implementation
- [x] Connection state values match code
- [x] Room configuration matches actual settings
- [x] Code examples are syntactically correct

---

## 8. Runtime Testing

### Basic Connection Test

1. [ ] Start development server: `npm run dev`
2. [ ] Log in to application
3. [ ] Navigate to NomadShell component
4. [ ] Verify token fetch succeeds (check console: "[NomadLink] Secure Uplink Established.")
5. [ ] Verify room connection succeeds
6. [ ] Check connectionState shows 'connected' in UI

### Network Indicators Test

1. [ ] TacticalHeader shows "Connected" badge in green
2. [ ] CommsDashboardPanel displays connection metrics
3. [ ] NetworkStatusMonitor shows quality as 'excellent' or 'good'
4. [ ] CompactSignalMeter shows signal bars

### Audio Test

1. [ ] Click microphone button to unmute
2. [ ] Verify audioState changes to 'CONNECTED_OPEN'
3. [ ] Speak and verify audio is transmitted
4. [ ] Check remote participants hear audio
5. [ ] Click microphone button to mute
6. [ ] Verify audioState changes to 'CONNECTED_MUTED'

### Command Override Test (Commander+ Rank)

1. [ ] Log in as Commander or higher rank
2. [ ] Unmute microphone
3. [ ] Verify MUTE_ALL signal is sent
4. [ ] Verify other participants' audio is ducked to 20%
5. [ ] Mute microphone
6. [ ] Verify other participants' audio returns to 100%

### Whisper Test

1. [ ] Select a participant to whisper to
2. [ ] Click whisper button
3. [ ] Verify private audio track is created
4. [ ] Verify only target participant hears whisper
5. [ ] Click stop whisper
6. [ ] Verify audio returns to normal broadcast

### Reconnection Test

1. [ ] Disconnect network (airplane mode or disable WiFi)
2. [ ] Verify connectionState changes to 'disconnected'
3. [ ] Verify UI shows disconnected state
4. [ ] Reconnect network
5. [ ] Verify connectionState changes to 'reconnecting' then 'connected'
6. [ ] Verify audio resumes working

---

## 9. Error Handling

### Test Missing Token

Comment out token fetch temporarily and verify:

- [ ] Clear error message: "LiveKit credentials missing - tokenOverride and serverUrlOverride are required..."
- [ ] No infinite retry loops
- [ ] UI shows error state gracefully

### Test Invalid Token

Modify token to be invalid and verify:

- [ ] Connection fails gracefully
- [ ] Error is caught and displayed
- [ ] connectionState set to 'error'
- [ ] No application crash

### Test Network Failure

Simulate network failure during connection:

- [ ] Connection attempt times out gracefully
- [ ] Error state is set
- [ ] User is notified
- [ ] Retry mechanism works (if implemented)

---

## 10. Performance Verification

### Check for Memory Leaks

1. [ ] Connect to room
2. [ ] Disconnect from room
3. [ ] Repeat 10 times
4. [ ] Check Chrome DevTools Memory tab
5. [ ] Verify no significant memory growth
6. [ ] Verify tracks are properly cleaned up

### Check for Duplicate Connections

1. [ ] Open Chrome DevTools Network tab
2. [ ] Filter by WS (WebSocket)
3. [ ] Connect to room
4. [ ] Verify only ONE WebSocket connection to LiveKit server
5. [ ] Navigate to different pages
6. [ ] Verify no additional connections created

### Monitor Connection Metrics

1. [ ] Connect to room
2. [ ] Observe connectionMetrics state
3. [ ] Verify latencyMs updates every 2.5 seconds
4. [ ] Verify packetLoss is reasonable (< 5%)
5. [ ] Verify bandwidth values are non-zero when transmitting

---

## 11. Browser Compatibility

Test in multiple browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest) - if available
- [ ] Edge (latest)

Verify:
- Token fetch works
- WebSocket connection succeeds
- Audio transmission works
- UI indicators display correctly

---

## 12. Production Deployment Checklist

### Pre-Deploy

- [ ] All validation checks above passed
- [ ] Code reviewed by team
- [ ] Documentation reviewed and approved
- [ ] Supabase function deployed to production
- [ ] Environment variables verified in production Supabase project

### Deploy Steps

1. [ ] Merge changes to main branch
2. [ ] Deploy frontend to production
3. [ ] Verify production LiveKit server is reachable
4. [ ] Test connection with production credentials
5. [ ] Monitor Supabase function logs for errors
6. [ ] Monitor application error tracking (Sentry, etc.)

### Post-Deploy Monitoring

- [ ] Watch for token generation errors (Supabase logs)
- [ ] Monitor connection success rate
- [ ] Check for WebSocket connection errors
- [ ] Verify audio quality reports from users
- [ ] Monitor network metrics (latency, packet loss)

---

## 13. Rollback Plan

If issues are detected in production:

### Immediate Rollback

1. Revert frontend deployment to previous version
2. Revert Supabase function to previous version (if needed)
3. Notify team of rollback

### Investigate Issues

1. Check Supabase function logs
2. Check browser console errors
3. Check LiveKit server logs
4. Check WebSocket connection logs
5. Reproduce issue in staging/development

### Fix and Re-Deploy

1. Fix identified issues
2. Re-run validation checklist
3. Deploy to staging first
4. Test thoroughly in staging
5. Deploy to production with monitoring

---

## Sign-Off

Before production deployment, sign off on each section:

- [ ] Code Quality - Engineer: _______________
- [ ] Token Generation - Engineer: _______________
- [ ] Room Configuration - Engineer: _______________
- [ ] Documentation - Tech Lead: _______________
- [ ] Runtime Testing - QA: _______________
- [ ] Error Handling - QA: _______________
- [ ] Performance - DevOps: _______________
- [ ] Browser Compatibility - QA: _______________

**Final Approval:** _______________ (Lead Engineer/Tech Lead)

**Deployment Date:** _______________

---

## Support Contacts

- LiveKit Integration Issues: [Link to team Slack channel]
- Supabase Function Issues: [Link to DevOps]
- Production Incidents: [Link to on-call rotation]

---

## Post-Deployment Notes

_Record any issues encountered during deployment or immediate post-deployment period:_

```
[Date] [Time] - [Issue Description] - [Resolution]

Example:
2025-12-07 14:30 - Token fetch failed in Safari - Added CORS headers to Supabase function
```
