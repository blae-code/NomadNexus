📋 GEMINI_UI_TASKS.md
Project: Redscar Nomads PWA (VS Code Port) Focus: Immersive LiveKit Comms UI Aesthetic: Star Citizen / Industrial Sci-Fi (Gunmetal, Burnt Orange, Deep Red) Constraint: NO rounded corners. NO cyan/blue. High contrast.

🟥 Phase 1: Foundation & Thematic Shell
Set the stage with the non-negotiable visual language.

[x] 1.01 [Config]: Update tailwind.config.js to include custom Redscar colors:

bg-gunmetal: #0b0f12 (Main background)

border-burnt-orange: #cc5500 (Primary borders/accents)

text-tech-white: #e0e0e0 (Primary text)

indicator-green: #00ff41 (Active status)

indicator-red: #ff0000 (Critical/Muted)

indicator-amber: #ffbf00 (Warning/Standby)

[x] 1.02 [CSS]: Enforce a global reset in index.css. Set border-radius: 0px !important for all elements.

[x] 1.03 [Font]: Import a strictly monospaced or condensed technical font (e.g., 'Rajdhani', 'Share Tech Mono', or 'IBM Plex Mono') and apply it to the body tag.

[x] 1.04 [Layout]: Create the AppShell component. Implement a CSS Grid layout that is 100vh (non-scrolling) with three distinct areas:

Sidebar (Left): 64px fixed width.

Main Stage (Center): flex-1 (Auto-expanding).

Aux Data (Right): 300px fixed width.

[x] 1.05 [Assets]: Create an IconRegistry component that renders SVG icons (Microphone, Signal Bars, Medic Cross) using strictly angular, geometric paths (no rounded stroke caps).

🟧 Phase 2: Central Comms Console
Build the "Main Stage" where users interact with voice rooms.

[x] 2.01 [Component]: Build RoomGrid.tsx. Use a CSS Grid to display available rooms as "Data Cards."

[x] 2.02 [Style]: Style RoomCard.tsx as a clickable tile with a 1px border-burnt-orange. On hover, the background should shift to a low-opacity bg-burnt-orange/10 and the border should glow.

[x] 2.03 [Logic]: Implement "Role Gating" visual logic in RoomCard.tsx.

If userRole != allowed: Apply opacity-50, grayscale filter, and display a "🔒 ENC" (Encrypted) lock icon.

If userRole == allowed: Display room name in white and "READY" status.

[x] 2.04 [Logic]: Add an "Active Population" indicator to RoomCard.tsx.

If count > 0: Render a small indicator-green square and the number (e.g., [■ 12]).

If count == 0: Render [□ 00].

🟩 Phase 3: Active Voice Interface (LiveKit Integration)
The immersive view when a user has joined a room.

[x] 3.01 [State]: Create a LiveKitContext to manage the three audio states: DISCONNECTED, CONNECTED_MUTED, CONNECTED_OPEN.

[x] 3.02 [Input]: Implement the PTT (Push-to-Talk) hook usePTT.

Listen for keydown (Spacebar).

On press: room.localParticipant.setMicrophoneEnabled(true).

On release: room.localParticipant.setMicrophoneEnabled(false).

[x] 3.03 [Controls]: Build CommsControlPanel.tsx (Bottom of Center Pane).

Button 1 (PTT): Large, rectangular button. Text: "PUSH TO TRANSMIT". Active state: Inverts colors (Orange bg, Black text).

Button 2 (Open): Toggle switch style. Text: "VOX: OFF/ON".

Button 3 (Mute): Emergency cut-off. Border red. Text: "KILL SWITCH".

[x] 3.04 [Visualization]: Build AudioVisualizer.tsx.

Create a simple CSS-based "waveform" bar graph.

Map the local microphone volume level to the height of the bars.

Color: indicator-burnt-orange (idle/low) to indicator-green (speaking/high).

🟨 Phase 4: Tactical Participant List & Aux Data
The "AI inferred" status and fleet roster.

[x] 4.01 [Component]: Build RosterList.tsx. A dense, vertical list of users in the channel.

[x] 4.02 [Feedback]: Implement RosterItem.tsx status indicators (The "Tactical Picture").

Speaking: The entire row flashes/pulses bg-green-900/30.

Muted: Icon is a crossed-out mic (Grey).

PTT Held: Icon is an open mic (Orange).

[x] 4.03 [Data]: Add the Rank Badge to RosterItem.tsx.

Render a small hexagonal icon next to the name.

Color code: Red (Pioneer/Founder), Orange (Voyager), White (Scout), Grey (Vagrant).

[x] 4.04 [Aux Panel]: Build TacticalOverlay.tsx in the Right Sidebar.

Create a text display area for "AI Status Inference".

Default: "SYSTEM: MONITORING COMMS..." (Blinking cursor effect).

Active: Display inferred status (e.g., "⚠️ COMBAT DETECTED") in large, bold red text if the user's report contains keywords like "contact", "hostile", or "fire".

🔧 Technical Drift Protection
Gemini must check these before marking any task complete.

No Blue: Ensure no default browser blue outlines or Tailwind blue shades are visible.

No Curves: Verify border-radius is 0 on all new buttons and cards.

Security: Verify that LiveKit Room Token generation is NEVER imported in a client-side .tsx file. It must only be fetched via an API call.

---

🔥 Phase 5: Signal Topology Map (Campfire Metaphor)
The fleet's comms structure is a constellation of "Campfires" (Signal Nodes) scattered across the dark sector grid. Users gather around these fires to communicate.

**Terminology Shift:**
* **Room/Channel** -> **Campfire**
* **User Avatar** -> **Spark**
* **Connection Line** -> **Path**

**Implementation Directives for `SignalMap.tsx`:**

[x] 5.01 [Component]: **The Campfire Nodes:**
    * Render each Campfire as a **Hexagonal Brazier**.
    * **Visual State (Idle):** A low, dim ember glow (Dark Orange outline).
    * **Visual State (Active):** When `participantCount > 0`, the node "ignites." It pulses with a bright **Burnt Orange** core and casts a faint radial gradient glow on the grid background.
    * **Labels:** "Lounge Campfire," "Rangers Campfire," etc.

[x] 5.02 [Component]: **The "Spark" (User Navigation):**
    * The user is represented as a brilliant white **Diamond Spark**.
    * **Interaction:** To switch Campfires, the user drags their Spark through the empty "void" (grid).
    * **Tether:** A thin, trailing line follows the Spark back to its current Campfire until it snaps to a new one, symbolizing the "Nomad's Path."

[x] 5.03 [Visual Feedback]: **Proximity Audio (Visual Feedback):**
    * If the user drags their Spark *near* a Campfire (hover state) but hasn't dropped it yet, render a "Ghost" version of the audio visualizer. This implies they are "leaning in" to hear the chatter before fully committing (joining).

[x] 5.04 [Visualization]: **Audio Visualization:**
    * Instead of standard bars, render the audio activity as **Flame Intensity**.
    * Louder volume = Higher, more jagged "flames" (geometric triangles) rising from the top of the Hexagon.

[x] 5.05 [Generated Component]: Generate the `CampfireNode.tsx` component code using `framer-motion`. Include the variants for `idle`, `ignited` (active), and `locked` (RBAC restricted). Ensure the "flame" animation uses angular, triangular distinct shapes, NOT soft curves.

---

💥 Phase 6: Tactical Flare System
A silent, high-priority distress signal system integrated into the Signal Map.

[x] 6.01 [Interaction]: **Trigger (Dead Man's Switch):**
    * On Right-Click / Long-Press of the user's "Spark," open a radial context menu.
    * Options: **MEDICAL** and **COMBAT**.

[x] 6.02 [Flare Type]: **Crimson Cross (Medical/Rescue):**
    * **Visual:** Pulsing **Deep Red** hexagonal shockwave.
    * **Backend:** Fires `handleRescueRequest` with type `MEDICAL`.
    * **Target:** Pings users with the **'Redscar Rescue'** role.

[x] 6.03 [Flare Type]: **Iron Shield (Combat/Defense):**
    * **Visual:** Strobe **Burnt Orange** jagged burst.
    * **Backend:** Fires `handleRescueRequest` with type `DEFENSE`.
    * **Target:** Pings users with the **'Redscar Rangers'** role.

[x] 6.04 [Response]: **Acknowledge & Close Loop:**
    * Flares persist until a relevant role-holder clicks **"RESPOND"**.
    * On click, flare turns **White** and the distressed user receives an audible cue.

[x] 6.05 [Generated Component]: Generate the `TacticalFlare.tsx` component logic with `framer-motion` variants for the "Hexagonal Shockwave" and the alert routing logic.

---

⚙️ Phase 7: Advanced State Indicators
Adding layers of tactical information to the `CampfireNode` for at-a-glance ROE assessment.

[x] 7.01 [Indicator]: **LFG State -> "The Mustering Beacon"**
    * **Logic:** `isLFG === true`.
    * **Visual:** Three stacked, inverted "V" shapes (Chevrons) floating above the node, animated in a rising loop.

[x] 7.02 [Indicator]: **PTT-Only State -> "The Encryption Grid"**
    * **Logic:** `audioMode === 'PTT_REQUIRED'`.
    * **Visual:** A diagonal hash line overlay on the Hexagon background and a `dashed` border style.

[x] 7.03 [Indicator]: **Briefing State -> "Command Override"**
    * **Logic:** `isPrioritySpeakerActive === true`.
    * **Visual:** A heavy `Deep Red` outline and suppressed "Flame" audio visualizer.

[x] 7.04 [Indicator]: **Overload State -> "Signal Noise"**
    * **Logic:** `participantCount > softCap`.
    * **Visual:** A "Jitter" animation on the Hexagon container.

[x] 7.05 [Generated Component]: Generate the `CampfireIndicators.tsx` component code and integrate it into `CampfireNode.tsx`.

---

🔊 Phase 8: Nomad Audio Engine
A wrapper around the LiveKit SDK for immersive, diegetic audio and data channel signaling.

[x] 8.01 [Web Audio]: **"Helmet Comms" Audio Processor:**
    * Create `AudioProcessor.ts` with a custom `AudioContext`.
    * Chain `DynamicsCompressorNode`, `BiquadFilterNode` (High/Low pass), and a `WaveShaperNode` for distortion.
    * Distortion is variable based on signal quality.

[x] 8.02 [Spatial Audio]: **2D Spatial Audio Logic:**
    * Create `SpatialMixer.ts` to calculate Pan and Gain based on Spark position relative to the Campfire.
    * Apply values to a `StereoPannerNode` and `GainNode`.

[x] 8.03 [Data Channel]: **"Tactical Data Layer":**
    * Create `TacticalTransceiver.ts` to send/receive data packets.
    * **Flares:** Publish flare data on trigger.
    * **Reception:** Listen for `RoomEvent.DataReceived` to trigger UI animations instantly.
    * **Priority Mute:** Handle `MUTE_ALL` command from 'Pioneer' rank.

---

💾 Phase 9: Intelligence & Archival
Adding "Ship Voice" for synthetic audio alerts and "Sub-Space" direct hails.

[x] 9.01 [Synthetic Audio]: **"Ship Voice" (Synthetic Audio Alerts):**
    * Create `ShipVoice.ts` utility class.
    * Use browser's `SpeechSynthesis` API to announce `FLARE` data packets.
    * Voice profile: Female, robotic with slight pitch shift.

[x] 9.02 [Egress Control]: **"Flight Recorder" (Egress Control):**
    * UI: Add a **[REC]** toggle button to `CommsControls` (Pioneer/Voyager roles).
    * Visual State: Idle (Dim Grey), Active (Pulsing Red border with "TAPE RUNNING" marquee).
    * Backend Hook: Call `toggleRoomRecording` function.

[x] 9.03 [Whisper Logic]: **"Sub-Space" Direct Hails:**
    * UI: Add a "Hail" button to `ParticipantRow` (`RosterItem.jsx`).
    * Logic: Publish secondary `LocalAudioTrack` with `name: "whisper"`.
    * Send Data Packet to target: `{ type: 'HAIL_OPEN', trackSid: '...' }`.
    * Target Client: Subscribe to `trackSid` and duck main audio.