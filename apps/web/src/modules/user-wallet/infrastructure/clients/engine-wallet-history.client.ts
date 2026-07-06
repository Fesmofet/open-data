import 'server-only';

import { ACTIVITY_DISPLAY_PAGE_SIZE } from '@opden-data-layer/core/hive-account-history';

import { queryApiFetchOutcome } from '@/modules/user-profile/infrastructure/clients/query-api.client';

import type { EngineWalletHistoryResponseApi } from '../../application/dto/engine-wallet-history-api.schema';

export type FetchEngineWalletHistoryResult =
  | { status: 'ok'; data: EngineWalletHistoryResponseApi }
  | { status: 'not_found' }
  | { status: 'unavailable' };

export async function fetchEngineWalletHistory(
  accountName: string,
  body: {
    limit?: number;
    cursor?: string;
  },
): Promise<FetchEngineWalletHistoryResult> {
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/wallet/engine/history`;
  const outcome = await queryApiFetchOutcome<EngineWalletHistoryResponseApi>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      limit: body.limit ?? ACTIVITY_DISPLAY_PAGE_SIZE,
      cursor: body.cursor,
    }),
    cache: 'no-store',
  });

  if (outcome.ok) {
    return { status: 'ok', data: outcome.data };
  }
  if (outcome.status === 404) {
    return { status: 'not_found' };
  }
  return { status: 'unavailable' };
}
