'use server';

import { queryApiDraftsFetch } from './query-api-drafts.server';

/** Returns true when a post already exists at author/permlink. */
export async function checkPostExistsAction(
  author: string,
  permlink: string,
): Promise<boolean> {
  const path = `/query/v1/posts/${encodeURIComponent(author.trim())}/${encodeURIComponent(permlink.trim())}`;
  const result = await queryApiDraftsFetch<unknown>(path, { method: 'GET' });
  return result.ok;
}
