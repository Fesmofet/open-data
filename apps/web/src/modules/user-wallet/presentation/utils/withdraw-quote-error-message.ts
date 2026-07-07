import type { EngineWithdrawQuoteApiResponse } from '../../application/dto/engine-swap-api.schema';
import { interpolateMessage } from '@/modules/user-activity/presentation/utils/interpolate-message';

type Translate = (key: string) => string;

export function withdrawQuoteErrorMessage(
  t: Translate,
  quote: Pick<
    EngineWithdrawQuoteApiResponse,
    'error' | 'errorCode' | 'errorParams'
  >,
): string | null {
  if (!quote.error && !quote.errorCode) {
    return null;
  }

  switch (quote.errorCode) {
    case 'eth_gas_fee':
      return interpolateMessage(t('wallet_withdraw_eth_gas_fee'), {
        fee: String(quote.errorParams?.fee ?? '?'),
      });
    case 'minimum_withdraw_amount':
      return interpolateMessage(t('wallet_withdraw_minimum_amount'), {
        amount: String(quote.errorParams?.amount ?? '?'),
        symbol: String(quote.errorParams?.symbol ?? ''),
      });
    case 'minimum_receive_amount':
      return interpolateMessage(t('wallet_withdraw_minimum_receive'), {
        amount: String(quote.errorParams?.amount ?? '?'),
        symbol: String(quote.errorParams?.symbol ?? ''),
      });
    default:
      return quote.error ?? t('wallet_withdraw_quote_failed');
  }
}

export function formatWithdrawMinimumHint(
  t: Translate,
  token: {
    outputSymbol: string;
    minimumSwapAmount: number | null;
    minimumReceiveAmount: number | null;
  },
): string | null {
  if (token.outputSymbol === 'ETH' && token.minimumSwapAmount !== null) {
    return interpolateMessage(t('wallet_withdraw_eth_minimum_swap'), {
      amount: String(token.minimumSwapAmount),
    });
  }
  if (token.minimumReceiveAmount !== null) {
    return `${t('minimal_withdraw_amount')}: ${token.minimumReceiveAmount} ${token.outputSymbol}`;
  }
  if (token.minimumSwapAmount !== null) {
    return interpolateMessage(t('wallet_withdraw_minimum_amount'), {
      amount: String(token.minimumSwapAmount),
      symbol: token.outputSymbol === 'HIVE' ? 'SWAP.HIVE' : token.outputSymbol,
    });
  }
  return null;
}
