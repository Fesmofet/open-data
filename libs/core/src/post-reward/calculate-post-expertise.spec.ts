import {
  calculatePostExpertiseBaseUsd,
  calculatePostExpertiseDeltas,
  splitPostExpertiseByObjects,
} from './calculate-post-expertise';
import {
  EXPERTISE_MULTIPLIER_POST_HF25,
  EXPERTISE_MULTIPLIER_PRE_HF25,
  HF25_EXPERTISE_CUTOFF_UNIX,
} from './post-expertise.constants';

describe('calculatePostExpertiseBaseUsd', () => {
  const baseInput = {
    pendingPayoutValue: '0.000 HBD',
    totalPayoutValue: '2.000 HBD',
    curatorPayoutValue: '2.000 HBD',
    maxAcceptedPayout: '1000000.000 HBD',
    totalPayoutWaiv: 0,
    totalRewardsWaiv: 10,
    createdUnix: HF25_EXPERTISE_CUTOFF_UNIX + 1,
  };

  it('applies post-HF25 multiplier to total payout', () => {
    const base = calculatePostExpertiseBaseUsd(baseInput, 0.1);
    // (2 + 2 + 0 + 1) * 0.5 = 2.5
    expect(base).toBe(2.5);
  });

  it('uses pre-HF25 multiplier for older posts', () => {
    const base = calculatePostExpertiseBaseUsd(
      { ...baseInput, createdUnix: HF25_EXPERTISE_CUTOFF_UNIX - 1 },
      0.1,
    );
    expect(base).toBe(3.75);
  });

  it('caps by max_accepted_payout', () => {
    const base = calculatePostExpertiseBaseUsd(
      {
        ...baseInput,
        maxAcceptedPayout: '1.000 HBD',
      },
      0.1,
    );
    expect(base).toBe(0.5);
  });
});

describe('splitPostExpertiseByObjects', () => {
  it('merges duplicate objectId shares', () => {
    const deltas = splitPostExpertiseByObjects(10, [
      { objectId: 'a', percent: 30 },
      { objectId: 'a', percent: 20 },
      { objectId: 'b', percent: 50 },
    ]);
    expect(deltas).toEqual([
      { objectId: 'a', delta: 5 },
      { objectId: 'b', delta: 5 },
    ]);
  });

  it('splits by percent and skips zero shares', () => {
    const deltas = splitPostExpertiseByObjects(10, [
      { objectId: 'a', percent: 60 },
      { objectId: 'b', percent: 40 },
      { objectId: 'c', percent: 0 },
    ]);
    expect(deltas).toEqual([
      { objectId: 'a', delta: 6 },
      { objectId: 'b', delta: 4 },
    ]);
  });
});

describe('calculatePostExpertiseDeltas', () => {
  it('returns empty when payout is zero', () => {
    const deltas = calculatePostExpertiseDeltas(
      {
        pendingPayoutValue: '0.000 HBD',
        totalPayoutValue: '0.000 HBD',
        curatorPayoutValue: '0.000 HBD',
        maxAcceptedPayout: '1000000.000 HBD',
        totalPayoutWaiv: 0,
        totalRewardsWaiv: 0,
        createdUnix: HF25_EXPERTISE_CUTOFF_UNIX + 1,
      },
      0.1,
      [{ objectId: 'neoxian', percent: 100 }],
    );
    expect(deltas).toEqual([]);
  });

  it('computes per-object deltas', () => {
    const deltas = calculatePostExpertiseDeltas(
      {
        pendingPayoutValue: '0.000 HBD',
        totalPayoutValue: '1.000 HBD',
        curatorPayoutValue: '0.000 HBD',
        maxAcceptedPayout: '1000000.000 HBD',
        totalPayoutWaiv: 0,
        totalRewardsWaiv: 0,
        createdUnix: HF25_EXPERTISE_CUTOFF_UNIX + 1,
      },
      0,
      [
        { objectId: 'neoxian', percent: 50 },
        { objectId: 'waivio', percent: 50 },
      ],
    );
    expect(deltas).toEqual([
      { objectId: 'neoxian', delta: 0.25 },
      { objectId: 'waivio', delta: 0.25 },
    ]);
  });
});

describe('expertiseMultiplierForCreatedUnix', () => {
  it('exports expected constants', () => {
    expect(EXPERTISE_MULTIPLIER_POST_HF25).toBe(0.5);
    expect(EXPERTISE_MULTIPLIER_PRE_HF25).toBe(0.75);
  });
});
