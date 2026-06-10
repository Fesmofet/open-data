import {
  isBrokenThreeSpeakStaticThumbnail,
  isThreeSpeakEmbedUrl,
  parseThreeSpeakVideoIdFromEmbedUrl,
} from './three-speak-preview';

describe('three-speak-preview', () => {
  it('detects legacy static thumbnail host as broken', () => {
    expect(
      isBrokenThreeSpeakStaticThumbnail(
        'https://img.3speakcontent.co/author/post/post.png',
      ),
    ).toBe(true);
  });

  it('parses video id from play.3speak.tv embed URL', () => {
    const url =
      'https://play.3speak.tv/watch?v=author%2Fmy-post&mode=iframe&layout=desktop';
    expect(isThreeSpeakEmbedUrl(url)).toBe(true);
    expect(parseThreeSpeakVideoIdFromEmbedUrl(url)).toBe('author/my-post');
  });

  it('parses video id from 3speak.tv watch URL', () => {
    const url = 'https://3speak.tv/watch?v=alice%2Fhello';
    expect(isThreeSpeakEmbedUrl(url)).toBe(true);
    expect(parseThreeSpeakVideoIdFromEmbedUrl(url)).toBe('alice/hello');
  });
});
