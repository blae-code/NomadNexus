# LiveKit Data Channel Payloads (Nomad Nexus)

| Type | Shape | Purpose |
| --- | --- | --- |
| `CHAT` | `{ type: "CHAT", content: string, ts: number }` | Data Slate realtime chat fan-out. Persist to Supabase `messages`. |
| `FLARE` | `{ type: "FLARE", variant: "COMBAT" \| "MEDICAL", loc: string }` | Tactical flare broadcast; triggers UI + ShipVoice. |
| `FLARE_ACK` | `{ type: "FLARE_ACK", responder: string, ts: number }` | Acknowledge flare/close loop. |
| `MUTE_ALL` | `{ type: "MUTE_ALL" }` | Pioneer override; all clients duck/mute. |
| `HANGAR_CLAIM` | `{ type: "HANGAR_CLAIM", slotId: string, occupant: string, ts: number }` | Hangar slot claim sync. |
| `TRAINING_REQUEST` | `{ type: "TRAINING_REQUEST", skill: string, track: string, ts: number }` | Training deck routing. |
| `HOLO_ACTION` | `{ type: "HOLO_ACTION", action: string, args?: object, ts: number }` | Holotable state updates (e.g., load system, place ship). |

Notes
- Participant metadata should include `{ x: number, y: number, rank?: string }` for spatial audio and RBAC overlays.
- Reliable vs. lossy: flares, mute-all, hangar, training, holo actions should be reliable. Chat can be lossy if also persisted.
- Authority: enforce RBAC server-side (Pioneer for MUTE_ALL; certs for hangar/training) via your token service/Supabase edge functions.
