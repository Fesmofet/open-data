import 'server-only';

import {
  QUERY_API_LIVE_INIT,
  queryApiFetchOutcome,
} from '@/modules/user-profile/infrastructure/clients/query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

import type { EngineWalletApiResponse } from '../../application/dto/engine-wallet-api.schema';
import type { EngineWalletLoadError } from '../../domain/types/engine-wallet-view';

export type EngineWalletFetchResult = {
  data: EngineWalletApiResponse | null;
  error: EngineWalletLoadError | null;
};

export async function fetchEngineWalletSummary(
  accountName: string,
): Promise<EngineWalletFetchResult> {
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/wallet/engine`;
  const outcome = await queryApiFetchOutcome<EngineWalletApiResponse>(path, {
    ...QUERY_API_LIVE_INIT,
    cacheTags: [queryApiCacheTags.userEngineWallet(accountName)],
  });
  if (!outcome.ok) {
    return { data: null, error: 'unavailable' };
  }
  return { data: outcome.data, error: null };
}
