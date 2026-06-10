jest.mock('marked', () => ({
  marked: {
    parse: (input: string) => `<p>${input}</p>`,
  },
}));

import { embedThreeSpeakInBody, sanitizePostBodyHtml } from './post-body-html-pipeline';

describe('embedThreeSpeakInBody', () => {
  it('replaces linked 3Speak poster with iframe and removes duplicate poster', () => {
    const html = embedThreeSpeakInBody(
      '<p><a href="https://3speak.tv/watch?v=author%2Fpost"><img src="https://cdn.example.com/poster.jpg" alt="" /></a></p>' +
        '<p><a href="https://3speak.tv/watch?v=author%2Fpost"><img src="https://cdn.example.com/poster.jpg" alt="" /></a></p>',
    );
    expect(html).toContain('play.3speak.tv');
    expect(html).toContain('blog-post-3speak-embed');
    expect(html).not.toContain('cdn.example.com/poster.jpg');
  });
});

describe('sanitizePostBodyHtml', () => {
  it('embeds 3Speak watch URL from markdown body', () => {
    const html = sanitizePostBodyHtml(
      'Check https://3speak.tv/watch?v=alice%2Fhello today',
    );
    expect(html).toContain('play.3speak.tv');
    expect(html).toContain('blog-post-3speak-embed');
  });
});
