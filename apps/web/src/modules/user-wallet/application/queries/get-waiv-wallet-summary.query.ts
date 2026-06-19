import 'server-only';

import { waivWalletApiResponseSchema } from '../dto/waiv-wallet-api.schema';
import type {
  WaivWalletQueryResult,
  WaivWalletSummaryView,
} from '../../domain/types/waiv-wallet-view';
import { fetchWaivWalletSummary } from '../../infrastructure/clients/waiv-wallet.client';

export async function getWaivWalletSummaryQuery(
  accountName: string,
): Promise<WaivWalletQueryResult> {
  const { data: raw, error: fetchError } = await fetchWaivWalletSummary(accountName);
  if (fetchError) {
    return { summary: null, error: fetchError };
  }
  if (!raw) {
    return { summary: null, error: 'unavailable' };
  }
  const parsed = waivWalletApiResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return { summary: null, error: 'invalid_response' };
  }
  return {
    summary: parsed.data as WaivWalletSummaryView,
    error: null,
  };
}
