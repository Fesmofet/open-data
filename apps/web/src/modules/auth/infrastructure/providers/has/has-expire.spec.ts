import {
  defaultHasSessionExpireMs,
  hasExpireToVerifyUnix,
  normalizeHasExpireTimestamp,
} from './has-expire';

describe('has-expire', () => {
  it('keeps millisecond timestamps unchanged', () => {
    expect(normalizeHasExpireTimestamp(1_735_689_600_000)).toBe(1_735_689_600_000);
  });

  it('converts unix seconds to milliseconds', () => {
    expect(normalizeHasExpireTimestamp(1_735_689_600)).toBe(1_735_689_600_000);
  });

  it('provides a 30-day default expire in milliseconds', () => {
    const before = Date.now();
    expect(defaultHasSessionExpireMs()).toBeGreaterThanOrEqual(before + 29 * 24 * 60 * 60 * 1000);
  });

  it('converts ms to unix seconds for backend verify', () => {
    expect(hasExpireToVerifyUnix(1_735_689_600_000)).toBe(1_735_689_600);
  });
});
