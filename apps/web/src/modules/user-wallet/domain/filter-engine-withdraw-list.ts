import {
  isEngineDisabledPeggedSwapSymbol,
  isEngineDisabledWithdrawL1Symbol,
} from '@opden-data-layer/core/hive-engine-history';

import type { EngineWithdrawListApiResponse } from '../application/dto/engine-swap-api.schema';

export function isDisabledEngineWithdrawPair(
  inputSymbol: string,
  outputSymbol: string,
): boolean {
  return (
    isEngineDisabledPeggedSwapSymbol(inputSymbol) ||
    isEngineDisabledWithdrawL1Symbol(outputSymbol)
  );
}

export function filterEngineWithdrawList(
  response: EngineWithdrawListApiResponse,
): EngineWithdrawListApiResponse {
  return {
    ...response,
    tokens: response.tokens.filter(
      (token) =>
        !isDisabledEngineWithdrawPair(token.inputSymbol, token.outputSymbol),
    ),
  };
}
