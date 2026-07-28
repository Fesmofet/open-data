import type { BuildOslHiveEngineDepositOpInput } from '@opden-data-layer/hive-broadcast';

export type BuildDepositInstructionOslPayloadInput = {
  account: string;
  destination: string;
  symbolIn: string;
  symbolOut: string;
  pair: string;
  exRate: number;
  memo: string | null;
  depositAccount: string | null;
  address: string | null;
};

export type BuildDepositInstructionBroadcastInput = Omit<
  BuildDepositInstructionOslPayloadInput,
  'account'
>;

export function buildDepositInstructionOslPayload(
  input: BuildDepositInstructionOslPayloadInput,
): BuildOslHiveEngineDepositOpInput['payload'] {
  const depositAccount = input.depositAccount?.trim() || undefined;
  const address = input.address?.trim() || undefined;
  if (!depositAccount && !address) {
    throw new Error('deposit instruction requires deposit account or address');
  }
  if (depositAccount && address) {
    throw new Error('deposit instruction cannot have both account and address');
  }

  return {
    author: input.account,
    destination: input.destination,
    symbol_in: input.symbolIn,
    symbol_out: input.symbolOut,
    pair: input.pair,
    ex_rate: input.exRate,
    ...(input.memo ? { memo: input.memo } : {}),
    ...(depositAccount ? { deposit_account: depositAccount } : {}),
    ...(address ? { address } : {}),
  };
}
