import { ACTIVITY_DISPLAY_PAGE_SIZE } from '@opden-data-layer/core/hive-account-history';

import type { EngineWalletHistoryPageQueryResult } from '../../domain/types/engine-wallet-view';
import { engineWalletHistoryPageQueryResultSchema } from '../../application/dto/engine-wallet-history-api.schema';

const EMPTY_RESULT: EngineWalletHistoryPageQueryResult = {
  page: { items: [], cursor: null, hasMore: false },
  error: null,
};

export async function fetchEngineWalletHistoryPageClient(
  accountName: string,
  body: {
    limit?: number;
    cursor?: string;
  },
  signal?: AbortSignal,
): Promise<EngineWalletHistoryPageQueryResult | null> {
  try {
    const res = await fetch(
      `/api/users/${encodeURIComponent(accountName)}/wallet/engine/history`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: body.limit ?? ACTIVITY_DISPLAY_PAGE_SIZE,
          cursor: body.cursor,
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
    const parsed = engineWalletHistoryPageQueryResultSchema.safeParse(json);
    if (!parsed.success) {
      return {
        page: EMPTY_RESULT.page,
        error: 'invalid_response',
      };
    }
    return parsed.data as EngineWalletHistoryPageQueryResult;
  } catch {
    return null;
  }
}
