import { linkifyBareImageUrls, linkifyHiveMentions } from './social-content-html';

describe('linkifyHiveMentions', () => {
  it('wraps @username in profile links', () => {
    expect(linkifyHiveMentions('Hello @alice and @bob')).toBe(
      'Hello <a href="/@alice">@alice</a> and <a href="/@bob">@bob</a>',
    );
  });

  it('does not link email addresses', () => {
    const input = 'Contact user@example.com';
    expect(linkifyHiveMentions(input)).toBe(input);
  });
});

describe('linkifyBareImageUrls', () => {
  it('converts bare image URLs to img tags', () => {
    expect(linkifyBareImageUrls('see https://example.com/a.png here')).toBe(
      'see <img src="https://example.com/a.png" alt="" /> here',
    );
  });

  it('does not wrap URLs already inside img src attributes', () => {
    const html =
      '<p><img src="https://images.waivio.io/photo.jpg" alt="a"></p>';
    expect(linkifyBareImageUrls(html)).toBe(html);
  });
});
