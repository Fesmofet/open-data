import 'server-only';

import { hiveHpDelegationsApiResponseSchema } from '../dto/hive-wallet-api.schema';
import type { HiveHpDelegationsView } from '../../domain/types/hive-wallet-view';
import { queryApiFetchOutcome } from '@/modules/user-profile/infrastructure/clients/query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

export async function getHiveHpDelegationsQuery(
  accountName: string,
): Promise<HiveHpDelegationsView | null> {
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/wallet/hive/delegations`;
  const outcome = await queryApiFetchOutcome(path, {
    cacheTags: [queryApiCacheTags.userHiveHpDelegations(accountName)],
  });
  if (!outcome.ok) {
    return null;
  }
  const parsed = hiveHpDelegationsApiResponseSchema.safeParse(outcome.data);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}
