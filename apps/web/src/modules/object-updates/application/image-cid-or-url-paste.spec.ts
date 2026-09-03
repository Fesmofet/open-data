import {
  looksLikeImageUrl,
  parseHttpUrlFromPaste,
  parseImageUrlFromPaste,
} from './image-cid-or-url-paste';

describe('parseHttpUrlFromPaste', () => {
  it('accepts a plain https URL', () => {
    expect(parseHttpUrlFromPaste('https://cdn.example/a.jpg')).toBe(
      'https://cdn.example/a.jpg',
    );
  });

  it('extracts URL from surrounding text', () => {
    expect(parseHttpUrlFromPaste('see https://cdn.example/x.png thanks')).toBe(
      'https://cdn.example/x.png',
    );
  });

  it('returns null for non-URL text', () => {
    expect(parseHttpUrlFromPaste('hello')).toBeNull();
  });
});

describe('parseImageUrlFromPaste', () => {
  it('rejects a non-image http URL (production regression)', () => {
    expect(parseImageUrlFromPaste('https://jobs.example/line-cook')).toBeNull();
  });

  it('accepts a pathname .jpg image URL', () => {
    expect(parseImageUrlFromPaste('https://cdn.example/photo.jpg')).toBe(
      'https://cdn.example/photo.jpg',
    );
  });

  it('accepts an image URL when query params follow the pathname extension', () => {
    expect(parseImageUrlFromPaste('https://cdn.example/photo.jpg?w=800')).toBe(
      'https://cdn.example/photo.jpg?w=800',
    );
  });

  it('accepts a content-gateway image URL without a file extension', () => {
    const url = 'https://host.example/ipfs-gateway/content/image/bafyTestCid';
    expect(parseImageUrlFromPaste(url)).toBe(url);
  });

  it('rejects surrounding prose that only contains a non-image URL', () => {
    expect(
      parseImageUrlFromPaste('see https://jobs.example/line-cook thanks'),
    ).toBeNull();
  });

  it.each([
    ['jpg', 'https://cdn.example/a.jpg'],
    ['jpeg', 'https://cdn.example/a.jpeg'],
    ['png', 'https://cdn.example/a.png'],
    ['gif', 'https://cdn.example/a.gif'],
    ['webp', 'https://cdn.example/a.webp'],
    ['svg', 'https://cdn.example/a.svg'],
    ['avif', 'https://cdn.example/a.avif'],
    ['bmp', 'https://cdn.example/a.bmp'],
  ])('accepts pathname .%s extension', (_ext, url) => {
    expect(parseImageUrlFromPaste(url)).toBe(url);
  });

  it('rejects empty and whitespace-only clipboard text', () => {
    expect(parseImageUrlFromPaste('')).toBeNull();
    expect(parseImageUrlFromPaste('   ')).toBeNull();
  });

  it('rejects plain text with no URL', () => {
    expect(parseImageUrlFromPaste('hello')).toBeNull();
  });

  it('rejects a page URL whose query contains an image filename', () => {
    expect(
      parseImageUrlFromPaste('https://example.com/jobs?file=photo.jpg'),
    ).toBeNull();
  });

  it('rejects a page URL whose hash contains an image filename', () => {
    expect(parseImageUrlFromPaste('https://example.com/jobs#photo.jpg')).toBeNull();
  });

  it('rejects an extension that is not the last pathname segment', () => {
    expect(parseImageUrlFromPaste('https://cdn.example/photo.jpg/extra')).toBeNull();
  });

  it('accepts an uppercase image extension', () => {
    expect(parseImageUrlFromPaste('https://cdn.example/photo.JPG')).toBe(
      'https://cdn.example/photo.JPG',
    );
  });

  it('accepts http (not only https) image URLs', () => {
    expect(parseImageUrlFromPaste('http://cdn.example/photo.png')).toBe(
      'http://cdn.example/photo.png',
    );
  });

  it('rejects a filename without an http(s) scheme', () => {
    expect(parseImageUrlFromPaste('photo.jpg')).toBeNull();
  });

  it('extracts an image URL from surrounding text', () => {
    expect(parseImageUrlFromPaste('see https://cdn.example/x.png thanks')).toBe(
      'https://cdn.example/x.png',
    );
  });

  it('returns null when the first extracted URL is not image-like', () => {
    expect(
      parseImageUrlFromPaste('https://jobs.example/x https://cdn.example/a.jpg'),
    ).toBeNull();
  });
});

describe('looksLikeImageUrl', () => {
  it('returns false for non-image URLs', () => {
    expect(looksLikeImageUrl('https://jobs.example/line-cook')).toBe(false);
  });

  it('returns true for gateway image URLs', () => {
    expect(
      looksLikeImageUrl(
        'https://host.example/ipfs-gateway/content/image/bafyTestCid',
      ),
    ).toBe(true);
  });
});
