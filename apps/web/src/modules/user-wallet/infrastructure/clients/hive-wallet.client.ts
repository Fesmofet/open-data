import 'server-only';

import { queryApiFetchOutcome } from '@/modules/user-profile/infrastructure/clients/query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

import type { HiveWalletApiResponse } from '../../application/dto/hive-wallet-api.schema';
import type { HiveWalletLoadError } from '../../domain/types/hive-wallet-view';

export type HiveWalletFetchResult = {
  data: HiveWalletApiResponse | null;
  error: HiveWalletLoadError | null;
};

export async function fetchHiveWalletSummary(
  accountName: string,
): Promise<HiveWalletFetchResult> {
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/wallet/hive`;
  const outcome = await queryApiFetchOutcome<HiveWalletApiResponse>(path, {
    cacheTags: [queryApiCacheTags.userHiveWallet(accountName)],
  });
  if (!outcome.ok) {
    return { data: null, error: 'unavailable' };
  }
  return { data: outcome.data, error: null };
}
