# NOMAD NEXUS TODO

This document outlines the phased development plan for the Nomad Nexus project, based on the "Gemini Instructions.txt" brief.

## Phase 1: Visual & Aesthetic Directives
- [x] Implement global styling constraints (no round corners, specific color palette).
- [x] Set up typography with technical monospace fonts.
- [x] Implement the 100vh non-scrolling grid layout (three-pane console).
- [x] Implement the "Red Shift" (Cockpit Mode) toggle.

## Phase 2: The "Bonfire" (Signal Map)
- [x] Implement Campfire Nodes with visual states (Idle, Active, LFG, Encrypted).
- [x] Implement the "Spark" (user presence) with tether line.
- [x] Implement "Tactical Flares" (Medical/Combat) with LiveKit Data Packet integration.
- [x] Integrate "Riggsy" voice alerts for flares.

## Phase 3: Async Comms: "The Data Slate"
- [x] Develop the "Data Slate" (Chat UI) in the right sidebar with terminal log visuals.
- [x] Implement "Holo-Thumbnails" for media in chat.
- [x] Implement "The Holo-Board" (announcements marquee).
- [x] Integrate Supabase for chat persistence.
- [x] Implement real-time chat via LiveKit Data Packets.

## Phase 4: Mission Control ("The Eternal Voyage")
- [x] Develop the "Holotable" (planner) with 3D/Isometric canvas.
- [x] Sync Holotable state via LiveKit Data Packets.
- [x] Implement voice control for Holotable manipulation ("Riggsy, pull up Stanton system.").
- [ ] Implement "Hangar Deck" (sign-up) with draggable Spark into ship slots.
- [ ] Implement Smart Gating for ship slots based on user certification.
- [ ] Integrate "Riggsy" warnings for ship slot analysis.

## Phase 5: The Academy ("The Ritual")
- [ ] Develop "The Training Deck" (request system) with "Skill Chips" grid.
- [ ] Implement "Request Instruction" action.
- [ ] Implement routing of requests to qualified instructors.
- [ ] Develop "Neural Link" (active session) for private Voice+Chat.
- [ ] Implement objective tracking for XP/Reputation.

## Phase 6: The "Nomad Audio Engine" (Advanced DSP)
- [x] Implement Diegetic Audio Profiles (Rangers, Industry, Command) using Web Audio API filters.
- [ ] Implement Spatial Audio mapping Node position to stereo field.
- [x] Implement Priority Ducking for Pioneer's speech.

## Phase 7: Automation ("Riggsy")
- [ ] Develop "Riggsy" persona (salty Chief Engineer).
- [ ] Implement Python Agent (Local/Edge) architecture.
- [ ] Implement Gated listening for Riggsy (ALT key).
- [ ] Integrate Deepgram Nova-2 for STT.
- [ ] Integrate Piper TTS for local custom voice output.
- [ ] Implement command parsing and execution for Riggsy.
- [ ] Develop Riggsy's dialogue responses.

## Phase 8: Identity, Admin & Mobile
- [ ] Implement "The Service Record" (User Profiles) with Supabase Auth ID linking.
- [ ] Implement Certifications and role toggling.
- [ ] Develop "The Brig" (Admin interface) for user management.
- [ ] Implement "Silence" (force-mute) and "Discharge" (ban) actions.
- [ ] Implement "Pocket MFD" (Mobile Portrait) layout with active Campfires list and Data Slate.
- [ ] Integrate "Sub-Space Relays" (Push API) for Tactical Flare notifications.

## Phase 9: Technical Stack & Workflow (Documentation/Setup)
- [ ] Document Frontend: React + Vite + TypeScript (PWA).
- [ ] Document Styling: Tailwind CSS (Custom Config).
- [ ] Document Real-Time: LiveKit Cloud (Free Tier).
- [ ] Document Database/Auth: Supabase (Free Tier).
- [ ] Document State: Zustand (Client), TanStack Query (Server State).
- [ ] Document Agentic Workflow (Gemini Instructions).
- [ ] Verify Final Checklist items.