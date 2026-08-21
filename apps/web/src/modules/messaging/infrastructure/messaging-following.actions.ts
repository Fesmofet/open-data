'use server';

import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

import { getUserFollowingPageQuery } from '@/modules/user-social/application/queries/get-user-following-page.query';

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

export async function fetchViewerFollowingSetAction(
  viewerUsername: string,
): Promise<string[]> {
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  const viewer = user?.username?.trim() ?? '';
  if (!viewer || viewer.toLowerCase() !== viewerUsername.trim().toLowerCase()) {
    return [];
  }

  const names = new Set<string>();
  let skip = 0;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const pageResult = await getUserFollowingPageQuery(
      viewer,
      { sort: 'recency', skip, limit: PAGE_SIZE },
      viewer,
    );
    for (const item of pageResult.items) {
      const name = item.name.trim().toLowerCase();
      if (name) {
        names.add(name);
      }
    }
    if (!pageResult.hasMore) {
      break;
    }
    skip += PAGE_SIZE;
  }
  return [...names];
}
