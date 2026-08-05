import BigNumber from 'bignumber.js';

import { DEFAULT_WITHDRAW_FEE_MUL } from './engine-swap.constants';

export type WithdrawValidationErrorCode =
  | 'minimum_withdraw_amount'
  | 'minimum_receive_amount'
  | 'eth_gas_fee';

export type WithdrawAmountValidation = {
  error: string | null;
  errorCode?: WithdrawValidationErrorCode;
  errorParams?: Record<string, string | number>;
  predictiveAmount: number | null;
};

function finalizePredictiveAmount(
  value: BigNumber,
  precision = 8,
): number | null {
  const amount = value
    .dp(precision, BigNumber.ROUND_HALF_DOWN)
    .toNumber();
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function validateBtcWithdrawAmount(
  amount: string,
  minimumFee: number | null,
): WithdrawAmountValidation | null {
  if (minimumFee === null) {
    return null;
  }

  let error: string | null = null;
  let errorCode: WithdrawValidationErrorCode | undefined;
  let errorParams: Record<string, string | number> | undefined;
  const predictive = new BigNumber(amount).times(DEFAULT_WITHDRAW_FEE_MUL);
  if (!new BigNumber(amount).minus(minimumFee).gte(0)) {
    error = `minimum withdraw amount ${minimumFee}`;
    errorCode = 'minimum_withdraw_amount';
    errorParams = { amount: minimumFee, symbol: 'SWAP.BTC' };
  } else if (!predictive.gt(0.01)) {
    error = 'minimum receive amount 0.01';
    errorCode = 'minimum_receive_amount';
    errorParams = { amount: 0.01, symbol: 'BTC' };
  }

  return {
    error,
    errorCode,
    errorParams,
    predictiveAmount: error ? null : finalizePredictiveAmount(predictive),
  };
}

export function validateHbdWithdrawAmount(amount: string): WithdrawAmountValidation {
  const predictive = new BigNumber(amount).times(DEFAULT_WITHDRAW_FEE_MUL);
  return {
    error: null,
    predictiveAmount: finalizePredictiveAmount(predictive, 3),
  };
}

export function validateLtcLikeWithdrawAmount(amount: string): WithdrawAmountValidation {
  const predictive = new BigNumber(amount).times(DEFAULT_WITHDRAW_FEE_MUL);
  return {
    error: null,
    predictiveAmount: finalizePredictiveAmount(predictive),
  };
}

export function validateHiveWithdrawAmount(amount: string): WithdrawAmountValidation {
  let error: string | null = null;
  let errorCode: WithdrawValidationErrorCode | undefined;
  let errorParams: Record<string, string | number> | undefined;
  const predictive = new BigNumber(amount).times(DEFAULT_WITHDRAW_FEE_MUL);
  if (!new BigNumber(amount).gte(0.002)) {
    error = 'minimum withdraw amount 0.002';
    errorCode = 'minimum_withdraw_amount';
    errorParams = { amount: 0.002, symbol: 'HIVE' };
  }

  return {
    error,
    errorCode,
    errorParams,
    predictiveAmount: error
      ? null
      : predictive.gt(0)
        ? predictive.dp(3, BigNumber.ROUND_DOWN).toNumber()
        : null,
  };
}

export async function validateWithdrawOutputAmount(input: {
  amount: string;
  outputSymbol: string;
  fetchBtcMinimum: () => Promise<number | null>;
}): Promise<WithdrawAmountValidation | null> {
  const { amount, outputSymbol } = input;

  switch (outputSymbol) {
    case 'HIVE':
      return validateHiveWithdrawAmount(amount);
    case 'BTC':
    case 'SWAP.BTC':
      return validateBtcWithdrawAmount(amount, await input.fetchBtcMinimum());
    case 'LTC':
    case 'SWAP.LTC':
      return validateLtcLikeWithdrawAmount(amount);
    case 'HBD':
    case 'SWAP.HBD':
      return validateHbdWithdrawAmount(amount);
    default:
      return null;
  }
}
