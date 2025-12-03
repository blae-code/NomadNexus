# Supabase Schema (Nomad Nexus)

## messages
- id (uuid, pk)
- campfire_id (text) // matches LiveKit room code or campfire name
- user_id (uuid, fk -> users.id)
- content (text)
- attachments (jsonb) // [{ url, type, width, height }]
- created_at (timestamptz, default now())

## training_requests
- id (uuid, pk)
- user_id (uuid, fk -> users.id)
- skill (text) // e.g., mining_basics
- track (text) // Industry/Rangers/Rescue/Support
- status (text) // pending, routing, linked, complete, cancelled
- instructor_id (uuid, nullable)
- created_at (timestamptz, default now())

## training_sessions
- id (uuid, pk)
- request_id (uuid, fk -> training_requests.id)
- room_name (text) // LiveKit Sim-Pod room
- token_trainee (text) // delivered server-side only
- token_instructor (text) // delivered server-side only
- started_at (timestamptz)
- ended_at (timestamptz)

## training_objectives
- id (uuid, pk)
- session_id (uuid, fk -> training_sessions.id)
- text (text)
- is_completed (boolean, default false)

## hangar_slots
- id (text, pk)
- doctrine (text)
- requires_cert (text)
- occupant_user_id (uuid, nullable)
- updated_at (timestamptz)

## certifications (pivot)
- user_id (uuid, pk part)
- cert (text, pk part) // MEDICAL_CERT, NAV_CERT, etc.
- updated_at (timestamptz)

## brig_actions
- id (uuid, pk)
- user_id (uuid, fk -> users.id)
- action (text) // silence, discharge
- reason (text)
- expires_at (timestamptz, nullable)
- created_by (uuid, fk -> users.id)
- created_at (timestamptz)

## service_records
- user_id (uuid, pk, fk -> users.id)
- rsi_handle (text)
- callsign (text)
- rank (text)
- roles (jsonb) // e.g., ["Ranger", "Rescue"]
- created_at (timestamptz)
- updated_at (timestamptz)

Indexes
- messages: index on campfire_id, created_at
- training_requests: index on status, track
- hangar_slots: index on occupant_user_id
- brig_actions: index on user_id, action, expires_at
