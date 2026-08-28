import {
  buildTransferOp,
  formatHiveAssetAmount,
  type TransferOp,
} from '@opden-data-layer/hive-broadcast';

export type HiveChangellyWithdrawCreateResult = {
  receiver: string;
  memo: string;
  exchangeId: string;
  amount: number;
  outputCoinType: string;
};

export function buildChangellyTrackingMemo(input: {
  exchangeId: string;
  outputCoinType: string;
}): string {
  const coin = input.outputCoinType.trim().toUpperCase();
  return `Withdrawal transaction ID for the HIVE-${coin} pair via Changelly: https://changelly.com/track/${input.exchangeId}`;
}

export function buildHiveChangellyWithdrawTransferOps(input: {
  account: string;
  createResult: HiveChangellyWithdrawCreateResult;
}): [TransferOp, TransferOp] {
  const { account, createResult } = input;
  const payin = buildTransferOp({
    from: account,
    to: createResult.receiver,
    amount: formatHiveAssetAmount(createResult.amount, 'HIVE'),
    memo: createResult.memo,
  });
  const tracking = buildTransferOp({
    from: account,
    to: account,
    amount: formatHiveAssetAmount(0.001, 'HIVE'),
    memo: buildChangellyTrackingMemo({
      exchangeId: createResult.exchangeId,
      outputCoinType: createResult.outputCoinType,
    }),
  });
  return [payin, tracking];
}
