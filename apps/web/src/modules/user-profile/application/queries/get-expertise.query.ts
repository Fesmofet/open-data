import 'server-only';

import {
  EXPERTISE_PAGE_SIZE,
  type ExpertiseCountersResponse,
  type ExpertiseObjectsPage,
  type ExpertiseScope,
} from '../../domain/types/expertise';
import {
  fetchExpertiseCounters,
  fetchExpertiseObjects,
} from '../../infrastructure/clients/expertise.client';

export async function getExpertiseCountersQuery(
  accountName: string,
): Promise<ExpertiseCountersResponse> {
  const raw = await fetchExpertiseCounters(accountName);
  return raw ?? { hashtagsCount: 0, objectsCount: 0 };
}

export async function getExpertiseObjectsPageQuery(
  accountName: string,
  scope: ExpertiseScope,
  locale: string,
  viewer?: string | null,
  skip = 0,
): Promise<ExpertiseObjectsPage> {
  const page = await fetchExpertiseObjects(
    accountName,
    { scope, skip, limit: EXPERTISE_PAGE_SIZE },
    { locale, viewer },
  );
  return page ?? { items: [], total: 0, hasMore: false };
}
