import 'server-only';

import { queryApiFetch } from '@/modules/user-profile/infrastructure/clients/query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

import type { EngineTokenDelegationsApiResponse } from '../../application/dto/waiv-wallet-api.schema';

export async function fetchEngineTokenDelegations(
  accountName: string,
  symbol: string,
): Promise<EngineTokenDelegationsApiResponse | null> {
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/wallet/engine/${encodeURIComponent(symbol)}/delegations`;
  return queryApiFetch<EngineTokenDelegationsApiResponse>(path, {
    cacheTags: [queryApiCacheTags.userEngineTokenDelegations(accountName, symbol)],
  });
}
