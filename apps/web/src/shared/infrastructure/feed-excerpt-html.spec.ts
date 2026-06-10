jest.mock('marked', () => ({
  marked: {
    parse: (input: string) => `<p>${input}</p>`,
  },
}));

import { feedExcerptToSafeHtml } from './feed-excerpt-html';

const PREVIEW_URL = 'https://images.hive.blog/DQmExample/preview.png';

describe('feedExcerptToSafeHtml', () => {
  it('omits bare image URL when it matches feed preview', () => {
    const html = feedExcerptToSafeHtml(
      `Hello ${PREVIEW_URL} world`,
      { omitImageUrl: PREVIEW_URL },
    );
    expect(html).not.toContain('<img');
    expect(html).toContain('Hello');
    expect(html).toContain('world');
  });

  it('omits markdown image when it matches feed preview', () => {
    const html = feedExcerptToSafeHtml(
      `Intro ![](${PREVIEW_URL}) outro`,
      { omitImageUrl: PREVIEW_URL },
    );
    expect(html).not.toContain('<img');
    expect(html).toContain('Intro');
    expect(html).toContain('outro');
  });

  it('omits HTML img tag when it matches feed preview', () => {
    const html = feedExcerptToSafeHtml(
      `<p>Text</p><img src="${PREVIEW_URL}" alt="" /><p>More</p>`,
      { omitImageUrl: PREVIEW_URL },
    );
    expect(html).not.toContain('<img');
    expect(html).toContain('Text');
    expect(html).toContain('More');
  });

  it('keeps other images when only preview URL is omitted', () => {
    const other = 'https://images.hive.blog/DQmOther/other.png';
    const html = feedExcerptToSafeHtml(`See ${other}`, {
      omitImageUrl: PREVIEW_URL,
    });
    expect(html).toContain(other);
    expect(html).toContain('<img');
  });

  it('strips 3Speak links and poster images when player is shown in the card', () => {
    const poster = 'https://cdn.example.com/poster.jpg';
    const html = feedExcerptToSafeHtml(
      `Watch https://3speak.tv/watch?v=author%2Fpost and ${poster}`,
      {
        omitImageUrls: [poster],
        stripThreeSpeakLinks: true,
      },
    );
    expect(html).not.toContain('3speak.tv');
    expect(html).not.toContain('<img');
    expect(html).not.toContain(poster);
  });
});
