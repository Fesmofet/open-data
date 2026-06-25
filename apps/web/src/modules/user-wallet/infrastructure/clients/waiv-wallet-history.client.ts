import 'server-only';

import { ACTIVITY_DISPLAY_PAGE_SIZE } from '@opden-data-layer/core/hive-account-history';

import { queryApiFetchOutcome } from '@/modules/user-profile/infrastructure/clients/query-api.client';

import type { WaivWalletHistoryResponseApi } from '../../application/dto/waiv-wallet-history-api.schema';

export type FetchWaivWalletHistoryResult =
  | { status: 'ok'; data: WaivWalletHistoryResponseApi }
  | { status: 'not_found' }
  | { status: 'unavailable' };

export async function fetchWaivWalletHistory(
  accountName: string,
  body: {
    limit?: number;
    cursor?: string;
    showRewards?: boolean;
  },
): Promise<FetchWaivWalletHistoryResult> {
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/wallet/waiv/history`;
  const outcome = await queryApiFetchOutcome<WaivWalletHistoryResponseApi>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      limit: body.limit ?? ACTIVITY_DISPLAY_PAGE_SIZE,
      cursor: body.cursor,
      showRewards: body.showRewards ?? false,
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
