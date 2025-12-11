## NomadOps CODEX — Task List

### Status: PHASES 1-5 COMPLETE — Full System Operational ✅

**Last Updated**: December 11, 2025  
**Completion**: All 5 Phases complete (Visual Supremacy → Hard-Line → Comms Console → Neural Link → Battle Hardening)

---

PHASE 1: VISUAL SUPREMACY (High Contrast)

[x] 1.1 Global Styles (src/index.css): Define .label-plate (font-black, uppercase, bg-burnt-orange, text-black) and .data-cell (border-zinc-800, bg-black, inner-shadow). Add a .scanline-overlay utility.

[x] 1.2 Dashboard Refactor (src/pages/NomadOpsDashboard.jsx): Apply .label-plate to all widget headers. Apply .data-cell to all stat readouts. Ensure grid gaps are bg-black.

[x] 1.3 Widget Polish: Refactor OrgResourcesWidget, StatusAlertsWidget, and ArmoryStatusPanel. Enforce Green/Amber/Red status text. Remove card shadows.

[x] 1.4 Layout Consolidation (CRITICAL):

DELETE the Left Sidebar navigation completely.

CREATE a "Top Control Strip" below the header to house the View Mode switches (Standard/Operator/Command).

MERGE duplicate headers into a single TacticalHeader.jsx.

PHASE 2: THE HARD-LINE (LiveKit Integration)

[x] 2.1 Dependency Check: Verify @livekit/components-react and livekit-client.

[x] 2.2 Shell Integration (src/layout/NomadShell.tsx): Wrap Outlet in <LiveKitRoom>. Implement useLiveKitToken. Include <RoomAudioRenderer /> (hidden).

[x] 2.3 Header Status (src/components/layout/TacticalHeader.jsx): Add a live Connection Status indicator (Green Diode = Connected, Amber Flash = Connecting, Red Ring = Disconnected).

PHASE 3: COMMS CONSOLE (UI Logic)

[x] 3.1 Active Net Logic (src/components/comms/ActiveNetPanel.jsx): Refactor to use useParticipants() hook from @livekit/components-react.

[x] 3.2 Audio Feedback: Highlight rows when participant.isSpeaking (Green Pulse). Show a "Slashed Mic" icon in Red if !isMicrophoneEnabled.

[x] 3.3 Local Override: Add a physical "PUSH-BUTTON" style toggle for the local microphone (Green="VOX ACTIVE", Red="MUTED").

PHASE 4: THE NEURAL LINK (Command Palette Overhaul)

[x] 4.1 Visual Refit (src/components/layout/CommandPalette.jsx): Redesigned input container with "Standby Mode" breathing border effect (border-zinc-800 ↔ border-amber-900) and status diode (amber when idle, green when active). Expanded container with corner reticle brackets on activation.

[x] 4.2 Intelligent Parsing: Implemented "Slash Commands" (/deploy, /hail, /nav, /riggsy). Command Chip displays inline with command preview inside input bar.

[x] 4.3 Audio Visualization: Enhanced reactive waveform bar with gradient animation (emerald-500 → emerald-400) that responds to localAudioLevel in real-time.

[x] 4.4 Result Feedback: Selected results use "Hard Lock" visual: burnt-orange (amber-600) borders + chevron cursor (>>) on hover. No soft gray hovers.

PHASE 5: BATTLE HARDENING (Resilience)

[x] 5.1 Mobile Datapad Mode: NomadOpsDashboard.jsx responsive flex-col stack on <768px screens.

[x] 5.2 Error Boundaries: Enhanced LiveKitErrorBoundary wraps NomadOpsDashboard root. Renders "SIGNAL LOST" tactical alert with error count tracking, multi-attempt recovery, and "Attempt Re-Link" + "Return to Lobby" buttons. Displays error details and recovery instructions.

