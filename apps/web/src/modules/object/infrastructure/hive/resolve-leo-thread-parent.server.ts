import 'server-only';

import { THREADS_ACC } from '@opden-data-layer/core';

import { hiveRpcRequest } from '@/shared/infrastructure/hive/hive-rpc.server';

type DiscussionBlogPost = {
  author?: string;
  permlink?: string;
};

export type LeoThreadParent = {
  parentAuthor: typeof THREADS_ACC;
  parentPermlink: string;
};

export async function resolveLeoThreadParent(): Promise<LeoThreadParent | null> {
  const posts = await hiveRpcRequest<DiscussionBlogPost[]>(
    'condenser_api.get_discussions_by_blog',
    [{ tag: THREADS_ACC, limit: 1 }],
  );

  const head = posts?.[0];
  const parentPermlink = head?.permlink?.trim();
  if (!parentPermlink) {
    return null;
  }

  return {
    parentAuthor: THREADS_ACC,
    parentPermlink,
  };
}
