'use client';

import {
  hiveChangellyWithdrawCreateApiSchema,
  hiveChangellyWithdrawEstimateApiSchema,
  hiveChangellyWithdrawRangeApiSchema,
  type HiveChangellyWithdrawCreateApiResponse,
  type HiveChangellyWithdrawEstimateApiResponse,
  type HiveChangellyWithdrawRangeApiResponse,
} from '../../application/dto/hive-changelly-withdraw-api.schema';
import type { HiveChangellyOutputCoin } from '../../domain/hive-changelly-withdraw.constants';

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `HTTP ${res.status}`);
  }
  return JSON.parse(text) as T;
}

export async function fetchHiveChangellyWithdrawRange(
  accountName: string,
  outputCoinType: HiveChangellyOutputCoin,
): Promise<HiveChangellyWithdrawRangeApiResponse> {
  const q = new URLSearchParams({ outputCoinType });
  const res = await fetch(
    `/api/users/${encodeURIComponent(accountName)}/wallet/hive/withdraw/range?${q.toString()}`,
    { credentials: 'include', cache: 'no-store' },
  );
  const data = await parseJson<unknown>(res);
  return hiveChangellyWithdrawRangeApiSchema.parse(data);
}

export async function fetchHiveChangellyWithdrawEstimate(
  accountName: string,
  body: { amount: number; outputCoinType: HiveChangellyOutputCoin },
): Promise<HiveChangellyWithdrawEstimateApiResponse> {
  const res = await fetch(
    `/api/users/${encodeURIComponent(accountName)}/wallet/hive/withdraw/estimate`,
    {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  const data = await parseJson<unknown>(res);
  return hiveChangellyWithdrawEstimateApiSchema.parse(data);
}

export async function fetchHiveChangellyWithdrawCreate(
  accountName: string,
  body: {
    amount: number;
    outputCoinType: HiveChangellyOutputCoin;
    address: string;
  },
): Promise<HiveChangellyWithdrawCreateApiResponse> {
  const res = await fetch(
    `/api/users/${encodeURIComponent(accountName)}/wallet/hive/withdraw/create`,
    {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  const data = await parseJson<unknown>(res);
  return hiveChangellyWithdrawCreateApiSchema.parse(data);
}
