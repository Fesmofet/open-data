import { buildVideoEmbedUrl, parseVideoUrl } from './video-preview';

describe('parseVideoUrl', () => {
  it('returns YouTube preview from watch URL', () => {
    expect(parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    });
  });

  it('returns YouTube preview from youtu.be short link', () => {
    expect(parseVideoUrl('https://youtu.be/abcdefghijk')).toEqual({
      provider: 'youtube',
      videoId: 'abcdefghijk',
      embedUrl: 'https://www.youtube.com/embed/abcdefghijk',
      thumbnailUrl: 'https://img.youtube.com/vi/abcdefghijk/hqdefault.jpg',
    });
  });

  it('returns YouTube preview from embed URL', () => {
    expect(parseVideoUrl('https://youtube.com/embed/abcdefghijk')).toEqual({
      provider: 'youtube',
      videoId: 'abcdefghijk',
      embedUrl: 'https://www.youtube.com/embed/abcdefghijk',
      thumbnailUrl: 'https://img.youtube.com/vi/abcdefghijk/hqdefault.jpg',
    });
  });

  it('returns YouTube preview from shorts URL', () => {
    expect(parseVideoUrl('https://youtube.com/shorts/abcdefghijk')).toEqual({
      provider: 'youtube',
      videoId: 'abcdefghijk',
      embedUrl: 'https://www.youtube.com/embed/abcdefghijk',
      thumbnailUrl: 'https://img.youtube.com/vi/abcdefghijk/hqdefault.jpg',
    });
  });

  it('returns Vimeo preview', () => {
    expect(parseVideoUrl('https://vimeo.com/123456789')).toEqual({
      provider: 'vimeo',
      videoId: '123456789',
      embedUrl: 'https://player.vimeo.com/video/123456789',
      thumbnailUrl: 'https://vumbnail.com/123456789.jpg',
    });
  });

  it('returns 3Speak preview from watch URL', () => {
    expect(
      parseVideoUrl('https://3speak.tv/watch?v=author%2Fmy-post-permlink'),
    ).toEqual({
      provider: '3speak',
      videoId: 'author/my-post-permlink',
      embedUrl:
        'https://play.3speak.tv/watch?v=author%2Fmy-post-permlink&mode=iframe&layout=desktop',
      thumbnailUrl: null,
    });
  });

  it('returns 3Speak preview from play.3speak.tv embed URL', () => {
    expect(
      parseVideoUrl(
        'https://play.3speak.tv/watch?v=author%2Fpermlink&mode=iframe&layout=desktop',
      ),
    ).toEqual({
      provider: '3speak',
      videoId: 'author/permlink',
      embedUrl:
        'https://play.3speak.tv/watch?v=author%2Fpermlink&mode=iframe&layout=desktop',
      thumbnailUrl: null,
    });
  });

  it('returns DTube preview', () => {
    expect(parseVideoUrl('https://d.tube/#!/alice/my-video')).toEqual({
      provider: 'dtube',
      videoId: 'alice/my-video',
      embedUrl: 'https://emb.d.tube/#!/alice/my-video',
      thumbnailUrl: null,
    });
  });

  it('returns null for regular image URL', () => {
    expect(parseVideoUrl('https://cdn.example.com/photo.jpg')).toBeNull();
  });

  it('returns null for path traversal in 3Speak watch param', () => {
    expect(parseVideoUrl('https://3speak.tv/watch?v=..%2Fevil')).toBeNull();
  });

  it('normalizes protocol-relative URLs', () => {
    expect(parseVideoUrl('//youtu.be/abcdefghijk')?.videoId).toBe('abcdefghijk');
  });
});

describe('buildVideoEmbedUrl', () => {
  it('adds autoplay for YouTube', () => {
    const preview = parseVideoUrl('https://youtube.com/watch?v=abcdefghijk');
    expect(preview).not.toBeNull();
    expect(buildVideoEmbedUrl(preview!, { autoplay: true })).toBe(
      'https://www.youtube.com/embed/abcdefghijk?autoplay=1&rel=0',
    );
  });

  it('adds autoplay for Vimeo', () => {
    const preview = parseVideoUrl('https://vimeo.com/123456789');
    expect(preview).not.toBeNull();
    expect(buildVideoEmbedUrl(preview!, { autoplay: true })).toBe(
      'https://player.vimeo.com/video/123456789?autoplay=1',
    );
  });
});
