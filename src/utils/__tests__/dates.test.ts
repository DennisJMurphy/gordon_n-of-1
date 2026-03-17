import {
  formatDateISO,
  formatDateDisplay,
  getQuarterStartDate,
  getQuarterEndDate,
  getQuarterLabel,
  getDefaultEpisodeTitle,
  slugify,
} from '../dates';
import { Episode } from '../../types';

describe('formatDateISO', () => {
  it('formats a standard date', () => {
    expect(formatDateISO(new Date(2026, 2, 15))).toBe('2026-03-15');
  });

  it('zero-pads single-digit month and day', () => {
    expect(formatDateISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('handles December 31', () => {
    expect(formatDateISO(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('formatDateDisplay', () => {
  it('formats YYYY-MM-DD as "Mon D, YYYY"', () => {
    expect(formatDateDisplay('2026-01-30')).toBe('Jan 30, 2026');
  });

  it('formats a date in December', () => {
    expect(formatDateDisplay('2026-12-01')).toBe('Dec 1, 2026');
  });
});

describe('getQuarterStartDate', () => {
  it('returns Jan 1 for Q1', () => {
    const result = getQuarterStartDate(new Date(2026, 1, 15)); // Feb 15
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
  });

  it('returns Apr 1 for Q2', () => {
    const result = getQuarterStartDate(new Date(2026, 4, 1)); // May 1
    expect(result.getMonth()).toBe(3);
    expect(result.getDate()).toBe(1);
  });

  it('returns Jul 1 for Q3', () => {
    const result = getQuarterStartDate(new Date(2026, 7, 20)); // Aug 20
    expect(result.getMonth()).toBe(6);
    expect(result.getDate()).toBe(1);
  });

  it('returns Oct 1 for Q4', () => {
    const result = getQuarterStartDate(new Date(2026, 10, 10)); // Nov 10
    expect(result.getMonth()).toBe(9);
    expect(result.getDate()).toBe(1);
  });

  it('handles first day of quarter', () => {
    const result = getQuarterStartDate(new Date(2026, 0, 1)); // Jan 1
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
  });

  it('handles last day of quarter', () => {
    const result = getQuarterStartDate(new Date(2026, 2, 31)); // Mar 31
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
  });
});

describe('getQuarterEndDate', () => {
  it('returns Mar 31 for Q1', () => {
    const result = getQuarterEndDate(new Date(2026, 1, 15));
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(31);
  });

  it('returns Jun 30 for Q2', () => {
    const result = getQuarterEndDate(new Date(2026, 3, 1));
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(30);
  });

  it('returns Sep 30 for Q3', () => {
    const result = getQuarterEndDate(new Date(2026, 6, 1));
    expect(result.getMonth()).toBe(8);
    expect(result.getDate()).toBe(30);
  });

  it('returns Dec 31 for Q4', () => {
    const result = getQuarterEndDate(new Date(2026, 9, 15));
    expect(result.getMonth()).toBe(11);
    expect(result.getDate()).toBe(31);
  });
});

describe('getQuarterLabel', () => {
  it('returns Q1 for January', () => {
    expect(getQuarterLabel(new Date(2026, 0, 15))).toBe('Q1 2026');
  });

  it('returns Q2 for April', () => {
    expect(getQuarterLabel(new Date(2026, 3, 1))).toBe('Q2 2026');
  });

  it('returns Q3 for September', () => {
    expect(getQuarterLabel(new Date(2026, 8, 30))).toBe('Q3 2026');
  });

  it('returns Q4 for December', () => {
    expect(getQuarterLabel(new Date(2026, 11, 31))).toBe('Q4 2026');
  });
});

describe('getDefaultEpisodeTitle', () => {
  const makeEpisode = (start_date: string): Episode => ({
    id: 'ep-1',
    title: 'whatever',
    start_date,
    end_date: '2026-03-31',
    type: 'observational',
    status: 'active',
    created_at: '',
    updated_at: '',
  });

  it('returns quarter label with no existing episodes', () => {
    const result = getDefaultEpisodeTitle(new Date(2026, 0, 15), []);
    expect(result).toBe('Q1 2026');
  });

  it('appends e2 when one episode exists in same quarter', () => {
    const existing = [makeEpisode('2026-01-01')];
    const result = getDefaultEpisodeTitle(new Date(2026, 1, 10), existing);
    expect(result).toBe('Q1 2026 e2');
  });

  it('appends e3 when two episodes exist in same quarter', () => {
    const existing = [makeEpisode('2026-01-01'), makeEpisode('2026-02-15')];
    const result = getDefaultEpisodeTitle(new Date(2026, 2, 1), existing);
    expect(result).toBe('Q1 2026 e3');
  });

  it('does not count episodes from a different quarter', () => {
    const existing = [makeEpisode('2026-04-01')]; // Q2
    const result = getDefaultEpisodeTitle(new Date(2026, 0, 15), existing); // Q1
    expect(result).toBe('Q1 2026');
  });

  it('handles cross-year quarter boundaries', () => {
    const existing = [makeEpisode('2025-10-01')]; // Q4 2025
    const result = getDefaultEpisodeTitle(new Date(2026, 0, 1), existing); // Q1 2026
    expect(result).toBe('Q1 2026');
  });
});

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Q1 2026')).toBe('q1-2026');
  });

  it('removes special characters', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
  });

  it('collapses multiple separators', () => {
    expect(slugify('a   b---c')).toBe('a-b-c');
  });

  it('strips leading and trailing hyphens', () => {
    expect(slugify('--hello--')).toBe('hello');
  });

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('');
  });

  it('handles accented characters by stripping them', () => {
    expect(slugify('café résumé')).toBe('caf-r-sum');
  });
});
