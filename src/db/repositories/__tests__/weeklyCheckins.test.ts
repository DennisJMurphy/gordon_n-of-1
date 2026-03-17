import { getCurrentWeekStart } from '../weeklyCheckins';

describe('getCurrentWeekStart', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns Monday for a Wednesday', () => {
    jest.setSystemTime(new Date(2026, 2, 18)); // Wed Mar 18
    expect(getCurrentWeekStart()).toBe('2026-03-16'); // Mon Mar 16
  });

  it('returns Monday for a Monday', () => {
    jest.setSystemTime(new Date(2026, 2, 16)); // Mon Mar 16
    expect(getCurrentWeekStart()).toBe('2026-03-16');
  });

  it('returns previous Monday for a Sunday', () => {
    jest.setSystemTime(new Date(2026, 2, 22)); // Sun Mar 22
    expect(getCurrentWeekStart()).toBe('2026-03-16'); // Mon Mar 16
  });

  it('returns Monday for a Saturday', () => {
    jest.setSystemTime(new Date(2026, 2, 21)); // Sat Mar 21
    expect(getCurrentWeekStart()).toBe('2026-03-16');
  });

  it('returns Monday for a Friday', () => {
    jest.setSystemTime(new Date(2026, 2, 20)); // Fri Mar 20
    expect(getCurrentWeekStart()).toBe('2026-03-16');
  });

  it('handles month boundary (Sunday in new month)', () => {
    jest.setSystemTime(new Date(2026, 3, 5)); // Sun Apr 5
    expect(getCurrentWeekStart()).toBe('2026-03-30'); // Mon Mar 30
  });
});
