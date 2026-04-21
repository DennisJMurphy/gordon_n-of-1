// src/services/reportBuilder.ts
// Builds share-safe and private reports from episode data

import { 
  BaselineContext, 
  Episode, 
  Intervention, 
  WeeklyCheckin, 
  DayNote,
  ShareDefaults,
} from '../types';
import { getBaselineContext } from '../db/repositories/baselineContext';
import { getEpisodeById } from '../db/repositories/episodes';
import { getInterventionsByEpisode } from '../db/repositories/interventions';
import { getCheckinsByEpisode } from '../db/repositories/weeklyCheckins';
import { getNotesByEpisode } from '../db/repositories/dayNotes';
import { createReport } from '../db/repositories/reports';
import { getISOTimestamp } from '../utils/dates';

export const SCHEMA_VERSION = '0.2.0';

// Share-safe report structure
export interface ShareSafeReport {
  schema_version: string;
  generated_at: string;
  
  // Baseline (only shared fields)
  participant?: {
    sex?: string;
    age_bracket?: string;
    height_bracket_cm?: string;
    weight_bracket_kg?: string;
    relationship_status?: string;
    typical_cardio_min_per_week?: number;
    routine_summary?: string;
    standard_interventions?: {
      compound: string;
      custom_name?: string;
      dose?: number;
      unit?: string;
      route?: string;
      form?: string;
      timing: string[];
      frequency?: string;
      with_food?: string;
      start_date?: string;
      consistency_pct?: number;
    }[];
  };
  
  // Episode metadata (relative dates)
  episode: {
    type: string;
    duration_days: number;
    start_day: 0; // Always 0, relative
  };
  
  // Intervention summaries (no brand names in share-safe)
  interventions: {
    compound: string;
    custom_name?: string;
    dose?: number;
    unit?: string;
    route?: string;
    form?: string;
    timing: string[];
    frequency?: string;
    with_food?: string;
  }[];
  
  // Aggregated adherence
  adherence_summary: {
    compound: string;
    weeks_tracked: number;
    average_adherence: string; // 'every_day' | 'most_days' | etc.
  }[];
  
  // Changes summary (counts, not dates)
  changes_summary: {
    diet_changes: number;
    exercise_changes: number;
    sleep_changes: number;
    supplement_changes: number;
    illness_days: number;
    travel_days: number;
    stress_periods: number;
  };
  
  // Events count (no content in share-safe)
  notable_events_count: number;
  
  // Day notes count
  day_notes_count: number;
}

// Private report includes everything
export interface PrivateReport extends ShareSafeReport {
  // Full baseline
  full_participant?: Partial<BaselineContext>;
  
  // Full dates
  episode_dates: {
    start_date: string;
    end_date: string;
  };
  
  // Interventions with brand/product
  interventions_full: Intervention[];
  
  // All checkins with dates
  weekly_checkins: WeeklyCheckin[];
  
  // All day notes with dates
  day_notes: DayNote[];
  
  // Health notes
  health_notes?: string;
  
  // Episode summary
  special_summary?: string;
}

export interface ReportOptions {
  includeBaseline: boolean;
  includeDayNotes: boolean;
  shareOverrides: Partial<ShareDefaults>;
}

/**
 * Calculate relative day number from episode start
 */
function getRelativeDay(date: string, episodeStart: string): number {
  const d1 = new Date(date + 'T00:00:00');
  const d2 = new Date(episodeStart + 'T00:00:00');
  const diffTime = d1.getTime() - d2.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate average adherence from weekly checkins
 */
function calculateAverageAdherence(
  checkins: WeeklyCheckin[],
  compound: string
): string {
  const adherenceValues: Record<string, number> = {
    'every_day': 5,
    'most_days': 4,
    'some_days': 3,
    'rarely': 2,
    'not_at_all': 1,
  };
  
  const reverseValues: Record<number, string> = {
    5: 'every_day',
    4: 'most_days',
    3: 'some_days',
    2: 'rarely',
    1: 'not_at_all',
  };
  
  const values = checkins
    .filter(c => c.adherence[compound])
    .map(c => adherenceValues[c.adherence[compound]] || 3);
  
  if (values.length === 0) return 'unknown';
  
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  return reverseValues[avg] || 'some_days';
}

/**
 * Aggregate change flags across all checkins
 */
function aggregateChanges(checkins: WeeklyCheckin[]): ShareSafeReport['changes_summary'] {
  return {
    diet_changes: checkins.filter(c => c.changes.diet).length,
    exercise_changes: checkins.filter(c => c.changes.exercise).length,
    sleep_changes: checkins.filter(c => c.changes.sleep).length,
    supplement_changes: checkins.filter(c => c.changes.supplements).length,
    illness_days: checkins.filter(c => c.changes.illness).length,
    travel_days: checkins.filter(c => c.changes.travel).length,
    stress_periods: checkins.filter(c => c.changes.stress).length,
  };
}

/**
 * Build the share-safe report
 */
export function buildShareSafeReport(
  baseline: BaselineContext | null,
  episode: Episode,
  interventions: Intervention[],
  checkins: WeeklyCheckin[],
  dayNotes: DayNote[],
  options: ReportOptions
): ShareSafeReport {
  const durationDays = getRelativeDay(episode.end_date, episode.start_date) + 1;
  
  // Merge share defaults with overrides
  const shareSettings: ShareDefaults = {
    ...(baseline?.share_defaults || {}),
    ...options.shareOverrides,
  };
  
  // Build participant section (only shared fields)
  let participant: ShareSafeReport['participant'] | undefined;
  if (options.includeBaseline && baseline) {
    participant = {};
    if (shareSettings.sex) participant.sex = baseline.sex;
    if (shareSettings.age_bracket) participant.age_bracket = baseline.age_bracket;
    if (shareSettings.height_bracket_cm) participant.height_bracket_cm = baseline.height_bracket_cm;
    if (shareSettings.weight_bracket_kg) participant.weight_bracket_kg = baseline.weight_bracket_kg;
    if (shareSettings.relationship_status) participant.relationship_status = baseline.relationship_status;
    if (shareSettings.typical_cardio_min_per_week) participant.typical_cardio_min_per_week = baseline.typical_cardio_min_per_week;
    if (shareSettings.routine && baseline.routine.length > 0) {
      participant.routine_summary = `${baseline.routine.length} tracked habits/supplements`;
      participant.standard_interventions = baseline.routine.map(r => ({
        compound: r.compound,
        custom_name: r.custom_name,
        dose: r.dose,
        unit: r.unit,
        route: r.route,
        form: r.form,
        timing: r.timing,
        frequency: r.frequency,
        with_food: r.with_food,
        start_date: r.start_date,
        consistency_pct: r.consistency_pct,
        // brand/product stripped for share-safe
      }));
    }
    
    // Remove empty participant
    if (Object.keys(participant).length === 0) {
      participant = undefined;
    }
  }
  
  // Build interventions (share-safe: no brand/product)
  const interventionsSafe = interventions.map(i => ({
    compound: i.compound,
    custom_name: i.custom_name,
    dose: i.dose,
    unit: i.unit,
    route: i.route,
    form: i.form,
    timing: i.timing,
    frequency: i.frequency,
    with_food: i.with_food,
  }));
  
  // Build adherence summary
  const adherenceSummary = interventions.map(i => ({
    compound: i.compound,
    weeks_tracked: checkins.filter(c => c.adherence[i.compound]).length,
    average_adherence: calculateAverageAdherence(checkins, i.compound),
  }));
  
  // Count notable events
  const notableEventsCount = checkins.reduce((sum, c) => sum + c.events.length, 0);
  
  return {
    schema_version: SCHEMA_VERSION,
    generated_at: getISOTimestamp(),
    participant,
    episode: {
      type: episode.type,
      duration_days: durationDays,
      start_day: 0,
    },
    interventions: interventionsSafe,
    adherence_summary: adherenceSummary,
    changes_summary: aggregateChanges(checkins),
    notable_events_count: notableEventsCount,
    day_notes_count: options.includeDayNotes ? dayNotes.length : 0,
  };
}

/**
 * Build the private report (includes everything)
 */
export function buildPrivateReport(
  baseline: BaselineContext | null,
  episode: Episode,
  interventions: Intervention[],
  checkins: WeeklyCheckin[],
  dayNotes: DayNote[],
  options: ReportOptions
): PrivateReport {
  const shareSafe = buildShareSafeReport(baseline, episode, interventions, checkins, dayNotes, options);
  
  return {
    ...shareSafe,
    full_participant: baseline ? {
      sex: baseline.sex,
      age_bracket: baseline.age_bracket,
      height_bracket_cm: baseline.height_bracket_cm,
      weight_bracket_kg: baseline.weight_bracket_kg,
      relationship_status: baseline.relationship_status,
      typical_cardio_min_per_week: baseline.typical_cardio_min_per_week,
      routine: baseline.routine,
    } : undefined,
    episode_dates: {
      start_date: episode.start_date,
      end_date: episode.end_date,
    },
    interventions_full: interventions,
    weekly_checkins: checkins,
    day_notes: options.includeDayNotes ? dayNotes : [],
    health_notes: baseline?.health_notes,
    special_summary: episode.special_summary,
  };
}

/**
 * Load all data for an episode and generate reports
 */
export async function generateReports(
  episodeId: string,
  options: ReportOptions
): Promise<{ shareSafe: ShareSafeReport; private: PrivateReport }> {
  const [baseline, episode, interventions, checkins, dayNotes] = await Promise.all([
    getBaselineContext(),
    getEpisodeById(episodeId),
    getInterventionsByEpisode(episodeId),
    getCheckinsByEpisode(episodeId),
    getNotesByEpisode(episodeId),
  ]);
  
  if (!episode) {
    throw new Error('Episode not found');
  }
  
  const shareSafe = buildShareSafeReport(baseline, episode, interventions, checkins, dayNotes, options);
  const privateReport = buildPrivateReport(baseline, episode, interventions, checkins, dayNotes, options);
  
  return { shareSafe, private: privateReport };
}

/**
 * Generate and save reports for an episode
 */
export async function generateAndSaveReports(
  episodeId: string,
  options: ReportOptions
): Promise<string> {
  const { shareSafe, private: privateReport } = await generateReports(episodeId, options);
  
  const report = await createReport({
    episode_id: episodeId,
    schema_version: SCHEMA_VERSION,
    generated_at: shareSafe.generated_at,
    report_json: JSON.stringify(shareSafe),
    private_json: JSON.stringify(privateReport),
  });
  
  return report.id;
}

/**
 * Get a preview of what will be included in the share-safe report
 */
export async function getReportPreview(
  episodeId: string,
  options: ReportOptions
): Promise<{
  baseline: BaselineContext | null;
  episode: Episode;
  interventions: Intervention[];
  checkinCount: number;
  dayNoteCount: number;
  shareSafe: ShareSafeReport;
}> {
  const [baseline, episode, interventions, checkins, dayNotes] = await Promise.all([
    getBaselineContext(),
    getEpisodeById(episodeId),
    getInterventionsByEpisode(episodeId),
    getCheckinsByEpisode(episodeId),
    getNotesByEpisode(episodeId),
  ]);
  
  if (!episode) {
    throw new Error('Episode not found');
  }
  
  const shareSafe = buildShareSafeReport(baseline, episode, interventions, checkins, dayNotes, options);
  
  return {
    baseline,
    episode,
    interventions,
    checkinCount: checkins.length,
    dayNoteCount: dayNotes.length,
    shareSafe,
  };
}
