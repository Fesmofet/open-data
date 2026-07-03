import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';
import { getRequestLocale } from '@/i18n/runtime/get-request-locale';

import {
  getExpertiseCountersQuery,
  getExpertiseObjectsPageQuery,
} from '../../application/queries/get-expertise.query';
import type { ExpertiseScope } from '../../domain/types/expertise';
import { ExpertiseObjectList } from './expertise-object-list';

export type ProfileExpertiseMainContentProps = {
  accountName: string;
  scope: ExpertiseScope;
};

export async function ProfileExpertiseMainContent({
  accountName,
  scope,
}: ProfileExpertiseMainContentProps) {
  const auth = createCookieAuthContextProvider();
  const [user, locale] = await Promise.all([auth.getUser(), getRequestLocale()]);
  const viewerUsername = user?.username ?? null;

  const initialPage = await getExpertiseObjectsPageQuery(
    accountName,
    scope,
    locale,
    viewerUsername,
  );

  return (
    <ExpertiseObjectList
      key={scope}
      accountName={accountName}
      scope={scope}
      initialPage={initialPage}
      viewerUsername={viewerUsername}
    />
  );
}

export async function fetchExpertiseCountsForProfile(accountName: string): Promise<{
  hashtagsExpCount: number;
  objectsExpCount: number;
}> {
  const counters = await getExpertiseCountersQuery(accountName);
  return {
    hashtagsExpCount: counters.hashtagsCount,
    objectsExpCount: counters.objectsCount,
  };
}
