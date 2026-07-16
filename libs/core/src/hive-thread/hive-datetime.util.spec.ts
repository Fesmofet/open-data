import {
  blockTimestampToUnixSeconds,
  hiveBlockTimestampToDate,
  hiveBlockTimestampToMillis,
  normalizeHiveBlockTimestampUtc,
} from './hive-datetime.util';

describe('normalizeHiveBlockTimestampUtc', () => {
  it('appends Z when timezone is missing', () => {
    expect(normalizeHiveBlockTimestampUtc('2026-07-16T13:08:12')).toBe(
      '2026-07-16T13:08:12Z',
    );
    expect(normalizeHiveBlockTimestampUtc('2026-07-16T13:08:12.000')).toBe(
      '2026-07-16T13:08:12.000Z',
    );
  });

  it('keeps explicit UTC or offset suffixes', () => {
    expect(normalizeHiveBlockTimestampUtc('2026-07-16T13:08:12.000Z')).toBe(
      '2026-07-16T13:08:12.000Z',
    );
    expect(normalizeHiveBlockTimestampUtc('2026-07-16T16:08:12+03:00')).toBe(
      '2026-07-16T16:08:12+03:00',
    );
  });
});

describe('hiveBlockTimestampToMillis', () => {
  it('parses Hive block timestamp as UTC regardless of host timezone', () => {
    const ms = hiveBlockTimestampToMillis('2026-07-16T13:08:12');
    expect(new Date(ms).toISOString()).toBe('2026-07-16T13:08:12.000Z');
  });
});

describe('hiveBlockTimestampToDate', () => {
  it('returns UTC instant for Hive block timestamp', () => {
    const date = hiveBlockTimestampToDate('2026-07-16T13:08:12.000');
    expect(date.toISOString()).toBe('2026-07-16T13:08:12.000Z');
  });
});

describe('blockTimestampToUnixSeconds', () => {
  it('matches UTC millis', () => {
    expect(blockTimestampToUnixSeconds('2026-07-16T13:08:12')).toBe(
      Math.floor(Date.parse('2026-07-16T13:08:12.000Z') / 1000),
    );
  });
});
