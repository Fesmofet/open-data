import {
  extractHashtagObjectIdsFromBody,
  extractObjectIdsFromCommentBody,
  extractObjectPathSlugsFromBody,
} from './comment-post-object-candidates';

describe('comment-post-object-candidates', () => {
  it('extracts hashtag tokens without #', () => {
    expect(extractHashtagObjectIdsFromBody('Hello #foo and #bar-baz')).toEqual([
      'foo',
      'bar-baz',
    ]);
  });

  it('extracts /object/slug from plain text and URLs', () => {
    const body = 'x /object/slug1 y https://www.waivio.com/@a/object/slug2';
    expect(extractObjectPathSlugsFromBody(body).sort()).toEqual([
      'slug1',
      'slug2',
    ]);
  });

  it('ignores URL hash fragments when extracting hashtags', () => {
    const body =
      'https://www.waivio.com/object/ylr-waivio/page#mim-transform-your-passion-into-profit-with-waivio';
    expect(extractHashtagObjectIdsFromBody(body)).toEqual([]);
    expect(extractObjectPathSlugsFromBody(body)).toEqual(['ylr-waivio']);
    expect(extractObjectIdsFromCommentBody(body)).toEqual(['ylr-waivio']);
  });

  it('still extracts real hashtags after whitespace', () => {
    const body =
      'Hello #waivio https://www.waivio.com/object/ylr-waivio/page#nested-page';
    expect(extractHashtagObjectIdsFromBody(body)).toEqual(['waivio']);
    expect(extractObjectPathSlugsFromBody(body)).toEqual(['ylr-waivio']);
  });

  it('dedupes extractObjectIdsFromCommentBody', () => {
    const body = '#dup /object/dup';
    expect(extractObjectIdsFromCommentBody(body)).toEqual(['dup']);
  });

  it('returns empty for empty body', () => {
    expect(extractObjectIdsFromCommentBody('')).toEqual([]);
  });
});
