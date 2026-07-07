'use client';

import {
  engineDepositListApiResponseSchema,
  engineDepositAddressApiResponseSchema,
  engineSwapListApiResponseSchema,
  engineSwapQuoteApiResponseSchema,
  engineWithdrawListApiResponseSchema,
  engineWithdrawQuoteApiResponseSchema,
  type EngineDepositListApiResponse,
  type EngineDepositAddressApiResponse,
  type EngineSwapListApiResponse,
  type EngineSwapQuoteApiResponse,
  type EngineWithdrawListApiResponse,
  type EngineWithdrawQuoteApiResponse,
} from '../../application/dto/engine-swap-api.schema';

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `HTTP ${res.status}`);
  }
  return JSON.parse(text) as T;
}

export async function fetchEngineSwapList(
  accountName: string,
): Promise<EngineSwapListApiResponse> {
  const res = await fetch(
    `/api/users/${encodeURIComponent(accountName)}/wallet/engine/swap/list`,
    { credentials: 'include', cache: 'no-store' },
  );
  const data = await parseJson<unknown>(res);
  const parsed = engineSwapListApiResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('invalid_response');
  }
  return parsed.data;
}

export async function fetchEngineSwapQuote(
  accountName: string,
  body: {
    fromSymbol: string;
    toSymbol: string;
    amountIn: string;
    direction?: 'exactInput' | 'exactOutput';
    slippage?: number;
  },
): Promise<EngineSwapQuoteApiResponse> {
  const res = await fetch(
    `/api/users/${encodeURIComponent(accountName)}/wallet/engine/swap/quote`,
    {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  const data = await parseJson<unknown>(res);
  return engineSwapQuoteApiResponseSchema.parse(data);
}

export async function fetchEngineDepositList(
  accountName: string,
): Promise<EngineDepositListApiResponse> {
  const res = await fetch(
    `/api/users/${encodeURIComponent(accountName)}/wallet/engine/deposit/list`,
    { credentials: 'include', cache: 'no-store' },
  );
  const data = await parseJson<unknown>(res);
  return engineDepositListApiResponseSchema.parse(data);
}

export async function fetchEngineDepositAddress(
  accountName: string,
  symbol: string,
): Promise<EngineDepositAddressApiResponse> {
  const q = new URLSearchParams({ symbol });
  const res = await fetch(
    `/api/users/${encodeURIComponent(accountName)}/wallet/engine/deposit/address?${q.toString()}`,
    { credentials: 'include' },
  );
  const data = await parseJson<unknown>(res);
  return engineDepositAddressApiResponseSchema.parse(data);
}

export async function fetchEngineWithdrawList(
  accountName: string,
): Promise<EngineWithdrawListApiResponse> {
  const res = await fetch(
    `/api/users/${encodeURIComponent(accountName)}/wallet/engine/withdraw/list`,
    { credentials: 'include', cache: 'no-store' },
  );
  const data = await parseJson<unknown>(res);
  return engineWithdrawListApiResponseSchema.parse(data);
}

export async function fetchEngineWithdrawQuote(
  accountName: string,
  body: {
    inputSymbol: string;
    outputSymbol: string;
    quantity: string;
    address?: string;
    previewOnly?: boolean;
  },
): Promise<EngineWithdrawQuoteApiResponse> {
  const res = await fetch(
    `/api/users/${encodeURIComponent(accountName)}/wallet/engine/withdraw/quote`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  const data = await parseJson<unknown>(res);
  return engineWithdrawQuoteApiResponseSchema.parse(data);
}
