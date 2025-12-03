🛠️ NOMAD NEXUS: BACKEND & INTEGRATION SPECIFICATIONS

Purpose: This document provides the granular data models, API contracts, and logic flows required to implement the "Academy," "Riggsy Automation," and "Mobile" modules.
Target System: Supabase (PostgreSQL) + Node.js (Backend Functions) + Python (LiveKit Agent).

🎓 I. THE ACADEMY (MENTORSHIP MODULE)

1. Database Schema (Supabase PostgreSQL)

Table: skills

id (uuid, PK): Unique ID.

name (text): E.g., "Mining Basics", "Vanguard Piloting".

category (text): "Combat", "Industry", "Logistics".

chip_icon_url (text): Path to the visual "Skill Chip" asset.

description (text): Lore-friendly description.

Table: certifications (Join table for Instructors)

user_id (uuid, FK -> profiles.id): The Mentor.

skill_id (uuid, FK -> skills.id): The Skill they can teach.

certified_at (timestamp): When they earned the "Instructor" badge.

Table: instruction_requests

id (uuid, PK)

cadet_id (uuid, FK -> profiles.id): The user requesting help.

skill_id (uuid, FK -> skills.id).

status (enum): PENDING, ACTIVE, COMPLETED, CANCELLED.

guide_id (uuid, FK -> profiles.id, nullable): Assigned mentor.

sim_pod_id (text, nullable): The LiveKit Room Name for the session.

Table: training_objectives

id (uuid, PK)

skill_id (uuid, FK -> skills.id).

description (text): E.g., "Successfully fracture a quantanium rock."

xp_value (int): E.g., 500.

Table: session_progress

request_id (uuid, FK -> instruction_requests.id).

objective_id (uuid, FK -> training_objectives.id).

completed (boolean).

2. API Endpoints (Node.js / Supabase Edge Functions)

POST /api/academy/request

Input: { "skillId": "uuid", "cadetId": "uuid" }

Logic:

Create record in instruction_requests with status PENDING.

Query certifications to find all users with this skillId.

Trigger Push Notification to those users: "ALERT: Cadet requesting instruction in [Skill Name]."

Output: { "requestId": "uuid", "status": "PENDING" }

POST /api/academy/accept

Input: { "requestId": "uuid", "guideId": "uuid" }

Logic:

Update instruction_requests: Set status = ACTIVE, guideId = input.

Generate sim_pod_id (e.g., sim-pod-[random_hash]).

Call generateLiveKitToken for both users for this specific room.

Output: { "simPodId": "...", "connectionTokens": { ... } }

🤖 II. RIGGSY AUTOMATION (PYTHON AGENT)

1. Agent Configuration & Credentials

Environment Variables (.env.local for Agent)

LIVEKIT_URL: wss://...

LIVEKIT_API_KEY: ...

LIVEKIT_API_SECRET: ...

DEEPGRAM_API_KEY: ... (For STT)

PIPER_TTS_PATH: ./piper/piper (Local binary path)

PIPER_MODEL: en_US-lessac-medium.onnx (Or custom trained model)

2. Voice Command API (STT -> Intent)

The Agent listens to the command-stream track. When silence is detected after speech, it processes the text against this map:

Intent Mapping (Regex Logic)

Voice Command (Regex)

Intent ID

Required Slots

`(Riggsy

Riggs).*set.target.(Daymar

Yela

`(Riggsy

Riggs).add.(Hammerhead

Vulture

`(Riggsy

Riggs).clear.(board

table)`

`(Riggsy

Riggs).*status`

GET_STATUS

3. Riggsy Response Format (Dialogue Generation)

The Agent does not output JSON; it outputs Audio. The internal logic selects a text string based on success/failure and sends it to Piper TTS.

Persona Guidelines (The "Salty Engineer"):

Success: "Copy. Spooling up the display." / "Done. Don't scratch the paint."

Error: "Negative. Systems are fried, try again." / "I can't do that, boss."

Thinking: "Hold on... calibrating..."

4. Agent <-> Frontend Communication**

Direction: Agent -> Frontend (UI Updates)

Mechanism: LiveKit Data Packet.

Topic: RIGGSY_OP

Payload:

{
  "action": "UPDATE_HOLOTABLE",
  "data": {
    "target": "Daymar",
    "fleet": [...]
  }
}


📱 III. MOBILE & PUSH NOTIFICATIONS

1. Service Configuration

Provider: Web Push API (Standard VAPID).
Keys: Generate via web-push generate-vapid-keys.

NEXT_PUBLIC_VAPID_PUBLIC_KEY: (Exposed to client)

VAPID_PRIVATE_KEY: (Server secret)

2. Subscription Logic

Database Table: push_subscriptions

user_id (uuid, FK -> profiles.id)

endpoint (text)

auth (text)

p256dh (text)

Frontend Logic (PushManager.ts)

Check navigator.serviceWorker.

Request Permission: Notification.requestPermission().

On 'granted': registration.pushManager.subscribe(...).

Send subscription object to Backend (POST /api/notifications/subscribe).

3. Trigger Logic (Tactical Flares)**

Backend Function: handleRescueRequest (Updated)

Receive Flare Request (type: MEDICAL).

Query profiles table for all users where role contains rescue.

Join with push_subscriptions to get endpoints.

Send Payload:

{
  "title": "CRITICAL ALERT: NOMAD DOWN",
  "body": "Medical distress signal detected in Sector 4. Response required.",
  "icon": "/icons/medical_flare.png",
  "badge": "/icons/badge_redscar.png",
  "data": { "url": "/nexus/map?focus=flare_id" }
}


🔐 IV. ACCESS & ROLES (RBAC)

Role Definitions (Supabase profiles.roles array)

pioneer: Full Admin, Command Override, Brig Access.

voyager: Event Creation, Fleet Management.

scout: Standard Access, Flare Launching.

vagrant: Read-only Map, "Academy" Request Access, Listen-only Voice.

shaman: Admin, Moderation, Tech Support.

Middleware Logic:
All API routes must verify the user_id from the Supabase Session JWT against the profiles table before executing sensitive actions (like DISCHARGE or SET_TARGET).