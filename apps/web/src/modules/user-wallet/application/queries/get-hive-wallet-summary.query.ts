import 'server-only';

import { hiveWalletApiResponseSchema } from '../dto/hive-wallet-api.schema';
import type {
  HiveWalletQueryResult,
  HiveWalletSummaryView,
} from '../../domain/types/hive-wallet-view';
import { fetchHiveWalletSummary } from '../../infrastructure/clients/hive-wallet.client';

export async function getHiveWalletSummaryQuery(
  accountName: string,
): Promise<HiveWalletQueryResult> {
  const { data: raw, error: fetchError } = await fetchHiveWalletSummary(accountName);
  if (fetchError) {
    return { summary: null, error: fetchError };
  }
  if (!raw) {
    return { summary: null, error: 'unavailable' };
  }
  const parsed = hiveWalletApiResponseSchema.safeParse(raw);
  if (!parsed.success) {
    if (process.env.NODE_ENV === 'development') {
      console.error(
        '[hive-wallet] invalid_response',
        JSON.stringify(parsed.error.flatten()),
      );
    }
    return { summary: null, error: 'invalid_response' };
  }
  return {
    summary: parsed.data as HiveWalletSummaryView,
    error: null,
  };
}
