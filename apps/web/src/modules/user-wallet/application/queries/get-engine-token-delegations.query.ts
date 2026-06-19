import 'server-only';

import { engineTokenDelegationsApiResponseSchema } from '../../application/dto/waiv-wallet-api.schema';
import type { EngineTokenDelegationsView } from '../../domain/types/waiv-wallet-view';
import { fetchEngineTokenDelegations } from '../../infrastructure/clients/engine-token-delegations.client';

export async function getEngineTokenDelegationsQuery(
  accountName: string,
  symbol: string,
): Promise<EngineTokenDelegationsView | null> {
  const raw = await fetchEngineTokenDelegations(accountName, symbol);
  if (!raw) {
    return null;
  }
  const parsed = engineTokenDelegationsApiResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}
