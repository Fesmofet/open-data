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
  publicKey: Buffer;
};

function parseChangellyCredentials(
  privateKeyHex: string | undefined,
): ChangellyCredentials | null {
  const privateKeyString = privateKeyHex ?? '';
  if (!privateKeyString) {
    return null;
  }
  try {
    const privateKey = createPrivateKey({
      key: privateKeyString,
      format: 'der',
      type: 'pkcs8',
      encoding: 'hex',
    });
    const publicKey = createPublicKey(privateKey).export({
      type: 'pkcs1',
      format: 'der',
    });
    return { privateKey, publicKey: publicKey as Buffer };
  } catch {
    return null;
  }
}

/** Legacy `formRequest` from waivio-api changellyAPI. */
function formRequest(
  credentials: ChangellyCredentials,
  message: ChangellyJsonRpcRequest,
  url: string,
): { method: 'POST'; url: string; headers: Record<string, string>; body: string } {
  const signature = sign('sha256', Buffer.from(JSON.stringify(message)), {
    key: credentials.privateKey,
    type: 'pkcs8',
    format: 'der',
  });
  return {
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': createHash('sha256').update(credentials.publicKey).digest('base64'),
      'X-Api-Signature': signature.toString('base64'),
    },
    body: JSON.stringify(message),
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

  /** Legacy `fetchData`. */
  private async fetchData<T>(
    message: ChangellyJsonRpcRequest,
  ): Promise<ChangellyClientResult<T>> {
    const credentials = this.resolveCredentials();
    if (!credentials) {
      return { error: { message: 'Changelly unavailable' } };
    }

    const request = formRequest(credentials, message, this.baseUrl());
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
      if (data.error) {
        this.logger.warn(data.error.message ?? 'Changelly error');
        return { error: { message: data.error.message ?? 'Changelly error' } };
      }
      return { result: data.result as T };
    } catch (error) {
      this.logger.error((error as Error).message);
      return { error: { message: 'Changelly unavailable' } };
    }
  }

  async getPairsParams(input: {
    from?: string;
    to: string;
  }): Promise<ChangellyClientResult<ChangellyPairParams>> {
    const from = input.from ?? 'hive';
    const to = input.to;
    const { result, error } = await this.fetchData<ChangellyPairParams[]>({
      jsonrpc: '2.0',
      id: 'test',
      method: 'getPairsParams',
      params: {
        from,
        to,
      },
    });
    if (error) {
      return { error };
    }
    const row = result?.[0];
    if (!row) {
      return { error: { message: 'Changelly pair not found' } };
    }
    return { result: row };
  }

  async getExchangeAmount(input: {
    from?: string;
    to: string;
    amountFrom: number;
  }): Promise<ChangellyClientResult<ChangellyExchangeAmount>> {
    const from = input.from ?? 'hive';
    const to = input.to;
    const { result, error } = await this.fetchData<ChangellyExchangeAmount[]>({
      jsonrpc: '2.0',
      id: 'test',
      method: 'getExchangeAmount',
      params: {
        from,
        to,
        amountFrom: input.amountFrom,
      },
    });
    if (error) {
      return { error };
    }
    const row = result?.[0];
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
    const from = input.from ?? 'hive';
    const to = input.to;
    const { result, error } = await this.fetchData<ChangellyTransactionResult>({
      jsonrpc: '2.0',
      id: 'test',
      method: 'createTransaction',
      params: {
        from,
        to,
        amountFrom: input.amountFrom,
        address: input.address,
        refundAddress: input.refundAddress,
      },
    });
    if (error) {
      return { error };
    }
    if (!result) {
      return { error: { message: 'Changelly unavailable' } };
    }
    return { result: mapChangellyTransactionResult(result) };
  }
}
