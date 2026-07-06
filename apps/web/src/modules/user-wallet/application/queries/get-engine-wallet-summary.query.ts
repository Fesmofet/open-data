import 'server-only';

import { engineWalletApiResponseSchema } from '../dto/engine-wallet-api.schema';
import type {
  EngineWalletQueryResult,
  EngineWalletSummaryView,
} from '../../domain/types/engine-wallet-view';
import { fetchEngineWalletSummary } from '../../infrastructure/clients/engine-wallet.client';

export async function getEngineWalletSummaryQuery(
  accountName: string,
): Promise<EngineWalletQueryResult> {
  const { data: raw, error: fetchError } = await fetchEngineWalletSummary(accountName);
  if (fetchError) {
    return { summary: null, error: fetchError };
  }
  if (!raw) {
    return { summary: null, error: 'unavailable' };
  }
  const parsed = engineWalletApiResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return { summary: null, error: 'invalid_response' };
  }
  return {
    summary: parsed.data as EngineWalletSummaryView,
    error: null,
  };
}
