import {
  buildRelatedImageRows,
  extractPostImageUrls,
  isObjectTypeEligibleForRelatedAlbum,
} from './post-related-images';

describe('extractPostImageUrls', () => {
  it('returns unique https urls from json_metadata.image', () => {
    const meta = JSON.stringify({
      image: [
        'https://a.example/1.jpg',
        'http://insecure.example/2.jpg',
        'https://a.example/1.jpg',
        'not-a-url',
      ],
    });
    expect(extractPostImageUrls(meta)).toEqual(['https://a.example/1.jpg']);
  });

  it('handles singular image string', () => {
    const meta = JSON.stringify({ image: 'https://b.example/x.png' });
    expect(extractPostImageUrls(meta)).toEqual(['https://b.example/x.png']);
  });
});

describe('isObjectTypeEligibleForRelatedAlbum', () => {
  it('accepts legacy eligible types', () => {
    expect(isObjectTypeEligibleForRelatedAlbum('restaurant')).toBe(true);
    expect(isObjectTypeEligibleForRelatedAlbum('hashtag')).toBe(false);
  });
});

describe('buildRelatedImageRows', () => {
  it('builds cartesian product for eligible objects only', () => {
    const rows = buildRelatedImageRows(
      [
        { object_id: 'a/obj1', object_type: 'restaurant' },
        { object_id: 'a/obj2', object_type: 'hashtag' },
      ],
      'alice',
      'post-1',
      ['https://img/1.jpg', 'https://img/2.jpg'],
    );
    expect(rows).toEqual([
      {
        object_id: 'a/obj1',
        author: 'alice',
        permlink: 'post-1',
        image_url: 'https://img/1.jpg',
        sort_ord: 0,
      },
      {
        object_id: 'a/obj1',
        author: 'alice',
        permlink: 'post-1',
        image_url: 'https://img/2.jpg',
        sort_ord: 1,
      },
    ]);
  });
});
