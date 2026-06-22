import 'server-only';

import { hiveRcDelegationsApiResponseSchema } from '../dto/hive-wallet-api.schema';
import type { HiveRcDelegationsView } from '../../domain/types/hive-wallet-view';
import { queryApiFetchOutcome } from '@/modules/user-profile/infrastructure/clients/query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

export async function getHiveRcDelegationsQuery(
  accountName: string,
): Promise<HiveRcDelegationsView | null> {
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/wallet/hive/rc-delegations`;
  const outcome = await queryApiFetchOutcome(path, {
    cacheTags: [queryApiCacheTags.userHiveRcDelegations(accountName)],
  });
  if (!outcome.ok) {
    return null;
  }
  const parsed = hiveRcDelegationsApiResponseSchema.safeParse(outcome.data);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}
