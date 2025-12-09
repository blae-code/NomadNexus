# NOMAD NEXUS TODO

**Last Updated:** December 9, 2025  
**Current Status:** Backend deployment preparation complete, Academy & frontend polish in progress

This document outlines the development plan for the Nomad Nexus project.

## Phase 1: Visual & Aesthetic Directives ✅ COMPLETE

- [x] Implement global styling constraints (no round corners, specific color palette)
- [x] Set up typography with technical monospace fonts
- [x] Implement the 100vh non-scrolling grid layout (three-pane console)
- [x] Implement the "Red Shift" (Cockpit Mode) toggle

## Phase 2: The "Bonfire" (Signal Map) ✅ COMPLETE

- [x] Implement Campfire Nodes with visual states (Idle, Active, LFG, Encrypted)
- [x] Implement the "Spark" (user presence) with tether line
- [x] Implement "Tactical Flares" (Medical/Combat) with LiveKit Data Packet integration
- [x] Integrate "Riggsy" voice alerts for flares

## Phase 3: Async Comms: "The Data Slate" ✅ COMPLETE

- [x] Develop the "Data Slate" (Chat UI) in the right sidebar with terminal log visuals
- [x] Implement "Holo-Thumbnails" for media in chat
- [x] Implement "The Holo-Board" (announcements marquee)
- [x] Integrate Supabase for chat persistence
- [x] Implement real-time chat via LiveKit Data Packets

## Phase 4: Mission Control ("The Eternal Voyage") 🟡 IN PROGRESS

- [x] Develop the "Holotable" (planner) with 3D/Isometric canvas
- [x] Sync Holotable state via LiveKit Data Packets
- [x] Implement voice control for Holotable manipulation ("Riggsy, pull up Stanton system")
- [ ] Implement "Hangar Deck" (sign-up) with draggable Spark into ship slots
- [ ] Implement Smart Gating for ship slots based on user certification
- [ ] Integrate "Riggsy" warnings for ship slot analysis

## Phase 5: The Academy ("The Ritual") 🟡 IN PROGRESS

- [x] Backend: academy-request Edge Function (create mentorship requests)
- [x] Backend: academy-accept Edge Function (accept requests, generate sim pods)
- [ ] Frontend: "The Training Deck" (request system) with "Skill Chips" grid
- [ ] Frontend: Implement "Request Instruction" action
- [ ] Frontend: Display certified mentors and request status
- [ ] Frontend: "Neural Link" (active session) for private Voice+Chat in sim pods
- [ ] Backend: Implement objective tracking for XP/Reputation

## Phase 6: The "Nomad Audio Engine" (Advanced DSP) ✅ COMPLETE

- [x] Implement Diegetic Audio Profiles (Rangers, Industry, Command) using Web Audio API filters
- [x] Implement Spatial Audio mapping Node position to stereo field
- [x] Implement Priority Ducking for Pioneer's speech

## Phase 7: Backend Infrastructure ✅ COMPLETE

- [x] LiveKit token generation (livekit-token Edge Function)
- [x] Push notification subscription (notifications-subscribe Edge Function)
- [x] Rescue flare handling (handle-rescue-request Edge Function)
- [x] LiveKit webhook receiver (livekit-webhook Edge Function)
- [x] Voice net bridging (net-bridge Edge Function)
- [x] Database migrations (voice_nets_rbac, voice_presence, notification_queue)
- [x] Deployment documentation (DEPLOYMENT_RUNBOOK.md)
- [x] Environment configuration (.env.example)

## Phase 8: Automation ("Riggsy") 🔵 PLANNED

- [ ] Develop "Riggsy" persona (salty Chief Engineer)
- [ ] Implement Python Agent (Local/Edge) architecture
- [ ] Implement Gated listening for Riggsy (ALT key)
- [ ] Integrate Deepgram Nova-2 for STT
- [ ] Integrate Piper TTS for local custom voice output
- [ ] Implement command parsing and execution for Riggsy
- [ ] Develop Riggsy's dialogue responses

## Phase 9: Identity, Admin & Mobile 🟡 IN PROGRESS

- [x] Implement "The Service Record" (User Profiles) with Supabase Auth ID linking
- [x] Implement Certifications and role toggling
- [x] Develop "The Brig" (Admin interface) for user management
- [ ] Implement "Silence" (force-mute) and "Discharge" (ban) backend actions
- [ ] Implement "Pocket MFD" (Mobile Portrait) layout with active Campfires list and Data Slate
- [x] Integrate "Sub-Space Relays" (Push API) for Tactical Flare notifications

## Phase 10: Documentation & Deployment ✅ COMPLETE

- [x] Frontend: React + Vite + TypeScript (PWA)
- [x] Styling: Tailwind CSS (Custom Config)
- [x] Real-Time: LiveKit Cloud
- [x] Database/Auth: Supabase
- [x] State: Zustand (Client), TanStack Query (Server State)
- [x] Backend API Reference (BACKEND_IMPLEMENTATION_SUMMARY.md)
- [x] Testing Guide (EDGE_FUNCTIONS_LOCAL_TESTING.md)
- [x] Deployment Runbook (DEPLOYMENT_RUNBOOK.md)
