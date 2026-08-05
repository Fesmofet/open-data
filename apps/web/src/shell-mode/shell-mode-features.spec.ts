import {
  getDesktopMenuKeys,
  HIDDEN_ON_DESKTOP_CLASS,
  shouldHideHeroOnDesktop,
  shouldUsePostGrid,
} from './shell-mode-features';

describe('shell-mode-features', () => {
  describe('shouldHideHeroOnDesktop', () => {
    it('returns true for twitter', () => {
      expect(shouldHideHeroOnDesktop('twitter')).toBe(true);
    });

    it('returns false for other modes', () => {
      expect(shouldHideHeroOnDesktop('default')).toBe(false);
      expect(shouldHideHeroOnDesktop('instagram')).toBe(false);
      expect(shouldHideHeroOnDesktop('compact')).toBe(false);
    });
  });

  describe('shouldUsePostGrid', () => {
    it('returns true for instagram', () => {
      expect(shouldUsePostGrid('instagram')).toBe(true);
    });

    it('returns false for other modes', () => {
      expect(shouldUsePostGrid('default')).toBe(false);
      expect(shouldUsePostGrid('twitter')).toBe(false);
      expect(shouldUsePostGrid('compact')).toBe(false);
    });
  });

  describe('getDesktopMenuKeys', () => {
    it('returns feed and transfers for instagram', () => {
      const keys = getDesktopMenuKeys('instagram');
      expect(keys).toEqual(new Set(['feed', 'transfers']));
    });

    it('returns null for other modes', () => {
      expect(getDesktopMenuKeys('default')).toBeNull();
      expect(getDesktopMenuKeys('twitter')).toBeNull();
      expect(getDesktopMenuKeys('compact')).toBeNull();
    });
  });

  it('HIDDEN_ON_DESKTOP_CLASS matches lg breakpoint gate', () => {
    expect(HIDDEN_ON_DESKTOP_CLASS).toBe('lg:hidden');
  });
});
