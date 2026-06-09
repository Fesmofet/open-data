import type { HiveContentType } from '@opden-data-layer/clients';

import {
  buildPostDiscussionTree,
  postDiscussionKey,
  rebloggedUsersFromHiveContent,
} from './build-post-discussion-tree';

function comment(
  author: string,
  permlink: string,
  depth: number,
  replies: string[] = [],
): HiveContentType {
  return {
    author,
    permlink,
    depth: String(depth),
    replies,
  } as HiveContentType;
}

describe('buildPostDiscussionTree', () => {
  it('extracts depth-1 root comments and nested children', () => {
    const rootKey = postDiscussionKey('alice', 'post');
    const content: Record<string, HiveContentType> = {
      [rootKey]: comment('alice', 'post', 0, ['bob/reply-1']),
      'bob/reply-1': comment('bob', 'reply-1', 1, ['carol/nested']),
      'carol/nested': comment('carol', 'nested', 2),
    };

    const tree = buildPostDiscussionTree(content, 'alice', 'post');
    expect(tree.rootCommentIds).toEqual(['bob/reply-1']);
    expect(tree.childrenById['bob/reply-1']).toEqual(['carol/nested']);
    expect(tree.commentKeys).toContain('bob/reply-1');
    expect(tree.commentKeys).toContain('carol/nested');
  });

  it('falls back to root replies when depth filter yields none', () => {
    const rootKey = postDiscussionKey('alice', 'post');
    const content: Record<string, HiveContentType> = {
      [rootKey]: comment('alice', 'post', 0, ['bob/reply-1']),
      'bob/reply-1': { author: 'bob', permlink: 'reply-1' } as HiveContentType,
    };

    const tree = buildPostDiscussionTree(content, 'alice', 'post');
    expect(tree.rootCommentIds).toEqual(['bob/reply-1']);
  });
});

describe('rebloggedUsersFromHiveContent', () => {
  it('normalizes reblogged_users array', () => {
    expect(
      rebloggedUsersFromHiveContent({
        reblogged_users: ['bob', ''],
      } as HiveContentType),
    ).toEqual(['bob']);
  });
});
