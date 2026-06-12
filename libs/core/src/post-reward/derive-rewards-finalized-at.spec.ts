import { deriveRewardsFinalizedAt } from './derive-rewards-finalized-at';

describe('deriveRewardsFinalizedAt', () => {
  const nowMs = Date.parse('2026-06-12T12:00:00.000Z');

  it('returns ISO timestamp for root post past cashout', () => {
    const result = deriveRewardsFinalizedAt(
      '2026-06-01T12:00:00.000Z',
      0,
      nowMs,
    );
    expect(result).toBe('2026-06-01T12:00:00.000Z');
  });

  it('returns null for future cashout', () => {
    expect(
      deriveRewardsFinalizedAt('2026-07-01T12:00:00.000Z', 0, nowMs),
    ).toBeNull();
  });

  it('returns null for comments (depth > 0)', () => {
    expect(
      deriveRewardsFinalizedAt('2026-06-01T12:00:00.000Z', 1, nowMs),
    ).toBeNull();
  });

  it('returns null when cashout_time missing', () => {
    expect(deriveRewardsFinalizedAt(null, 0, nowMs)).toBeNull();
  });
});
