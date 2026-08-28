'use client';

import { Client } from 'hivesigner';
import hivesigner from 'hivesigner';

import type { IHiveSigner } from '../../application/ports/hive-signer.port';
import {
  wireCommentOptionsPayload,
  type HiveOperation,
  type HiveOperationPayload,
} from '@opden-data-layer/hive-broadcast';
import type { BroadcastTransactionResult } from '../../domain/types';
import { getHivesignerToken } from '../hivesigner-token';
import { extractTransactionIdFromBroadcastResult } from './extract-transaction-id';
import { buildHiveSignerCustomJsonSignUrl } from './hivesigner-custom-json-sign-url';
import { hivePayloadRequiresActiveKey } from './hive-operation-signing';

export const HIVESIGNER_REDIRECT_INITIATED = 'HiveSigner redirect initiated';

type WireOperation = [string, Record<string, unknown>];

function assertNeverForHiveOp(x: never): never {
  throw new Error(`Unsupported Hive operation: ${JSON.stringify(x)}`);
}

function toWireOperation(op: HiveOperation): WireOperation {
  switch (op.type) {
    case 'vote':
      return [
        'vote',
        {
          voter: op.voter,
          author: op.author,
          permlink: op.permlink,
          weight: op.weight,
        },
      ];
    case 'comment':
      return [
        'comment',
        {
          parent_author: op.parent_author,
          parent_permlink: op.parent_permlink,
          author: op.author,
          permlink: op.permlink,
          title: op.title,
          body: op.body,
          json_metadata: op.json_metadata,
        },
      ];
    case 'comment_options':
      return ['comment_options', wireCommentOptionsPayload(op)];
    case 'custom_json':
      return [
        'custom_json',
        {
          required_auths: [...op.required_auths],
          required_posting_auths: [...op.required_posting_auths],
          id: op.id,
          json: op.json,
        },
      ];
    case 'transfer':
      return [
        'transfer',
        {
          from: op.from,
          to: op.to,
          amount: op.amount,
          memo: op.memo,
        },
      ];
    case 'transfer_to_vesting':
      return [
        'transfer_to_vesting',
        {
          from: op.from,
          to: op.to,
          amount: op.amount,
        },
      ];
    case 'withdraw_vesting':
      return [
        'withdraw_vesting',
        {
          account: op.account,
          vesting_shares: op.vesting_shares,
        },
      ];
    case 'delegate_vesting_shares':
      return [
        'delegate_vesting_shares',
        {
          delegator: op.delegator,
          delegatee: op.delegatee,
          vesting_shares: op.vesting_shares,
        },
      ];
    case 'transfer_to_savings':
      return [
        'transfer_to_savings',
        {
          from: op.from,
          to: op.to,
          amount: op.amount,
          memo: op.memo,
        },
      ];
    case 'transfer_from_savings':
      return [
        'transfer_from_savings',
        {
          from: op.from,
          to: op.to,
          amount: op.amount,
          memo: op.memo,
        },
      ];
    case 'cancel_transfer_from_savings':
      return [
        'cancel_transfer_from_savings',
        {
          from: op.from,
          request_id: op.request_id,
        },
      ];
    case 'claim_reward_balance':
      return [
        'claim_reward_balance',
        {
          account: op.account,
          reward_hive: op.reward_hive,
          reward_hbd: op.reward_hbd,
          reward_vests: op.reward_vests,
        },
      ];
    case 'collateralized_convert':
      return [
        'collateralized_convert',
        {
          owner: op.owner,
          requestid: op.requestid,
          amount: op.amount,
        },
      ];
  }
  return assertNeverForHiveOp(op);
}

function redirectForActiveKeyOperations(wireOps: WireOperation[]): never {
  if (wireOps.length !== 1) {
    throw new Error('HiveSigner active-key signing supports one operation at a time');
  }

  const callbackUri = window.location.href;
  const [name, params] = wireOps[0];

  const signUrl =
    name === 'custom_json'
      ? buildHiveSignerCustomJsonSignUrl(
          params as {
            required_auths: string[];
            required_posting_auths: string[];
            id: string;
            json: string;
          },
          callbackUri,
        )
      : hivesigner.sign(
          name,
          params as Record<string, string | number | boolean>,
          callbackUri,
        );

  if (typeof signUrl !== 'string') {
    const err = signUrl as { error_description?: string; error?: string };
    throw new Error(err.error_description ?? err.error ?? 'HiveSigner sign URL failed');
  }
  window.location.assign(signUrl);
  throw new Error(HIVESIGNER_REDIRECT_INITIATED);
}

export function createHiveSignerSigner(): IHiveSigner {
  return {
    async sign(payload: HiveOperationPayload): Promise<BroadcastTransactionResult> {
      const accessToken = getHivesignerToken();
      if (!accessToken) {
        throw new Error('HiveSigner access token missing — sign in again');
      }

      const wireOps = payload.operations.map(toWireOperation);
      const usesActiveKey = hivePayloadRequiresActiveKey(payload.operations);

      if (usesActiveKey) {
        redirectForActiveKeyOperations(wireOps);
      }

      const client = new Client({ accessToken });
      const response = await client.broadcast(
        wireOps as Parameters<Client['broadcast']>[0],
      );
      const txId = extractTransactionIdFromBroadcastResult(response);
      if (!txId) {
        throw new Error('HiveSigner broadcast succeeded but transaction id missing');
      }
      return { transactionId: txId };
    },
  };
}
