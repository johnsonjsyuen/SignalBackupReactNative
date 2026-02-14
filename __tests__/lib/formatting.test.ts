import {
  formatFileSize,
  formatTimestamp,
  formatSpeed,
  formatEta,
  formatCountdown,
  formatScheduleTime,
} from '@/lib/formatting';

// ---------------------------------------------------------------------------
// formatFileSize
// ---------------------------------------------------------------------------

describe('formatFileSize', () => {
  it('returns "0 B" for zero bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('formats values in the bytes range (< 1 KB)', () => {
    expect(formatFileSize(1)).toBe('1 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1023)).toBe('1023 B');
  });

  it('formats the exact KB boundary (1024 bytes)', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
  });

  it('formats values in the KB range', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(10 * 1024)).toBe('10.0 KB');
    expect(formatFileSize(500 * 1024)).toBe('500.0 KB');
  });

  it('formats the exact MB boundary (1048576 bytes)', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB');
  });

  it('formats values in the MB range', () => {
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
    expect(formatFileSize(100 * 1024 * 1024)).toBe('100.0 MB');
    expect(formatFileSize(999 * 1024 * 1024)).toBe('999.0 MB');
  });

  it('formats the exact GB boundary (1073741824 bytes)', () => {
    expect(formatFileSize(1073741824)).toBe('1.00 GB');
  });

  it('formats values in the GB range with two decimal places', () => {
    expect(formatFileSize(1.5 * 1024 * 1024 * 1024)).toBe('1.50 GB');
    expect(formatFileSize(2.75 * 1024 * 1024 * 1024)).toBe('2.75 GB');
  });
});

// ---------------------------------------------------------------------------
// formatTimestamp
// ---------------------------------------------------------------------------

describe('formatTimestamp', () => {
  // Use UTC-based dates and compensate for timezone to make tests deterministic.
  // We construct dates with known local-time components.

  function makeLocalDate(
    year: number,
    month: number, // 0-based
    day: number,
    hours: number,
    minutes: number,
  ): number {
    return new Date(year, month, day, hours, minutes, 0, 0).getTime();
  }

  it('formats midnight as 12:00 AM', () => {
    const ts = makeLocalDate(2024, 0, 15, 0, 0);
    expect(formatTimestamp(ts)).toBe('Jan 15, 2024 12:00 AM');
  });

  it('formats noon as 12:00 PM', () => {
    const ts = makeLocalDate(2024, 0, 15, 12, 0);
    expect(formatTimestamp(ts)).toBe('Jan 15, 2024 12:00 PM');
  });

  it('formats PM times correctly', () => {
    const ts = makeLocalDate(2024, 0, 15, 15, 30);
    expect(formatTimestamp(ts)).toBe('Jan 15, 2024 3:30 PM');
  });

  it('formats AM times correctly', () => {
    const ts = makeLocalDate(2024, 5, 3, 9, 5);
    expect(formatTimestamp(ts)).toBe('Jun 3, 2024 9:05 AM');
  });

  it('pads single-digit minutes with a leading zero', () => {
    const ts = makeLocalDate(2024, 2, 1, 8, 3);
    expect(formatTimestamp(ts)).toBe('Mar 1, 2024 8:03 AM');
  });

  it('handles different months correctly', () => {
    const ts = makeLocalDate(2025, 11, 25, 18, 45);
    expect(formatTimestamp(ts)).toBe('Dec 25, 2025 6:45 PM');
  });

  it('handles 1 AM correctly (edge: hours=1 is not 0-mod-12)', () => {
    const ts = makeLocalDate(2024, 6, 4, 1, 0);
    expect(formatTimestamp(ts)).toBe('Jul 4, 2024 1:00 AM');
  });

  it('handles 11 PM correctly', () => {
    const ts = makeLocalDate(2024, 9, 31, 23, 59);
    expect(formatTimestamp(ts)).toBe('Oct 31, 2024 11:59 PM');
  });
});

// ---------------------------------------------------------------------------
// formatSpeed
// ---------------------------------------------------------------------------

describe('formatSpeed', () => {
  it('formats KB/s for speeds below 1 MB/s', () => {
    expect(formatSpeed(0)).toBe('0.0 KB/s');
    expect(formatSpeed(512 * 1024)).toBe('512.0 KB/s');
    expect(formatSpeed(1024)).toBe('1.0 KB/s');
  });

  it('formats MB/s at the exact boundary (1 MB/s)', () => {
    expect(formatSpeed(1024 * 1024)).toBe('1.0 MB/s');
  });

  it('formats MB/s for speeds above 1 MB/s', () => {
    expect(formatSpeed(5 * 1024 * 1024)).toBe('5.0 MB/s');
    expect(formatSpeed(1.5 * 1024 * 1024)).toBe('1.5 MB/s');
  });
});

// ---------------------------------------------------------------------------
// formatEta
// ---------------------------------------------------------------------------

describe('formatEta', () => {
  it('returns "calculating..." for negative values', () => {
    expect(formatEta(-1)).toBe('calculating...');
    expect(formatEta(-100)).toBe('calculating...');
  });

  it('returns "calculating..." for NaN', () => {
    expect(formatEta(NaN)).toBe('calculating...');
  });

  it('returns "calculating..." for Infinity', () => {
    expect(formatEta(Infinity)).toBe('calculating...');
    expect(formatEta(-Infinity)).toBe('calculating...');
  });

  it('returns "calculating..." when exceeding MAX_REASONABLE_SECONDS (359999)', () => {
    expect(formatEta(360000)).toBe('calculating...');
    expect(formatEta(999999)).toBe('calculating...');
  });

  it('formats 0 seconds', () => {
    expect(formatEta(0)).toBe('~0 sec remaining');
  });

  it('formats seconds under 60', () => {
    expect(formatEta(30)).toBe('~30 sec remaining');
    expect(formatEta(59)).toBe('~59 sec remaining');
    expect(formatEta(0.4)).toBe('~0 sec remaining');
    expect(formatEta(45.7)).toBe('~46 sec remaining');
  });

  it('formats exactly 60 seconds as minutes', () => {
    expect(formatEta(60)).toBe('~1 min remaining');
  });

  it('formats minutes (60-3599 seconds)', () => {
    expect(formatEta(90)).toBe('~2 min remaining');
    expect(formatEta(3599)).toBe('~60 min remaining');
    expect(formatEta(1800)).toBe('~30 min remaining');
  });

  it('formats hours + minutes for >= 3600 seconds', () => {
    expect(formatEta(3600)).toBe('~1h 0m remaining');
    expect(formatEta(2 * 3600 + 15 * 60)).toBe('~2h 15m remaining');
  });

  it('formats the max reasonable value', () => {
    // 359999 seconds = 99h 59m 59s
    expect(formatEta(359999)).toBe('~99h 60m remaining');
  });
});

// ---------------------------------------------------------------------------
// formatCountdown
// ---------------------------------------------------------------------------

describe('formatCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns "Now" when target is in the past', () => {
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    const pastTarget = Date.now() - 60_000;
    expect(formatCountdown(pastTarget)).toBe('Now');
  });

  it('returns "Now" when target is exactly now', () => {
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    expect(formatCountdown(Date.now())).toBe('Now');
  });

  it('returns minutes only when less than 1 hour', () => {
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    const target = Date.now() + 30 * 60_000; // 30 minutes
    expect(formatCountdown(target)).toBe('30m');
  });

  it('returns hours and zero-padded minutes', () => {
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    const target = Date.now() + 2 * 60 * 60_000 + 5 * 60_000; // 2h 5m
    expect(formatCountdown(target)).toBe('2h 05m');
  });

  it('returns exact hour with 00 minutes', () => {
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    const target = Date.now() + 3 * 60 * 60_000; // exactly 3 hours
    expect(formatCountdown(target)).toBe('3h 00m');
  });

  it('returns "0m" when target is less than 1 minute away', () => {
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    const target = Date.now() + 30_000; // 30 seconds
    expect(formatCountdown(target)).toBe('0m');
  });

  it('returns "1m" for exactly 1 minute away', () => {
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    const target = Date.now() + 60_000;
    expect(formatCountdown(target)).toBe('1m');
  });
});

// ---------------------------------------------------------------------------
// formatScheduleTime
// ---------------------------------------------------------------------------

describe('formatScheduleTime', () => {
  it('formats midnight (0, 0) as "12:00 AM"', () => {
    expect(formatScheduleTime(0, 0)).toBe('12:00 AM');
  });

  it('formats noon (12, 0) as "12:00 PM"', () => {
    expect(formatScheduleTime(12, 0)).toBe('12:00 PM');
  });

  it('formats 3:00 AM', () => {
    expect(formatScheduleTime(3, 0)).toBe('3:00 AM');
  });

  it('formats 3:30 PM (15:30)', () => {
    expect(formatScheduleTime(15, 30)).toBe('3:30 PM');
  });

  it('formats 23:59 as "11:59 PM"', () => {
    expect(formatScheduleTime(23, 59)).toBe('11:59 PM');
  });

  it('formats 1:05 AM with zero-padded minutes', () => {
    expect(formatScheduleTime(1, 5)).toBe('1:05 AM');
  });

  it('formats 12:30 PM', () => {
    expect(formatScheduleTime(12, 30)).toBe('12:30 PM');
  });

  it('formats 11:00 AM', () => {
    expect(formatScheduleTime(11, 0)).toBe('11:00 AM');
  });
});
