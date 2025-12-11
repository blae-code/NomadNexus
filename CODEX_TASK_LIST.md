## NomadOps CODEX — Task List

### Status: PHASE 3 COMPLETE — LiveKit User-Accessible ✅

**Last Updated**: December 11, 2025  
**Completion**: Phases 1-3 (Core LiveKit Integration + UI) — DONE

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

[ ] 4.1 Visual Refit (src/components/layout/CommandPalette.jsx): Completely redesign the input container.

Idle State: "Standby Mode." A slow, rhythmic "Breathing" border effect (border-zinc-800 <-> border-amber-900). A solid Amber "Status Diode" indicates the system is listening.

Active State: "Targeting Mode." The container expands mechanically. Corner brackets ("Reticles") snap outward.

[ ] 4.2 Intelligent Parsing: Implement "Slash Commands" (e.g., /deploy, /hail). When detected, render a "Command Chip" inside the input bar.

[ ] 4.3 Audio Visualization: Add a reactive waveform bar inside the palette that animates when the user speaks (or simulates listening).

[ ] 4.4 Result Feedback: Selected results must use a "Hard Lock" visual: Burnt Orange border + Chevron cursor (>>). No soft hover grays.

PHASE 5: BATTLE HARDENING (Resilience)

[x] 5.1 Mobile Datapad Mode: Update NomadOpsDashboard.jsx. If screen width < 768px, switch grid to flex-col stack.

[ ] 5.2 Error Boundaries: Wrap the LiveKitRoom in a custom Error Boundary that renders a Red "SIGNAL LOST" tactical alert screen.

