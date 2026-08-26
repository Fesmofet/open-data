'use server';

import { resolveLeoThreadParent } from '../hive/resolve-leo-thread-parent.server';

export type ResolveLeoThreadParentResult =
  | { ok: true; parentAuthor: string; parentPermlink: string }
  | { ok: false; error: 'thread_parent_unavailable' };

export async function resolveLeoThreadParentAction(): Promise<ResolveLeoThreadParentResult> {
  const parent = await resolveLeoThreadParent();
  if (!parent) {
    return { ok: false, error: 'thread_parent_unavailable' };
  }

  return {
    ok: true,
    parentAuthor: parent.parentAuthor,
    parentPermlink: parent.parentPermlink,
  };
}
