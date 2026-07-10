'use server';

import {
  fetchCategoryObjects,
  REF_LIST_PAGE_SIZE,
  type CategoryObjectsPageView,
} from '@/modules/object/infrastructure/category-objects.client';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';
import { getRequestLocale } from '@/i18n/runtime/get-request-locale';

export async function loadMoreCategoryObjectsAction(
  objectId: string,
  categoryName: string,
  cursor: string | null,
): Promise<CategoryObjectsPageView> {
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  const locale = await getRequestLocale();
  const page = await fetchCategoryObjects(
    {
      name: categoryName,
      limit: REF_LIST_PAGE_SIZE,
      cursor,
      excludeObjectId: objectId,
    },
    { locale, viewer: user?.username ?? null },
  );
  return page ?? { items: [], hasMore: false, cursor: null };
}
