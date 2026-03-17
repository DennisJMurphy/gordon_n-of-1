import { getReportFilename } from '../reportSharing';

describe('getReportFilename', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 2, 17)); // Mar 17, 2026
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('generates filename with slugified title and current date', () => {
    expect(getReportFilename('Q1 2026')).toBe('gordon-report-q1-2026-2026-03-17.json');
  });

  it('handles special characters in title', () => {
    expect(getReportFilename('My Episode — Test!')).toBe('gordon-report-my-episode-test-2026-03-17.json');
  });

  it('handles a long title', () => {
    const title = 'A Very Long Episode Title With Many Words';
    const result = getReportFilename(title);
    expect(result).toBe('gordon-report-a-very-long-episode-title-with-many-words-2026-03-17.json');
  });
});
