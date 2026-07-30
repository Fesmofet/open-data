import { formatRelativeFeedTime } from './format-relative-time';

describe('formatRelativeFeedTime', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('treats timezone-less Hive timestamps as UTC', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-30T12:00:30.000Z'));

    expect(formatRelativeFeedTime('2026-07-30T12:00:00', 'en')).toBe(
      'just now',
    );
  });
});
