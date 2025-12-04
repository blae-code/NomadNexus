PHASE 1: THE HARD-LINE (Deep LiveKit Integration)

[ ] 1.1 Dependency Verification: Verify @livekit/components-react and livekit-client are installed.

[ ] 1.2 Shell Injection (src/layout/NomadShell.tsx):

Wrap the application Outlet in <LiveKitRoom>.

Implement useLiveKitToken to fetch credentials dynamically from Supabase.

CRITICAL: Include <RoomAudioRenderer /> (hidden) for playback.

CRITICAL: Initialize the custom Nomad Audio Engine classes (AudioProcessor, SpatialMixer, TacticalTransceiver) within a useEffect on mount. Bind them to the Room instance.

[ ] 1.3 The Audio Pipeline: Modify the LiveKitRoom configuration to pipe the local microphone track through AudioProcessor.processLocalTrack() before publishing. This adds the "Helmet Comms" distortion effect.

PHASE 2: THE NEURAL LINK (Command Palette Overhaul)

[ ] 2.1 Visual Refit (src/components/layout/CommandPalette.jsx): Redesign the input container to look like a piece of military glass.

Idle State ("Standby"): A slow, rhythmic "Breathing" border effect (border-zinc-800 <-> border-amber-900). A solid Amber "Status Diode" indicates the system is listening.

Active State ("Targeting"): The container expands mechanically. Corner brackets ("Reticles") snap outward.

[ ] 2.2 Intelligent Parsing: Implement "Slash Commands" (e.g., /deploy, /hail). When detected, render a "Command Chip" inside the input bar.

[ ] 2.3 Audio Visualization: Add a reactive waveform bar inside the palette that animates when the user speaks (or simulates listening via useRiggsy).

PHASE 3: NAVIGATION CONSOLIDATION (Layout Clean-up)

[ ] 3.1 Header Unification (src/components/layout/TacticalHeader.jsx):

Merge: Absorb all data from CurrentStatusHeader and StatusRail into this single component.

Connection Rail: Add a live Connection Status indicator using useConnectionState(): Green Diode (Connected), Amber Flash (Connecting), Red Ring (Disconnected).

[ ] 3.2 Sidebar Purge: DELETE the Left Sidebar navigation completely from NomadOpsDashboard.jsx and AppShell.

[ ] 3.3 Top Control Deck: Create a "Top Control Strip" below the TacticalHeader to house the View Mode switches (Standard/Operator/Command) and global context controls.

PHASE 4: COMMS CONSOLE (Real-Time UI)

[ ] 4.1 Active Net Logic (src/components/comms/ActiveNetPanel.jsx):

Refactor to use useParticipants() from LiveKit.

Speaking Indicator: When participant.isSpeaking, pulse the row background (bg-emerald-500/20).

Muted State: Show a "Slashed Mic" icon in Red if !isMicrophoneEnabled.

[ ] 4.2 PTT Hard-Wiring: Integrate src/hooks/usePTT.js. Map SPACEBAR to localParticipant.setMicrophoneEnabled(true). Add visual feedback (Orange "TRANSMITTING" light).

[ ] 4.3 Tactical Flares: Wire TacticalFlare.jsx to TacticalTransceiver. When a data packet arrives, trigger the UI alert animation.

PHASE 5: VISUAL SUPREMACY (The Polish)

[ ] 5.1 Global Styles (src/index.css): Define .label-plate, .data-cell, and .scanline-overlay utilities.

[ ] 5.2 Dashboard Refactor (src/pages/NomadOpsDashboard.jsx): Apply high-contrast classes to all widgets. Ensure grid gaps are bg-black.

[ ] 5.3 Mobile Hardening: Ensure NomadOpsDashboard switches from grid to flex-col on screens < 768px.

🛠️ STEP 2: EXECUTION LOOP
Once CODEX_MASTER_PLAN.md is created, proceed to execute the tasks one by one.

PROTOCOL FOR EACH TASK:

Read: Review the specific requirements for the task.

Edit: Modify the target files.

Verify: Confirm the code meets the "Visual Laws" (No round corners) and "Functional Requirements" (LiveKit wiring).

Update: Mark the task as [x] in CODEX_MASTER_PLAN.md.
