import { shouldApplyAuthorityReplace } from './account-authority-guard';

describe('account-authority-guard', () => {
  it('allows replace when max is null', () => {
    expect(shouldApplyAuthorityReplace(1, null)).toBe(true);
  });

  it('allows replace when incoming >= max', () => {
    expect(shouldApplyAuthorityReplace(101, 100)).toBe(true);
    expect(shouldApplyAuthorityReplace(100, 100)).toBe(true);
  });

  it('rejects replace when incoming < max', () => {
    expect(shouldApplyAuthorityReplace(99, 100)).toBe(false);
  });
});
