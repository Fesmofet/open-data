import 'server-only';

import {
  QUERY_API_LIVE_INIT,
  queryApiFetchOutcome,
} from '@/modules/user-profile/infrastructure/clients/query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

import type { WaivWalletApiResponse } from '../../application/dto/waiv-wallet-api.schema';
import type { WaivWalletLoadError } from '../../domain/types/waiv-wallet-view';

export type WaivWalletFetchResult = {
  data: WaivWalletApiResponse | null;
  error: WaivWalletLoadError | null;
};

export async function fetchWaivWalletSummary(
  accountName: string,
): Promise<WaivWalletFetchResult> {
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/wallet/waiv`;
  const outcome = await queryApiFetchOutcome<WaivWalletApiResponse>(path, {
    ...QUERY_API_LIVE_INIT,
    cacheTags: [queryApiCacheTags.userWaivWallet(accountName)],
  });
  if (!outcome.ok) {
    if (outcome.status === 404) {
      return { data: null, error: 'unavailable' };
    }
    return { data: null, error: 'unavailable' };
  }
  return { data: outcome.data, error: null };
}
