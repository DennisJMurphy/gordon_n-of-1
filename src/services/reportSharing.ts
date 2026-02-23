// src/services/reportSharing.ts
// Handles file-based report sharing with proper filenames

import { Share, Platform } from 'react-native';
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
 * Share a report as a JSON file.
 * Writes to a cache file and shares the file URI.
 * Returns true if the user completed the share action.
 */
export async function shareReportAsFile(
  report: Report,
  episodeTitle: string
): Promise<boolean> {
  const filename = getReportFilename(episodeTitle);

  // Pretty-print the JSON for readability
  const jsonContent = JSON.stringify(JSON.parse(report.report_json), null, 2);

  // Write to cache directory using the new expo-file-system API
  const file = new File(Paths.cache, filename);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(jsonContent);

  if (Platform.OS === 'ios') {
    const result = await Share.share({
      url: file.uri,
      title: filename,
    });
    return result.action === Share.sharedAction;
  } else {
    // On Android, share the file URI
    const result = await Share.share({
      message: jsonContent,
      title: filename,
    });
    return result.action === Share.sharedAction;
  }
}
