'use server';

import { getObjectExpertsPageQuery } from '@/modules/object/application/queries/get-object-experts-page.query';
import type { PaginatedObjectExpertListView } from '@/modules/object/domain/types/object-experts';
import { USER_SOCIAL_PAGE_SIZE } from '@/modules/user-social/constants';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export async function loadMoreObjectExpertsAction(
  objectId: string,
  skip: number,
): Promise<PaginatedObjectExpertListView> {
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  return getObjectExpertsPageQuery(
    objectId,
    { skip, limit: USER_SOCIAL_PAGE_SIZE },
    user?.username ?? null,
  );
}
