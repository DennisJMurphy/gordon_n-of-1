// src/utils/dates.ts
// Date utilities for Gordon

/**
 * Get the current calendar quarter end date
 * Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec
 */
export function getQuarterEndDate(date: Date = new Date()): Date {
  const month = date.getMonth();
  const year = date.getFullYear();
  
  if (month <= 2) {
    // Q1 ends March 31
    return new Date(year, 2, 31);
  } else if (month <= 5) {
    // Q2 ends June 30
    return new Date(year, 5, 30);
  } else if (month <= 8) {
    // Q3 ends September 30
    return new Date(year, 8, 30);
  } else {
    // Q4 ends December 31
    return new Date(year, 11, 31);
  }
}

/**
 * Get current quarter label (e.g., "Q1 2026")
 */
export function getQuarterLabel(date: Date = new Date()): string {
  const month = date.getMonth();
  const year = date.getFullYear();
  
  let quarter: number;
  if (month <= 2) quarter = 1;
  else if (month <= 5) quarter = 2;
  else if (month <= 8) quarter = 3;
  else quarter = 4;
  
  return `Q${quarter} ${year}`;
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display (e.g., "Jan 30, 2026")
 */
export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get ISO timestamp
 */
export function getISOTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Get the quarter start date for a given date
 */
export function getQuarterStartDate(date: Date = new Date()): Date {
  const month = date.getMonth();
  const year = date.getFullYear();

  if (month <= 2) return new Date(year, 0, 1);
  if (month <= 5) return new Date(year, 3, 1);
  if (month <= 8) return new Date(year, 6, 1);
  return new Date(year, 9, 1);
}

export function isValidApproximateDate(value: string): boolean {
  if (!/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(value)) return false;
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  if (year < 1 || year > 9999) return false;
  if (!monthText) return true;

  const month = Number(monthText);
  if (month < 1 || month > 12) return false;
  if (!dayText) return true;

  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

export function formatApproximateDate(value?: string): string {
  if (!value) return 'Date unknown';
  if (value.length === 4) return value;
  if (value.length === 7) {
    const [year, month] = value.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }
  return formatDateDisplay(value);
}

export function getElapsedCalendarDays(start?: string, end?: string): number | null {
  if (!start || !end || start.length !== 10 || end.length !== 10 ||
      !isValidApproximateDate(start) || !isValidApproximateDate(end)) {
    return null;
  }
  const toUtcDay = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  const elapsed = (toUtcDay(end) - toUtcDay(start)) / 86_400_000;
  return elapsed >= 0 ? elapsed : null;
}

/**
 * Slugify a string for use in filenames (lowercase, hyphens, no special chars)
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
