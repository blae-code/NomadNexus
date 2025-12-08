# Voice Communications Features - NomadNexus

## Overview
All LiveKit voice communication features are now fully integrated and accessible from the dashboard's Comms panel. The interface adapts based on user rank and permissions, providing a military-themed tactical communications experience.

## Location
**Primary Access Point**: `NomadOpsDashboard` → Comms Dashboard Panel (right side)
- **Commander View** (Founder+): Full tactical layout with map + comms
- **Operator View** (Voyager+): Operations-focused with active nets
- **Standard View** (Scout+): Customizable panels including comms

## Core Voice Features

### 1. **Push-to-Talk (PTT)**
- **Keybind**: `SPACEBAR` (global hotkey)
- **Mouse/Touch**: Hold button to transmit
- **Visual Feedback**: 
  - Button turns emerald green when transmitting
  - Shimmer animation overlay
  - "TRANSMITTING" label
- **Permission**: Requires net-specific rank (default: Scout+)

### 2. **Voice Net Types**

#### **Campfires** 🔥 (Orange)
- **Type**: Casual, always-on voice channels
- **Use**: Social gatherings, off-duty comms
- **Mode**: Open mic or PTT
- **Event Required**: No
- **Permission**: Scout+ to access

#### **Bonfires** 🔥 (Red)
- **Type**: Focused, PTT-only tactical channels
- **Use**: Mission-specific, event-driven operations
- **Mode**: PTT only
- **Event Required**: Yes
- **Permission**: Scout+ to access

#### **Squad Nets** 👥 (Emerald)
- **Type**: Squad-specific voice channels
- **Use**: Small team coordination
- **Linked**: Automatically linked to squad assignments
- **Permission**: Scout+

#### **Command Nets** 🛡️ (Red)
- **Type**: High-priority command channels
- **Use**: Fleet/Wing command and control
- **Priority**: 1-2 (highest)
- **Permission**: Voyager+ to manage, Founder+ for fleet command

### 3. **Tactical Commands** (Rank-Gated)

#### **Combat Flare** 🛡️
- **Purpose**: Broadcast combat distress signal
- **Visual**: Orange hexagonal shockwave with shield icon
- **Permission**: Scout+
- **Effect**: Alerts all Rangers/Combat roles
- **Data**: Includes location (net code)

#### **Medical Flare** ❤️
- **Purpose**: Broadcast medical emergency
- **Visual**: Red hexagonal shockwave with cross icon
- **Permission**: Scout+
- **Effect**: Alerts all Rescue/Medic roles
- **Data**: Includes location (net code)

#### **Broadcast Mode** ⚡
- **Purpose**: Transmit to all connected nets
- **Permission**: Voyager+
- **Visual**: Emerald highlight when active
- **Use Case**: Fleet-wide announcements

#### **Whisper Mode** 💬
- **Purpose**: Private 1-on-1 communication
- **Permission**: Scout+
- **Visual**: Amber highlight when active
- **Target Selection**: Click user in roster
- **Use Case**: Discrete tactical coordination

#### **Priority Mute All** 🚨
- **Purpose**: Emergency silence all participants
- **Permission**: Founder+ only (Command Override)
- **Visual**: Red destructive button
- **Effect**: Mutes everyone except command rank
- **Acknowledge**: Recipients must ACK to restore
- **Use Case**: Critical command announcements

### 4. **Audio Processing Features**

#### **Role-Based Audio Profiles**
Automatic audio filtering based on user role:
- **Ranger**: Radio distortion (30%), 500-3500Hz
- **Industry**: Industrial filter (10%), 200-4000Hz  
- **Command**: Clean comms (5%), 120-5000Hz + compression

#### **Spatial Audio**
- 3D positional audio based on coordinates
- Squad-relative positioning
- Pan and gain adjustments
- Dynamic mixing based on distance

#### **Advanced Controls** (Settings Dialog)
- **Device Selection**: Choose microphone/speaker
- **Noise Suppression**: Filter background noise
- **Echo Cancellation**: Remove echo/feedback
- **High-Pass Filter**: Remove low-frequency rumble
- **VAD (Voice Activity Detection)**: Calibrate mic sensitivity
- **Threshold Adjustment**: Fine-tune PTT sensitivity

### 5. **Roster Features**

#### **Participant Display**
- Real-time participant list
- Speaking indicators (pulsing emerald)
- Mute status (slashed mic icon)
- Role/Rank badges with color coding
- Connection quality indicators

#### **Per-Participant Controls** (when available)
- **Solo**: Isolate one participant (mute others)
- **Mute**: Silence specific participant (if permissions allow)
- **Whisper Target**: Select for private whisper
- **Priority Speaker**: Commander can elevate participant

### 6. **Net Management** (Scout+)

#### **Create Nets**
- **Campfire**: General casual channel
- **Bonfire**: Event-specific tactical channel
- Custom code and label
- Auto-generated codes if blank

#### **Update Nets**
- Rename/relabel existing nets
- Scout+ required

#### **Bridge Nets** (Founder+)
- Link two nets for cross-communication
- Source → Target routing
- Visual indicators in net list
- Unlink anytime

### 7. **Connection States**

Visual feedback for all states:
- **Disconnected**: Red indicator, "NET OFFLINE"
- **Connecting**: Yellow pulse, "Connecting to net..."
- **Connected (Muted)**: Zinc/gray, "PTT READY"
- **Connected (Open)**: Emerald, "TRANSMITTING"
- **Priority Override**: Red banner when mute-all active

## UI Components

### VoiceCommandPanel (New)
Consolidated tactical voice control interface with:
- Large PTT button with visual feedback
- Tactical command grid (Flares, Broadcast, Whisper)
- Command override section (Founder+)
- Connection status display
- Audio device information

### CommsDashboardPanel
Main comms interface featuring:
- Net selector (categorized by type)
- Quick route buttons (Fleet, Wing, Squad, Campfire)
- Bridge linking controls
- Net creation/management
- Active net display
- Integrated VoiceCommandPanel

### ActiveNetPanel
Roster and details view with:
- Net header (code, label, type)
- Participant roster with live indicators
- Comms log (recent transmissions)
- Connection stats
- Encryption status

## Permissions Summary

| Feature | Vagrant | Scout | Voyager | Founder | Pioneer |
|---------|---------|-------|---------|---------|---------|
| Listen to Campfires | ❌ | ✅ | ✅ | ✅ | ✅ |
| Transmit (PTT) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Combat/Medical Flare | ❌ | ✅ | ✅ | ✅ | ✅ |
| Whisper Mode | ❌ | ✅ | ✅ | ✅ | ✅ |
| Create/Manage Nets | ❌ | ✅ | ✅ | ✅ | ✅ |
| Broadcast Mode | ❌ | ❌ | ✅ | ✅ | ✅ |
| Control Wing Nets | ❌ | ❌ | ✅ | ✅ | ✅ |
| Bridge Nets | ❌ | ❌ | ❌ | ✅ | ✅ |
| Control Fleet Command | ❌ | ❌ | ❌ | ✅ | ✅ |
| Priority Mute All | ❌ | ❌ | ❌ | ✅ | ✅ |

## Keyboard Shortcuts

- **`SPACEBAR`**: Push-to-Talk (when net selected)
- **`ALT`**: Riggsy voice assistant (future STT integration)
- **`ESC`**: Cancel whisper/broadcast mode

## Technical Implementation

### LiveKit Integration
- **Room**: One room per voice net (identified by `net.code`)
- **Participant Metadata**: Includes rank, role, userId, position
- **Audio Tracks**: Processed through `AudioProcessor` singleton
- **Data Channel**: Used for flares, mute commands, chat

### State Management
- **Context**: `LiveKitProvider` wraps entire app
- **Hook**: `useLiveKit()` provides all voice features
- **PTT Hook**: `usePTT()` handles keyboard/mouse input
- **Connection**: Auto-connect when net selected
- **Cleanup**: Auto-disconnect on unmount/net change

### Audio Pipeline
1. Microphone input → Web Audio API
2. AudioProcessor applies role-based profile
3. Publish to LiveKit room
4. Remote tracks received → AudioProcessor
5. Spatial audio calculation → Output

## Future Enhancements
- Deepgram integration for live transcription
- Piper TTS for AI voice responses
- Automatic combat log generation from voice
- Voice-activated commands ("Riggsy, plot course")
- Mobile-optimized PTT controls
- Recording/playback for mission review

## Troubleshooting

**No audio heard:**
- Check device permissions in browser
- Verify microphone/speaker selected in Settings
- Ensure net allows receiving (min_rank_to_rx)

**Can't transmit:**
- Verify your rank meets net requirement
- Check connection state (must be "connected")
- Ensure not muted by Priority Mute All

**Echo/feedback:**
- Enable Echo Cancellation in Settings
- Use headphones
- Reduce speaker volume

**Poor quality:**
- Check internet connection
- Adjust VAD threshold in Settings
- Enable Noise Suppression
- Consider High-Pass Filter for cockpit noise

## Thematic Alignment

All voice features maintain the military/tactical aesthetic:
- **Terminology**: "Nets" not channels, "Transmit" not talk, "Flares" not alerts
- **Colors**: Emerald (active), Amber (standby), Red (emergency), Zinc (inactive)
- **Fonts**: Monospace for codes/IDs, uppercase tracking for labels
- **Animations**: Tactical pulses, scanner lines, hexagonal overlays
- **Feedback**: Immediate visual + audio cues for all actions
- **Hierarchy**: Clear rank-based access controls
- **Layout**: Hard angles, no rounded corners, military precision
