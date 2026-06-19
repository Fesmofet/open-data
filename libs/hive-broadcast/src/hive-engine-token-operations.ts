import { buildCustomJsonOp } from './operation-builders';
import type { CustomJsonOp } from './hive-operations';
import {
  HIVE_ENGINE_CUSTOM_JSON_ID,
  HIVE_ENGINE_TOKENS_CONTRACT,
} from './constants';

export type HiveEngineTokensContractAction =
  | 'stake'
  | 'unstake'
  | 'cancelUnstake'
  | 'delegate'
  | 'undelegate'
  | 'transfer';

export type HiveEngineTokensStakePayload = {
  readonly symbol: string;
  readonly quantity: string;
  /** Receiver of staked tokens; defaults to `account` when omitted. */
  readonly to?: string;
};

export type HiveEngineTokensQuantityPayload = {
  readonly symbol: string;
  readonly quantity: string;
};

export type HiveEngineTokensDelegatePayload = {
  readonly symbol: string;
  readonly quantity: string;
  readonly to: string;
};

export type HiveEngineTokensTransferPayload = {
  readonly symbol: string;
  readonly quantity: string;
  readonly to: string;
  readonly memo?: string;
};

export type HiveEngineTokensSymbolPayload = {
  readonly symbol: string;
};

export type BuildHiveEngineTokensOpInput = {
  readonly account: string;
  readonly contractAction: HiveEngineTokensContractAction;
  readonly payload:
    | HiveEngineTokensStakePayload
    | HiveEngineTokensQuantityPayload
    | HiveEngineTokensDelegatePayload
    | HiveEngineTokensTransferPayload
    | HiveEngineTokensSymbolPayload;
};

function buildContractPayload(
  contractAction: HiveEngineTokensContractAction,
  account: string,
  payload: BuildHiveEngineTokensOpInput['payload'],
): Record<string, string> {
  switch (contractAction) {
    case 'stake': {
      const p = payload as HiveEngineTokensStakePayload;
      return {
        to: p.to ?? account,
        symbol: p.symbol,
        quantity: p.quantity,
      };
    }
    case 'unstake': {
      const p = payload as HiveEngineTokensQuantityPayload;
      return { symbol: p.symbol, quantity: p.quantity };
    }
    case 'cancelUnstake': {
      const p = payload as HiveEngineTokensSymbolPayload;
      return { symbol: p.symbol };
    }
    case 'delegate':
    case 'undelegate': {
      const p = payload as HiveEngineTokensDelegatePayload;
      return { to: p.to, symbol: p.symbol, quantity: p.quantity };
    }
    case 'transfer': {
      const p = payload as HiveEngineTokensTransferPayload;
      return {
        to: p.to,
        symbol: p.symbol,
        quantity: p.quantity,
        ...(p.memo !== undefined ? { memo: p.memo } : {}),
      };
    }
    default: {
      const _exhaustive: never = contractAction;
      return _exhaustive;
    }
  }
}

/**
 * Hive Engine `tokens` contract action via `custom_json` id `ssc-mainnet-hive`.
 * @see https://github.com/hive-engine/steemsmartcontracts-wiki/blob/master/Tokens-Contract.md
 */
export function buildHiveEngineTokensOp(
  input: BuildHiveEngineTokensOpInput,
): CustomJsonOp {
  const contractPayload = buildContractPayload(
    input.contractAction,
    input.account,
    input.payload,
  );
  const json = JSON.stringify({
    contractName: HIVE_ENGINE_TOKENS_CONTRACT,
    contractAction: input.contractAction,
    contractPayload,
  });
  return buildCustomJsonOp({
    required_auths: [input.account],
    required_posting_auths: [],
    id: HIVE_ENGINE_CUSTOM_JSON_ID,
    json,
  });
}
