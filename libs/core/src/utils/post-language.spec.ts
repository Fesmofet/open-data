import { expandPostLanguageTags, normalizePostLanguageTag } from './post-language';

describe('normalizePostLanguageTag', () => {
  it('maps en-US to en', () => {
    expect(normalizePostLanguageTag('en-US')).toBe('en');
  });

  it('maps zh-CN to zh', () => {
    expect(normalizePostLanguageTag('zh-CN')).toBe('zh');
  });

  it('returns null for empty input', () => {
    expect(normalizePostLanguageTag('')).toBeNull();
  });
});

describe('expandPostLanguageTags', () => {
  it('includes both full tag and primary subtag', () => {
    expect(expandPostLanguageTags(['en-US'])).toEqual(['en-US', 'en']);
  });
});
