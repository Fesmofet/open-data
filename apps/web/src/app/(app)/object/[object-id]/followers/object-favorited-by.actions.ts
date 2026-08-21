'use server';

import { getObjectFavoritedByPageQuery } from '@/modules/object/application/queries/get-object-favorited-by-page.query';
import type {
  PaginatedUserFollowListView,
  UserSubscriptionSort,
} from '@/modules/user-social/application/dto/user-social.dto';
import { USER_SOCIAL_PAGE_SIZE } from '@/modules/user-social/constants';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export async function loadMoreObjectFavoritedByAction(
  objectId: string,
  sort: UserSubscriptionSort,
  skip: number,
): Promise<PaginatedUserFollowListView> {
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  return getObjectFavoritedByPageQuery(
    objectId,
    { sort, skip, limit: USER_SOCIAL_PAGE_SIZE },
    user?.username ?? null,
  );
}
