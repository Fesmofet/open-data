'use server';

import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { getExpertiseObjectsPageQuery } from '@/modules/user-profile/application/queries/get-expertise.query';
import type { ExpertiseObjectsPage, ExpertiseScope } from '@/modules/user-profile/domain/types/expertise';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export async function loadMoreExpertiseObjectsAction(
  accountName: string,
  scope: ExpertiseScope,
  skip: number,
): Promise<ExpertiseObjectsPage> {
  const auth = createCookieAuthContextProvider();
  const [user, locale] = await Promise.all([auth.getUser(), getRequestLocale()]);
  return getExpertiseObjectsPageQuery(
    accountName,
    scope,
    locale,
    user?.username ?? null,
    skip,
  );
}
