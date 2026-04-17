// src/types/index.ts
// Core type definitions for Gordon

export type Sex = 'male' | 'female' | 'intersex' | 'prefer_not_to_say' | 'other';
export type RelationshipStatus = 'single' | 'long_term' | 'married' | 'prefer_not_to_say';
export type EpisodeType = 'observational' | 'intervention';
export type EpisodeStatus = 'active' | 'closed';
export type Confidence = 'sure' | 'mostly' | 'guessing';
export type WithFood = 'yes' | 'no' | 'mixed';
export type Route = 'oral' | 'sublingual';
export type Form = 'powder' | 'capsule' | 'liquid' | 'food';
export type Compound = 'nmn' | 'tmg' | 'omega3' | 'magnesium' | 'creatine' | 'collagen' | 'other';
export type Timing = 'upon_waking' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'before_bed';
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type AdherenceBin = 'every_day' | 'most_days' | 'some_days' | 'rarely' | 'not_at_all';

// Routine item for baseline context — standard/habitual interventions
export interface RoutineItem {
  compound: Compound;
  custom_name?: string;
  dose?: number;
  unit?: string;
  route?: Route;
  form?: Form;
  timing: Timing[];
  frequency?: Frequency;
  with_food?: WithFood;
  brand?: string;
  product?: string;
  start_date?: string; // YYYY-MM-DD or YYYY-MM
  consistency_pct?: number; // 0-100
  notes?: string;
}

// Share defaults per field
export interface ShareDefaults {
  sex?: boolean;
  age_bracket?: boolean;
  height_bracket_cm?: boolean;
  weight_bracket_kg?: boolean;
  relationship_status?: boolean;
  typical_cardio_min_per_week?: boolean;
  health_notes?: boolean;
  routine?: boolean;
}

// Baseline context entity
export interface BaselineContext {
  id: string;
  created_at: string;
  updated_at: string;
  sex?: Sex;
  age_bracket?: string;
  height_bracket_cm?: string;
  weight_bracket_kg?: string;
  relationship_status?: RelationshipStatus;
  typical_cardio_min_per_week?: number;
  health_notes?: string;
  routine: RoutineItem[];
  share_defaults: ShareDefaults;
}

// Episode entity
export interface Episode {
  id: string;
  title: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  type: EpisodeType;
  status: EpisodeStatus;
  special_summary?: string;
  created_at: string;
  updated_at: string;
}

// Intervention entity
export interface Intervention {
  id: string;
  episode_id: string;
  compound: Compound;
  custom_name?: string;
  dose?: number;
  unit?: string;
  route?: Route;
  form?: Form;
  timing: Timing[];
  frequency?: Frequency;
  with_food?: WithFood;
  brand?: string;
  product?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Weekly check-in entity
export interface WeeklyCheckin {
  id: string;
  episode_id: string;
  week_start_date: string; // YYYY-MM-DD
  adherence: Record<string, AdherenceBin>; // compound -> bin
  changes: {
    diet?: boolean;
    exercise?: boolean;
    sleep?: boolean;
    supplements?: boolean;
    illness?: boolean;
    travel?: boolean;
    stress?: boolean;
  };
  events: string[];
  confidence?: Confidence;
  created_at: string;
  updated_at: string;
}

// Day note entity
export interface DayNote {
  id: string;
  episode_id: string;
  date: string; // YYYY-MM-DD
  note?: string;
  created_at: string;
  updated_at: string;
}

// Report entity
export interface Report {
  id: string;
  episode_id: string;
  schema_version: string;
  generated_at: string;
  report_json: string;
  private_json?: string;
  exported_to?: string;
  exported_at?: string;
}

// Onboarding state (transient, for the flow)
export interface OnboardingState {
  baseline: Partial<BaselineContext>;
  episode: Partial<Episode>;
  interventions: Partial<Intervention>[];
  reminders: {
    enabled: boolean;
    dayOfWeek: number; // 0-6, Sunday = 0
    time: string; // HH:MM
  };
}
