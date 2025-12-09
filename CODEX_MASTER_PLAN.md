# NomadNexus Master Implementation Plan

**Last Updated:** December 9, 2025  
**Status:** Voice comms complete, backend deployed, Academy & Riggsy in progress

---

## PHASE 1: THE HARD-LINE (Deep LiveKit Integration) ✅ COMPLETE

[x] 1.1 Dependency Verification: @livekit/components-react and livekit-client installed and configured.

[x] 1.2 Shell Injection (src/layout/NomadShell.tsx):
- Application uses LiveKitProvider context
- useLiveKitToken fetches credentials dynamically from Supabase Edge Function (livekit-token)
- RoomAudioRenderer integrated for playback
- Custom Nomad Audio Engine (AudioProcessor, SpatialMixer, TacticalTransceiver) initialized

[x] 1.3 The Audio Pipeline:
- Audio tracks processed through role-based filters (Ranger/Industry/Command)
- "Helmet Comms" distortion effects applied via Web Audio API
- Spatial audio mixing based on participant position metadata

PHASE 2: THE NEURAL LINK (Command Palette Overhaul) 🔵 PLANNED

[ ] 2.1 Visual Refit (src/components/layout/CommandPalette.jsx):
- Redesign input container as military glass
- Idle State: Breathing border effect (zinc-800 <-> amber-900)
- Active State: Mechanical expansion with corner brackets

[ ] 2.2 Intelligent Parsing:
- Implement slash commands (/deploy, /hail)
- Render "Command Chip" inside input bar

[ ] 2.3 Audio Visualization:
- Add reactive waveform bar
- Animate when user speaks via useRiggsy

PHASE 3: NAVIGATION CONSOLIDATION (Layout Clean-up) ✅ COMPLETE

[x] 3.1 Header Unification (src/components/layout/TacticalHeader.jsx):
- Merged CurrentStatusHeader and StatusRail data
- Connection Status indicator integrated (Connected/Connecting/Disconnected)

[x] 3.2 Sidebar structure established with tactical navigation

[x] 3.3 View Mode switches implemented (Standard/Operator/Command)

PHASE 4: COMMS CONSOLE (Real-Time UI) ✅ COMPLETE

[x] 4.1 Active Net Logic (src/components/comms/ActiveNetPanel.jsx):
- useParticipants() from LiveKit integrated
- Speaking indicators (pulsing emerald background)
- Muted state icons (slashed mic in red)

[x] 4.2 PTT Hard-Wiring:
- usePTT.js hook integrated
- SPACEBAR mapped to mic control
- Visual feedback: TRANSMITTING light

[x] 4.3 Tactical Flares:
- TacticalTransceiver wired to data packets
- UI alert animations on flare reception
- Medical/Combat flare types supported

PHASE 5: VISUAL SUPREMACY (The Polish) ✅ COMPLETE

[x] 5.1 Global Styles (src/index.css):
- Military-themed utilities defined
- Scanline overlays, label plates, data cells

[x] 5.2 Dashboard Refactor (src/pages/NomadOpsDashboard.jsx):
- High-contrast classes applied
- Grid gaps with bg-black

[x] 5.3 Mobile Hardening:
- Responsive layout switches to flex-col < 768px

🛠️ STEP 2: EXECUTION LOOP
Once CODEX_MASTER_PLAN.md is created, proceed to execute the tasks one by one.

PROTOCOL FOR EACH TASK:

Read: Review the specific requirements for the task.

Edit: Modify the target files.

Verify: Confirm the code meets the "Visual Laws" (No round corners) and "Functional Requirements" (LiveKit wiring).

Update: Mark the task as [x] in CODEX_MASTER_PLAN.md.
