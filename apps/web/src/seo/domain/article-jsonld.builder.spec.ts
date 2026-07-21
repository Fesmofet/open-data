import { buildArticleJsonLd } from './article-jsonld.builder';
import type { PostSeoInput } from './metadata.types';

const basePost: PostSeoInput = {
  authorName: 'alice',
  permlink: 'hello-world',
  title: 'Hello World',
  excerpt: 'Short excerpt for the post.',
  thumbnailUrl: 'https://cdn.example/thumb.jpg',
  videoThumbnailUrl: null,
  authorDisplayName: 'Alice',
  authorAvatarUrl: 'https://cdn.example/alice.jpg',
  createdAt: '2026-01-01T00:00:00.000Z',
  permalinkPath: '/@alice/hello-world',
};

describe('buildArticleJsonLd', () => {
  it('builds Article schema with title and Hive-proxied image', () => {
    const json = buildArticleJsonLd(basePost, 'https://site.com/@alice/hello-world');
    expect(json['@type']).toBe('Article');
    expect(json.headline).toBe('Hello World');
    expect(json.image).toBe(
      'https://images.hive.blog/0x0/https://cdn.example/thumb.jpg',
    );
    expect(json.mainEntityOfPage).toBe('https://site.com/@alice/hello-world');
    expect((json.author as { image?: string }).image).toBe(
      'https://images.hive.blog/0x0/https://cdn.example/alice.jpg',
    );
  });

  it('falls back to excerpt when title is missing', () => {
    const json = buildArticleJsonLd(
      { ...basePost, title: null },
      'https://site.com/@alice/hello-world',
    );
    expect(json.headline).toBe('Short excerpt for the post.');
  });
});
