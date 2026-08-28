import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
  type KeyObject,
} from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  CHANGELLY_CLIENT_MODULE_OPTIONS,
  type ChangellyClientModuleOptions,
} from './changelly-client.options';
import type {
  ChangellyClientInterface,
  ChangellyClientResult,
} from './interface';
import { mapChangellyTransactionResult } from './map-changelly-transaction';
import type {
  ChangellyExchangeAmount,
  ChangellyJsonRpcRequest,
  ChangellyPairParams,
  ChangellyPayinExchange,
  ChangellyTransactionResult,
} from './type';

const DEFAULT_BASE_URL = 'https://api.changelly.com/v2';
const DEFAULT_TIMEOUT_MS = 12_000;

type ChangellyCredentials = {
  privateKey: KeyObject;
  apiKey: string;
};

function parseChangellyCredentials(
  privateKeyHex: string | undefined,
): ChangellyCredentials | null {
  if (!privateKeyHex?.trim()) {
    return null;
  }
  try {
    const privateKey = createPrivateKey({
      key: Buffer.from(privateKeyHex.trim(), 'hex'),
      format: 'der',
      type: 'pkcs8',
    });
    const publicKeyDer = createPublicKey(privateKey).export({
      type: 'pkcs1',
      format: 'der',
    });
    const apiKey = createHash('sha256').update(publicKeyDer).digest('base64');
    return { privateKey, apiKey };
  } catch {
    return null;
  }
}

function formSignedRequest(
  credentials: ChangellyCredentials,
  message: ChangellyJsonRpcRequest,
  url: string,
): { method: 'POST'; url: string; headers: Record<string, string>; body: string } {
  const body = JSON.stringify(message);
  const signature = sign('sha256', Buffer.from(body), {
    key: credentials.privateKey,
    type: 'pkcs8',
    format: 'der',
  });
  return {
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': credentials.apiKey,
      'X-Api-Signature': signature.toString('base64'),
    },
    body,
  };
}

@Injectable()
export class ChangellyClient implements ChangellyClientInterface {
  private readonly logger = new Logger(ChangellyClient.name);
  private credentials: ChangellyCredentials | null | undefined;

  constructor(
    @Inject(CHANGELLY_CLIENT_MODULE_OPTIONS)
    private readonly options: ChangellyClientModuleOptions,
  ) {}

  private resolveCredentials(): ChangellyCredentials | null {
    if (this.credentials !== undefined) {
      return this.credentials;
    }
    this.credentials = parseChangellyCredentials(this.options.privateKeyHex);
    if (!this.credentials) {
      this.logger.warn('Changelly private key missing or invalid');
    }
    return this.credentials;
  }

  private baseUrl(): string {
    return (this.options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
  }

  private timeoutMs(): number {
    return this.options.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  private unavailableError(): { error: { message: string } } {
    return { error: { message: 'Changelly unavailable' } };
  }

  private async fetchRpc<T>(
    message: ChangellyJsonRpcRequest,
  ): Promise<ChangellyClientResult<T>> {
    const credentials = this.resolveCredentials();
    if (!credentials) {
      return this.unavailableError();
    }

    const request = formSignedRequest(credentials, message, this.baseUrl());
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs());
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = (await response.json()) as {
        result?: T;
        error?: { message?: string };
      };
      if (data.error?.message) {
        return { error: { message: data.error.message } };
      }
      if (data.result === undefined) {
        return { error: { message: 'Changelly empty response' } };
      }
      return { result: data.result };
    } catch (e) {
      this.logger.error((e as Error).message);
      return this.unavailableError();
    }
  }

  async getPairsParams(input: {
    from?: string;
    to: string;
  }): Promise<ChangellyClientResult<ChangellyPairParams>> {
    const from = (input.from ?? 'hive').toLowerCase();
    const to = input.to.toLowerCase();
    const rpc = await this.fetchRpc<Array<{
      from: string;
      to: string;
      minAmountFloat: string;
      maxAmountFloat: string;
    }>>({
      jsonrpc: '2.0',
      id: 'odl',
      method: 'getPairsParams',
      params: { from, to },
    });
    if (rpc.error) {
      return rpc;
    }
    const row = rpc.result[0];
    if (!row) {
      return { error: { message: 'Changelly pair not found' } };
    }
    return {
      result: {
        from: row.from,
        to: row.to,
        minAmountFloat: row.minAmountFloat,
        maxAmountFloat: row.maxAmountFloat,
      },
    };
  }

  async getExchangeAmount(input: {
    from?: string;
    to: string;
    amountFrom: number;
  }): Promise<ChangellyClientResult<ChangellyExchangeAmount>> {
    const from = (input.from ?? 'hive').toLowerCase();
    const to = input.to.toLowerCase();
    const rpc = await this.fetchRpc<ChangellyExchangeAmount[]>({
      jsonrpc: '2.0',
      id: 'odl',
      method: 'getExchangeAmount',
      params: {
        from,
        to,
        amountFrom: input.amountFrom,
      },
    });
    if (rpc.error) {
      return rpc;
    }
    const row = rpc.result[0];
    if (!row) {
      return { error: { message: 'Changelly exchange amount unavailable' } };
    }
    return { result: row };
  }

  async createTransaction(input: {
    from?: string;
    to: string;
    amountFrom: number;
    address: string;
    refundAddress: string;
  }): Promise<ChangellyClientResult<ChangellyPayinExchange>> {
    const from = (input.from ?? 'hive').toLowerCase();
    const to = input.to.toLowerCase();
    const rpc = await this.fetchRpc<ChangellyTransactionResult>({
      jsonrpc: '2.0',
      id: 'odl',
      method: 'createTransaction',
      params: {
        from,
        to,
        amountFrom: input.amountFrom,
        address: input.address,
        refundAddress: input.refundAddress,
      },
    });
    if (rpc.error) {
      return rpc;
    }
    return { result: mapChangellyTransactionResult(rpc.result) };
  }
}
