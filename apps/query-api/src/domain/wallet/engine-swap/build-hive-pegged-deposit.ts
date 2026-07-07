import { HIVE_ENGINE_CUSTOM_JSON_ID } from '@opden-data-layer/hive-broadcast';

import { AVAILABLE_TOKEN_WITHDRAW } from './engine-swap.constants';
import type { EngineDepositAddressResponse } from '../schemas/engine-swap.schema';

/** Transfer memo for Hive L1 deposit to the swap account (hivepegged buy). */
export function buildHivePeggedDepositMemo(): string {
  return JSON.stringify({
    id: HIVE_ENGINE_CUSTOM_JSON_ID,
    json: {
      contractName: 'hivepegged',
      contractAction: 'buy',
      contractPayload: {},
    },
  });
}

export function buildHivePeggedDepositRouting(
  swapAccount: string,
  symbol: 'HIVE',
): EngineDepositAddressResponse {
  const swapSymbol = AVAILABLE_TOKEN_WITHDRAW[symbol];
  return {
    symbol,
    account: swapAccount,
    memo: buildHivePeggedDepositMemo(),
    address: null,
    pair: swapSymbol
      ? `${symbol} -> ${swapSymbol} (1.0000 ${swapSymbol} per ${symbol})`
      : null,
    exRate: 1,
  };
}
