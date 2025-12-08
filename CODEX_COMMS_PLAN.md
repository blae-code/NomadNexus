PHASE 1: THE MIXER BOARD (Audio Architecture)

[x] 1.1 Multi-Track Subscription: Refactor src/layout/NomadShell.tsx and useLiveKit.jsx. Ensure the client subscribes to all relevant audio tracks, not just the active room.

[x] 1.2 The Comms Mixer (src/components/comms/CommsMixer.jsx): Create a new component that sits in the CommsConsole.

Visuals: A dense row of vertical volume sliders, one for each active channel/participant.

Controls: Per-channel MUTE, SOLO, and VOLUME sliders.

Utility: Allow the user to "Pan" specific channels (e.g., Command to Left Ear, Squad to Right Ear) using the SpatialMixer logic.

PHASE 2: COMMAND & CONTROL (Advanced Features)

[x] 2.1 Priority Speaker Logic: Update ActiveNetPanel.jsx.

Implementation: If a user with rank >= COMMANDER speaks, automatically apply a 50% volume ducking (reduction) to all other audio tracks via AudioProcessor.

[x] 2.2 Sub-Space Hails (Whispers): Implement "Direct Message" voice channels.

UI: Add a "HAIL" button to RosterItem.jsx.

Logic: Publish a secondary audio track with name: "whisper-[target_id]". The target client auto-subscribes; others ignore it.

[x] 2.3 Broadcast Mode: Allow Commanders to transmit to all breakout rooms simultaneously (e.g., "ALL HANDS: CEASE FIRE").

PHASE 3: HARDWARE & SIGNAL PROCESSING

[x] 3.1 Device Manager (src/components/comms/AudioControls.jsx):

Build a robust "Settings" modal.

Inputs: Dropdowns for Microphone and Speaker selection (using navigator.mediaDevices.enumerateDevices).

Processing: Toggle switches for "Noise Suppression," "Echo Cancellation," and "High-Pass Filter" (removes engine rumble).

[x] 3.2 VAD Calibration: Add a visual "Mic Test" bar that lets users calibrate their Voice Activity Detection threshold so they don't broadcast heavy breathing.

PHASE 4: TACTICAL INTEGRATION (The Map)

[x] 4.1 Positional Audio (Utility): Refactor src/api/SpatialMixer.ts to support "Relative Squad Positioning."

Concept: In the TacticalMap, if Alpha Squad is on the West flank, pan their voices slightly left. This aids cognitive load during chaotic fights.

[x] 4.2 Status-Linked Comms: In ActiveNetPanel.jsx, link the voice row to the PlayerStatus model.

Visual: If a player status is DOWN or UNCONSCIOUS, automatically mute their mic output to simulate casualty silence, or apply a heavy "Distress" filter.

PHASE 5: KEYBINDINGS & ACCESSIBILITY

[x] 5.1 Advanced PTT: Refactor usePTT.js.

Support multiple PTT keys: e.g., SPACE = Squad, ALT = Command, CTRL = Whisper.

[x] 5.2 "Latch" Mode: Add a "VOX Latch" feature (toggle mute instead of hold-to-talk) for turret gunners who need both hands.

🛠️ STEP 2: EXECUTION LOOP

PROTOCOL FOR EACH TASK:

Analysis: Determine which LiveKit API methods (setVolume, publishTrack, audioContext) are required.

Implementation: Write clean, documented code. Focus on performance (no UI lag during combat). Ensure tactical-grade error handling and clear UI states for all comms panels.

Verification: Confirm that the feature handles edge cases (e.g., what happens if the Command channel user disconnects while Priority Speaking? What if token fetch or mic permission fails?).

Update: Mark the task as [x] in CODEX_COMMS_PLAN.md. Reference relevant files for error handling and state logic.

BEGIN COMMUNICATIONS GRID CONSTRUCTION. Start by creating the task list.

PROTOCOL FOR EACH TASK:

Analysis: Determine which LiveKit API methods (setVolume, publishTrack, audioContext) are required.

Implementation: Write clean, documented code. Focus on performance (no UI lag during combat).

Verification: Confirm that the feature handles edge cases (e.g., what happens if the Command channel user disconnects while Priority Speaking?).

Update: Mark the task as [x] in CODEX_COMMS_PLAN.md.

BEGIN COMMUNICATIONS GRID CONSTRUCTION. Start by creating the task list.
