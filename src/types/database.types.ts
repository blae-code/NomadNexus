// src/types/database.types.ts

// Enum for InstructionRequest status
export type InstructionRequestStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

// --- Table Interfaces ---

// Table: skills
export interface Skill {
  id: string; // uuid
  name: string; // text
  category: string; // text ("Combat", "Industry", "Logistics")
  chip_icon_url: string | null; // text
  description: string | null; // text
}

// Table: certifications
export interface Certification {
  user_id: string; // uuid (FK -> profiles.id)
  skill_id: string; // uuid (FK -> skills.id)
  certified_at: string; // timestamp (ISO 8601 string)
}

// Table: instruction_requests
export interface InstructionRequest {
  id: string; // uuid
  cadet_id: string; // uuid (FK -> profiles.id)
  skill_id: string; // uuid (FK -> skills.id)
  status: InstructionRequestStatus; // enum
  guide_id: string | null; // uuid (FK -> profiles.id, nullable)
  sim_pod_id: string | null; // text (LiveKit Room Name for session, nullable)
}

// Table: training_objectives
export interface TrainingObjective {
  id: string; // uuid
  skill_id: string; // uuid (FK -> skills.id)
  description: string; // text
  xp_value: number; // int
}

// Table: session_progress
export interface SessionProgress {
  request_id: string; // uuid (FK -> instruction_requests.id)
  objective_id: string; // uuid (FK -> training_objectives.id)
  completed: boolean; // boolean
}

// Table: events
export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: 'casual' | 'focused' | string;
  priority: 'LOW' | 'STANDARD' | 'HIGH' | 'CRITICAL' | string;
  status: string;
  start_time: string;
  location: string | null;
  tags: string[] | null;
  assigned_asset_ids: string[] | null;
  created_by: string | null;
  created_at: string;
}

// Table: voice_nets
export interface VoiceNet {
  id: string;
  code: string;
  label: string;
  type: string;
  event_id: string | null;
  priority: number | null;
  linked_squad_id: string | null;
}

// Table: channels
export interface Channel {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  type: string | null;
  event_id?: string | null;
  created_at?: string;
}

// Table: messages
export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  attachments: unknown[] | null;
  created_at: string;
}

// Table: player_status
export interface PlayerStatus {
  id: string;
  user_id: string;
  event_id: string | null;
  assigned_squad_id: string | null;
  status: string | null;
  last_updated: string | null;
}

// Table: squads
export interface Squad {
  id: string;
  name: string;
  event_id: string | null;
  leader_id: string | null;
  created_at?: string;
}

// Table: squad_members
export interface SquadMember {
  id?: string;
  squad_id: string;
  user_id: string;
  role: string | null;
  created_at?: string;
}

// Table: fleet_assets
export interface FleetAsset {
  id: string;
  name: string;
  model: string;
  type: string;
  status: string;
  location: string | null;
  coordinates?: { x: number; y: number };
  maintenance_notes?: string | null;
}

// --- Profile Interface (from previous context, including roles) ---
// Assuming 'profiles' table exists and maps to a User-like interface
// The roles array is critical for RBAC
export interface Profile {
  id: string; // uuid (User's Supabase ID)
  full_name: string | null;
  callsign: string | null;
  rsi_handle: string | null;
  rank: string | null; // e.g., "Vagrant", "Scout", "Pioneer"
  roles: string[]; // text[] (e.g., ["pioneer", "scout"]) - CRITICAL for RBAC
  // Add any other fields from your profiles table here
}

// --- Supabase Database Schema Type ---
// This is the main type to be injected into createClient<Database>
export type Database = {
  public: {
    Tables: {
      skills: {
        Row: Skill;
        Insert: Partial<Skill>;
        Update: Partial<Skill>;
      };
      certifications: {
        Row: Certification;
        Insert: Partial<Certification>;
        Update: Partial<Certification>;
      };
      instruction_requests: {
        Row: InstructionRequest;
        Insert: Partial<InstructionRequest>;
        Update: Partial<InstructionRequest>;
      };
      training_objectives: {
        Row: TrainingObjective;
        Insert: Partial<TrainingObjective>;
        Update: Partial<TrainingObjective>;
      };
      session_progress: {
        Row: SessionProgress;
        Insert: Partial<SessionProgress>;
        Update: Partial<SessionProgress>;
      };
      profiles: { // Assuming 'profiles' table maps to the Profile interface
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      events: {
        Row: Event;
        Insert: Partial<Event>;
        Update: Partial<Event>;
      };
      voice_nets: {
        Row: VoiceNet;
        Insert: Partial<VoiceNet>;
        Update: Partial<VoiceNet>;
      };
      channels: {
        Row: Channel;
        Insert: Partial<Channel>;
        Update: Partial<Channel>;
      };
      messages: {
        Row: Message;
        Insert: Partial<Message>;
        Update: Partial<Message>;
      };
      player_status: {
        Row: PlayerStatus;
        Insert: Partial<PlayerStatus>;
        Update: Partial<PlayerStatus>;
      };
      squads: {
        Row: Squad;
        Insert: Partial<Squad>;
        Update: Partial<Squad>;
      };
      squad_members: {
        Row: SquadMember;
        Insert: Partial<SquadMember>;
        Update: Partial<SquadMember>;
      };
      fleet_assets: {
        Row: FleetAsset;
        Insert: Partial<FleetAsset>;
        Update: Partial<FleetAsset>;
      };
    };
    Views: {
      // Add any views here if applicable
    };
    Functions: {
      // Add any stored procedures here if applicable
    };
    Enums: {
      instruction_request_status: InstructionRequestStatus;
      // Add other enums here
    };
  };
};
