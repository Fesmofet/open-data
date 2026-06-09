import type { HiveContentType } from '@opden-data-layer/clients';

export type PostDiscussionTree = {
  rootKey: string;
  rootCommentIds: string[];
  childrenById: Record<string, string[]>;
  commentKeys: string[];
};

export function postDiscussionKey(author: string, permlink: string): string {
  return `${author.trim()}/${permlink.trim()}`;
}

function parseDepth(content: HiveContentType): number {
  const raw = content.depth;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function childKeysFromReplies(content: HiveContentType): string[] {
  const replies = content.replies;
  if (!Array.isArray(replies)) {
    return [];
  }
  return replies
    .map((r) => (typeof r === 'string' ? r.trim().replace(/^@/, '') : ''))
    .filter((r) => r !== '');
}

/**
 * Builds discussion tree from `bridge.get_discussion` content map (legacy Waivio `getPostState`).
 */
export function buildPostDiscussionTree(
  content: Record<string, HiveContentType>,
  rootAuthor: string,
  rootPermlink: string,
): PostDiscussionTree {
  const rootKey = postDiscussionKey(rootAuthor, rootPermlink);
  const childrenById: Record<string, string[]> = {};
  const commentKeys: string[] = [];

  for (const [key, node] of Object.entries(content)) {
    if (!node?.author?.trim() || !node?.permlink?.trim()) {
      continue;
    }
    const id = postDiscussionKey(node.author, node.permlink);
    if (id === rootKey) {
      const rootChildren = childKeysFromReplies(node);
      if (rootChildren.length > 0) {
        childrenById[rootKey] = rootChildren;
      }
      continue;
    }
    commentKeys.push(id);
    const childIds = childKeysFromReplies(node);
    if (childIds.length > 0) {
      childrenById[id] = childIds;
    }
  }

  const rootCommentIds = commentKeys.filter((id) => {
    const node = content[id] ?? Object.values(content).find(
      (c) => postDiscussionKey(c.author, c.permlink) === id,
    );
    if (!node) {
      return false;
    }
    return parseDepth(node) === 1;
  });

  if (rootCommentIds.length === 0 && childrenById[rootKey]) {
    return {
      rootKey,
      rootCommentIds: childrenById[rootKey],
      childrenById,
      commentKeys,
    };
  }

  return {
    rootKey,
    rootCommentIds,
    childrenById,
    commentKeys,
  };
}

export function rebloggedUsersFromHiveContent(content: HiveContentType | undefined): string[] {
  const users = content?.reblogged_users;
  if (!Array.isArray(users)) {
    return [];
  }
  return users
    .map((u) => (typeof u === 'string' ? u.trim() : ''))
    .filter((u) => u !== '');
}
