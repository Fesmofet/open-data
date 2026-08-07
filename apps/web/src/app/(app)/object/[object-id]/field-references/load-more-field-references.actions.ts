'use server';

import {
  fetchObjectFieldReferencesByType,
  type ObjectFieldReferencesPageView,
} from '@/modules/object/infrastructure/object-field-references.client';
import { REF_LIST_PAGE_SIZE } from '@/modules/object/infrastructure/object-ref-list.client';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';
import { getRequestLocale } from '@/i18n/runtime/get-request-locale';

export async function loadMoreObjectFieldReferencesAction(
  objectId: string,
  referenceObjectType: string,
  cursor: string | null,
): Promise<ObjectFieldReferencesPageView> {
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  const locale = await getRequestLocale();
  const page = await fetchObjectFieldReferencesByType(
    objectId,
    referenceObjectType,
    { limit: REF_LIST_PAGE_SIZE, cursor },
    { locale, viewer: user?.username ?? null },
  );
  return page ?? { items: [], hasMore: false, cursor: null };
}
