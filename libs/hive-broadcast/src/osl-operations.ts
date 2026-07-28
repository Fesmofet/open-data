import { buildCustomJsonOp } from './operation-builders';
import type { CustomJsonOp } from './hive-operations';

type OslEnvelopeAction = 'hive_engine_deposit';

export type BuildOslEnvelopeOpInput = {
  readonly id: string;
  readonly action: OslEnvelopeAction;
  readonly payload: Record<string, unknown>;
  readonly required_auths?: readonly string[];
  readonly required_posting_auths?: readonly string[];
};

export type BuildOslHiveEngineDepositOpInput = {
  readonly id: string;
  readonly account: string;
  readonly payload: {
    readonly author: string;
    readonly destination: string;
    readonly symbol_in: string;
    readonly symbol_out: string;
    readonly pair: string;
    readonly ex_rate: number;
    readonly memo?: string;
    readonly deposit_account?: string;
    readonly address?: string;
  };
};

export function buildOslEnvelopeOp(input: BuildOslEnvelopeOpInput): CustomJsonOp {
  const envelope = {
    events: [
      {
        action: input.action,
        v: 1,
        payload: input.payload,
      },
    ],
  };

  return buildCustomJsonOp({
    required_auths: input.required_auths ?? [],
    required_posting_auths: input.required_posting_auths ?? [],
    id: input.id,
    json: JSON.stringify(envelope),
  });
}

export function buildOslHiveEngineDepositOp(
  input: BuildOslHiveEngineDepositOpInput,
): CustomJsonOp {
  return buildOslEnvelopeOp({
    id: input.id,
    action: 'hive_engine_deposit',
    payload: input.payload,
    required_posting_auths: [input.account],
  });
}
