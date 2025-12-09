# Nomad Ops

This is a Vite+React app for the Nomad Ops dashboard.

## Running the app

```bash
npm install
npm run dev
```

## Building the app

```bash
npm run build
```
## Documentation

### Voice Communications & Backend APIs

Real-time voice communications powered by LiveKit with comprehensive backend support:

- **[Backend Implementation Summary](docs/BACKEND_IMPLEMENTATION_SUMMARY.md)** - All Edge Functions & database tables
- **[LiveKit Integration Architecture](docs/livekit-integration.md)** - Token flow and room connection
- **[LiveKit Hardening Summary](docs/livekit-hardening-summary.md)** - Recent improvements
- **[LiveKit Validation Checklist](docs/livekit-validation-checklist.md)** - Pre-deployment testing

**Key Frontend Files:**

- `src/hooks/useLiveKit.jsx` - LiveKit context provider (single source of truth)
- `src/hooks/useLiveKitToken.ts` - Token fetching hook  
- `src/layout/NomadShell.tsx` - Shell room setup
- `src/components/comms/CommsDashboardPanel.jsx` - Net selection & connection

**Key Backend Functions:**

- `supabase/functions/livekit-token/` - Token generation & RBAC
- `supabase/functions/academy-request/` - Mentorship requests
- `supabase/functions/academy-accept/` - Session acceptance & token pair
- `supabase/functions/handle-rescue-request/` - Medical flare notifications
- `supabase/functions/notifications-subscribe/` - Push subscription registration
- `supabase/functions/livekit-webhook/` - Presence mirroring
- `supabase/functions/net-bridge/` - Net linking (Founder+ only)
