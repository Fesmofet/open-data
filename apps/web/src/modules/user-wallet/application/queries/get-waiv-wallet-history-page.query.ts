import 'server-only';

import { ACTIVITY_DISPLAY_PAGE_SIZE } from '@opden-data-layer/core/hive-account-history';

import { waivWalletHistoryResponseSchema } from '../dto/waiv-wallet-history-api.schema';
import { buildWaivWalletHistoryPageViews } from '../mappers/build-waiv-wallet-history-row-view';
import type {
  WaivWalletHistoryLoadError,
  WaivWalletHistoryPageQueryResult,
  WaivWalletHistoryPageView,
} from '../../domain/types/waiv-wallet-history-view';
import { fetchWaivWalletHistory } from '../../infrastructure/clients/waiv-wallet-history.client';

const EMPTY_PAGE: WaivWalletHistoryPageView = {
  items: [],
  cursor: null,
  hasMore: false,
};

function toQueryResult(
  page: WaivWalletHistoryPageView,
  error: WaivWalletHistoryLoadError | null = null,
): WaivWalletHistoryPageQueryResult {
  return { page, error };
}

export async function getWaivWalletHistoryPageQuery(
  accountName: string,
  body: {
    limit?: number;
    cursor?: string;
    showRewards?: boolean;
  } = {},
): Promise<WaivWalletHistoryPageQueryResult> {
  const fetchResult = await fetchWaivWalletHistory(accountName, {
    limit: body.limit ?? ACTIVITY_DISPLAY_PAGE_SIZE,
    cursor: body.cursor,
    showRewards: body.showRewards ?? false,
  });
  if (fetchResult.status === 'not_found') {
    return toQueryResult(EMPTY_PAGE, null);
  }
  if (fetchResult.status === 'unavailable') {
    return toQueryResult(EMPTY_PAGE, 'unavailable');
  }
  const parsed = waivWalletHistoryResponseSchema.safeParse(fetchResult.data);
  if (!parsed.success) {
    return toQueryResult(EMPTY_PAGE, 'invalid_response');
  }
  return toQueryResult({
    items: buildWaivWalletHistoryPageViews(parsed.data.items, accountName),
    cursor: parsed.data.cursor,
    hasMore: parsed.data.hasMore,
  });
}
