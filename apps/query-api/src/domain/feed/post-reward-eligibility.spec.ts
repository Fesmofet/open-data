import { isWaivRewardEligible } from './post-reward-eligibility';

describe('isWaivRewardEligible', () => {
  it('returns true when tags intersect eligible list', () => {
    expect(isWaivRewardEligible('{"tags":["waivio","photo"]}')).toBe(true);
  });

  it('returns false for unrelated tags', () => {
    expect(isWaivRewardEligible('{"tags":["photo"]}')).toBe(false);
  });
});
