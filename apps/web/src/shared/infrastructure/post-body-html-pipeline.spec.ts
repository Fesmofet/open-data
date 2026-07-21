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

  it('proxies remote body images through Hive 0x0', () => {
    const src =
      'https://ipfs.busy.org/ipfs/QmQ2G2GCrBVmwAQ8J6RCKZRrsXWByWAB6NGNaS6hCGa7go';
    const html = sanitizePostBodyHtml(`![image](${src})`);
    expect(html).toContain(`https://images.hive.blog/0x0/${src}`);
    expect(html).toContain(`data-fallback-src="${src}"`);
  });

  it('does not re-proxy digitaloceanspaces images', () => {
    const src =
      'https://waivio.nyc3.digitaloceanspaces.com/1562259409_photo.jpg';
    const html = sanitizePostBodyHtml(`<p><img src="${src}" alt=""></p>`);
    expect(html).toContain(`src="${src}"`);
    expect(html).not.toContain('images.hive.blog/0x0');
    expect(html).not.toContain('data-fallback-src');
  });
});
