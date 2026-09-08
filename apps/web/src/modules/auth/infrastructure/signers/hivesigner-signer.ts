'use client';

import { Client } from 'hivesigner';
import hivesigner from 'hivesigner';

import type { IHiveSigner } from '../../application/ports/hive-signer.port';
import type { HiveOperationPayload } from '@opden-data-layer/hive-broadcast';
import type { BroadcastTransactionResult } from '../../domain/types';
import { getHivesignerToken } from '../hivesigner-token';
import { extractTransactionIdFromBroadcastResult } from './extract-transaction-id';
import { buildHiveSignerCustomJsonSignUrl } from './hivesigner-custom-json-sign-url';
import { hivePayloadRequiresActiveKey } from './hive-operation-signing';
import { toHiveWireOperation } from './hive-operation-wire';

export const HIVESIGNER_REDIRECT_INITIATED = 'HiveSigner redirect initiated';

type WireOperation = [string, Record<string, unknown>];

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

      const wireOps = payload.operations.map(toHiveWireOperation) as WireOperation[];
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
