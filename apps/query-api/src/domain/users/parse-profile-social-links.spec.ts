import { parseProfileSocialLinks } from './parse-profile-social-links';

describe('parseProfileSocialLinks', () => {
  it('returns links for known social keys in legacy order', () => {
    const rows = parseProfileSocialLinks({
      twitter: 'flowmaster',
      facebook: 'fbuser',
      empty: '',
      bitcoin: 'addr',
    });
    expect(rows).toEqual([
      {
        type: 'facebook',
        value: 'fbuser',
        href: 'https://www.facebook.com/fbuser',
      },
      {
        type: 'twitter',
        value: 'flowmaster',
        href: 'https://x.com/flowmaster',
      },
    ]);
  });

  it('returns empty array when profile is missing', () => {
    expect(parseProfileSocialLinks(undefined)).toEqual([]);
  });
});
