import 'server-only';

import { ACTIVITY_DISPLAY_PAGE_SIZE } from '@opden-data-layer/core/hive-account-history';

import { engineWalletHistoryResponseSchema } from '../dto/engine-wallet-history-api.schema';
import { buildWaivWalletHistoryPageViews } from '../mappers/build-waiv-wallet-history-row-view';
import type {
  EngineWalletHistoryLoadError,
  EngineWalletHistoryPageQueryResult,
  EngineWalletHistoryPageView,
} from '../../domain/types/engine-wallet-view';
import { fetchEngineWalletHistory } from '../../infrastructure/clients/engine-wallet-history.client';

const EMPTY_PAGE: EngineWalletHistoryPageView = {
  items: [],
  cursor: null,
  hasMore: false,
};

function toQueryResult(
  page: EngineWalletHistoryPageView,
  error: EngineWalletHistoryLoadError | null = null,
): EngineWalletHistoryPageQueryResult {
  return { page, error };
}

export async function getEngineWalletHistoryPageQuery(
  accountName: string,
  body: {
    limit?: number;
    cursor?: string;
  } = {},
): Promise<EngineWalletHistoryPageQueryResult> {
  const fetchResult = await fetchEngineWalletHistory(accountName, {
    limit: body.limit ?? ACTIVITY_DISPLAY_PAGE_SIZE,
    cursor: body.cursor,
  });
  if (fetchResult.status === 'not_found') {
    return toQueryResult(EMPTY_PAGE, null);
  }
  if (fetchResult.status === 'unavailable') {
    return toQueryResult(EMPTY_PAGE, 'unavailable');
  }
  const parsed = engineWalletHistoryResponseSchema.safeParse(fetchResult.data);
  if (!parsed.success) {
    return toQueryResult(EMPTY_PAGE, 'invalid_response');
  }
  return toQueryResult({
    items: buildWaivWalletHistoryPageViews(parsed.data.items, accountName),
    cursor: parsed.data.cursor,
    hasMore: parsed.data.hasMore,
  });
}
