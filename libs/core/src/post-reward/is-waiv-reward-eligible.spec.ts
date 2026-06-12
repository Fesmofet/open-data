import { isWaivRewardEligible, parseJsonMetadataTags } from './is-waiv-reward-eligible';

describe('isWaivRewardEligible', () => {
  it('returns true when tags include waivio', () => {
    expect(isWaivRewardEligible('{"tags":["waivio","photo"]}')).toBe(true);
  });

  it('returns false without eligible tags', () => {
    expect(isWaivRewardEligible('{"tags":["photo"]}')).toBe(false);
  });
});

describe('parseJsonMetadataTags', () => {
  it('returns empty for invalid json', () => {
    expect(parseJsonMetadataTags('not-json')).toEqual([]);
  });
});
