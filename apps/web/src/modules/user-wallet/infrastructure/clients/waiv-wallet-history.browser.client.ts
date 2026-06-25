import { ACTIVITY_DISPLAY_PAGE_SIZE } from '@opden-data-layer/core/hive-account-history';

import type { WaivWalletHistoryPageQueryResult } from '../../domain/types/waiv-wallet-history-view';
import { waivWalletHistoryPageQueryResultSchema } from '../../application/dto/waiv-wallet-history-api.schema';

const EMPTY_RESULT: WaivWalletHistoryPageQueryResult = {
  page: { items: [], cursor: null, hasMore: false },
  error: null,
};

export async function fetchWaivWalletHistoryPageClient(
  accountName: string,
  body: {
    limit?: number;
    cursor?: string;
    showRewards?: boolean;
  },
  signal?: AbortSignal,
): Promise<WaivWalletHistoryPageQueryResult | null> {
  try {
    const res = await fetch(
      `/api/users/${encodeURIComponent(accountName)}/wallet/waiv/history`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: body.limit ?? ACTIVITY_DISPLAY_PAGE_SIZE,
          cursor: body.cursor,
          showRewards: body.showRewards ?? false,
        }),
        cache: 'no-store',
        signal,
      },
    );
    if (!res.ok) {
      if (res.status === 404) {
        return EMPTY_RESULT;
      }
      if (res.status === 503) {
        return {
          page: EMPTY_RESULT.page,
          error: 'unavailable',
        };
      }
      return null;
    }
    const json: unknown = await res.json();
    const parsed = waivWalletHistoryPageQueryResultSchema.safeParse(json);
    if (!parsed.success) {
      return {
        page: EMPTY_RESULT.page,
        error: 'invalid_response',
      };
    }
    return parsed.data as WaivWalletHistoryPageQueryResult;
  } catch {
    return null;
  }
}
