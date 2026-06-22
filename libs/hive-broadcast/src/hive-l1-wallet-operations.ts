import type {
  CancelTransferFromSavingsOp,
  CustomJsonOp,
  DelegateVestingSharesOp,
  TransferFromSavingsOp,
  TransferOp,
  TransferToSavingsOp,
  TransferToVestingOp,
  WithdrawVestingOp,
} from './hive-operations';
import { buildCustomJsonOp } from './operation-builders';

const HIVE_RC_CUSTOM_JSON_ID = 'rc';

export type HiveTransferAsset = 'HIVE' | 'HBD';

export function formatHiveAssetAmount(amount: number, asset: HiveTransferAsset): string {
  const precision = asset === 'HBD' ? 3 : 3;
  return `${amount.toFixed(precision)} ${asset}`;
}

export function buildTransferOp(input: {
  from: string;
  to: string;
  amount: string;
  memo?: string;
}): TransferOp {
  return {
    type: 'transfer',
    from: input.from,
    to: input.to,
    amount: input.amount,
    memo: input.memo ?? '',
  };
}

export function buildTransferToVestingOp(input: {
  from: string;
  to: string;
  amount: string;
}): TransferToVestingOp {
  return {
    type: 'transfer_to_vesting',
    from: input.from,
    to: input.to,
    amount: input.amount,
  };
}

export function buildWithdrawVestingOp(input: {
  account: string;
  vestingShares: string;
}): WithdrawVestingOp {
  return {
    type: 'withdraw_vesting',
    account: input.account,
    vesting_shares: input.vestingShares,
  };
}

export function buildCancelPowerDownOp(account: string): WithdrawVestingOp {
  return buildWithdrawVestingOp({
    account,
    vestingShares: '0.000000 VESTS',
  });
}

export function buildDelegateVestingSharesOp(input: {
  delegator: string;
  delegatee: string;
  vestingShares: string;
}): DelegateVestingSharesOp {
  return {
    type: 'delegate_vesting_shares',
    delegator: input.delegator,
    delegatee: input.delegatee,
    vesting_shares: input.vestingShares,
  };
}

export function buildTransferToSavingsOp(input: {
  from: string;
  to: string;
  amount: string;
  memo?: string;
}): TransferToSavingsOp {
  return {
    type: 'transfer_to_savings',
    from: input.from,
    to: input.to,
    amount: input.amount,
    memo: input.memo ?? '',
  };
}

export function buildTransferFromSavingsOp(input: {
  from: string;
  to: string;
  amount: string;
  memo?: string;
}): TransferFromSavingsOp {
  return {
    type: 'transfer_from_savings',
    from: input.from,
    to: input.to,
    amount: input.amount,
    memo: input.memo ?? '',
  };
}

export function buildCancelTransferFromSavingsOp(input: {
  from: string;
  requestId: number;
}): CancelTransferFromSavingsOp {
  return {
    type: 'cancel_transfer_from_savings',
    from: input.from,
    request_id: input.requestId,
  };
}

/** Legacy interest claim: tiny savings withdraw + immediate cancel. */
export function buildClaimHbdInterestOps(account: string): [
  TransferFromSavingsOp,
  CancelTransferFromSavingsOp,
] {
  const requestId = Date.now();
  return [
    buildTransferFromSavingsOp({
      from: account,
      to: account,
      amount: '0.001 HBD',
      memo: 'Claim HBD interest',
    }),
    buildCancelTransferFromSavingsOp({
      from: account,
      requestId,
    }),
  ];
}

export function buildDelegateRcOp(input: {
  from: string;
  to: string;
  rc: number;
}): CustomJsonOp {
  const json = JSON.stringify([
    'delegate_rc',
    {
      from: input.from,
      delegatees: [{ to: input.to, rc: input.rc }],
    },
  ]);
  return buildCustomJsonOp({
    required_auths: [],
    required_posting_auths: [input.from],
    id: HIVE_RC_CUSTOM_JSON_ID,
    json,
  });
}

export function buildUndelegateRcOp(input: {
  from: string;
  to: string;
  rc: number;
}): CustomJsonOp {
  const json = JSON.stringify([
    'undelegate_rc',
    {
      from: input.from,
      delegatees: [{ to: input.to, rc: input.rc }],
    },
  ]);
  return buildCustomJsonOp({
    required_auths: [],
    required_posting_auths: [input.from],
    id: HIVE_RC_CUSTOM_JSON_ID,
    json,
  });
}
