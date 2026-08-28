import type {
  ChangellyPayinExchange,
  ChangellyTransactionResult,
} from './type';

export function mapChangellyTransactionResult(
  result: ChangellyTransactionResult,
): ChangellyPayinExchange {
  return {
    memo: result.payinExtraId,
    receiver: result.payinAddress,
    exchangeId: result.id,
    outputAmount: result.amountExpectedTo,
    trackUrl: result.trackUrl,
  };
}
