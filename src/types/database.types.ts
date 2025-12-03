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

// Generic fallback type for dynamic tables
type GenericRow = Record<string, any>;

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
      events: { Row: GenericRow; Insert: Partial<GenericRow>; Update: Partial<GenericRow> };
      player_status: { Row: GenericRow; Insert: Partial<GenericRow>; Update: Partial<GenericRow> };
      squad_members: { Row: GenericRow; Insert: Partial<GenericRow>; Update: Partial<GenericRow> };
      voice_nets: { Row: GenericRow; Insert: Partial<GenericRow>; Update: Partial<GenericRow> };
      messages: { Row: GenericRow; Insert: Partial<GenericRow>; Update: Partial<GenericRow> };
      coffer_transactions: { Row: GenericRow; Insert: Partial<GenericRow>; Update: Partial<GenericRow> };
      coffers: { Row: GenericRow; Insert: Partial<GenericRow>; Update: Partial<GenericRow> };
      fleet_assets: { Row: GenericRow; Insert: Partial<GenericRow>; Update: Partial<GenericRow> };
      roles: { Row: GenericRow; Insert: Partial<GenericRow>; Update: Partial<GenericRow> };
      missions: { Row: GenericRow; Insert: Partial<GenericRow>; Update: Partial<GenericRow> };
      channels: { Row: GenericRow; Insert: Partial<GenericRow>; Update: Partial<GenericRow> };
      ai_agent_logs: { Row: GenericRow; Insert: Partial<GenericRow>; Update: Partial<GenericRow> };
      ai_agents: { Row: GenericRow; Insert: Partial<GenericRow>; Update: Partial<GenericRow> };
      ai_agent_rules: { Row: GenericRow; Insert: Partial<GenericRow>; Update: Partial<GenericRow> };
      armory_items: { Row: GenericRow; Insert: Partial<GenericRow>; Update: Partial<GenericRow> };
      squads: { Row: GenericRow; Insert: Partial<GenericRow>; Update: Partial<GenericRow> };
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
