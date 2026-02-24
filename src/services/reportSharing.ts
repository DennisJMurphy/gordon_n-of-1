// src/services/reportSharing.ts
// Handles file-based report sharing with proper filenames

import { shareAsync } from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { Report } from '../types';
import { formatDateISO, slugify } from '../utils/dates';

/**
 * Generate a filename for a report export
 * Format: gordon-report-{slugified-episode-title}-{export-date}.json
 */
export function getReportFilename(episodeTitle: string): string {
  const dateStr = formatDateISO(new Date());
  const slug = slugify(episodeTitle);
  return `gordon-report-${slug}-${dateStr}.json`;
}

/**
 * Share a report as a JSON file via the native share sheet.
 * Writes JSON to a cache file, then shares the file URI on both platforms.
 */
export async function shareReportAsFile(
  report: Report,
  episodeTitle: string
): Promise<void> {
  const filename = getReportFilename(episodeTitle);

  // Pretty-print the JSON for readability
  const jsonContent = JSON.stringify(JSON.parse(report.report_json), null, 2);

  // Write to cache directory
  const file = new File(Paths.cache, filename);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(jsonContent);

  await shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: filename,
  });
}
