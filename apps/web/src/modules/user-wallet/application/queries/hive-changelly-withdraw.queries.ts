import 'server-only';

import {
  queryApiFetchOutcome,
  QUERY_API_LIVE_INIT,
} from '@/modules/user-profile/infrastructure/clients/query-api.client';

import {
  hiveChangellyWithdrawCreateApiSchema,
  hiveChangellyWithdrawEstimateApiSchema,
  hiveChangellyWithdrawRangeApiSchema,
  type HiveChangellyWithdrawCreateApiResponse,
  type HiveChangellyWithdrawEstimateApiResponse,
  type HiveChangellyWithdrawRangeApiResponse,
} from '../dto/hive-changelly-withdraw-api.schema';
import type { HiveChangellyOutputCoin } from '../../domain/hive-changelly-withdraw.constants';

export async function getHiveChangellyWithdrawRangeQuery(
  accountName: string,
  outputCoinType: HiveChangellyOutputCoin,
): Promise<{ data: HiveChangellyWithdrawRangeApiResponse | null; error: string | null }> {
  const q = new URLSearchParams({ outputCoinType });
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/wallet/hive/withdraw/range?${q.toString()}`;
  const outcome = await queryApiFetchOutcome<unknown>(path, QUERY_API_LIVE_INIT);
  if (!outcome.ok) {
    return {
      data: null,
      error: outcome.status === 400 ? 'bad_request' : 'unavailable',
    };
  }
  const parsed = hiveChangellyWithdrawRangeApiSchema.safeParse(outcome.data);
  if (!parsed.success) {
    return { data: null, error: 'invalid_response' };
  }
  return { data: parsed.data, error: null };
}

export async function postHiveChangellyWithdrawEstimateQuery(
  accountName: string,
  body: { amount: number; outputCoinType: HiveChangellyOutputCoin },
): Promise<{ data: HiveChangellyWithdrawEstimateApiResponse | null; error: string | null }> {
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/wallet/hive/withdraw/estimate`;
  const outcome = await queryApiFetchOutcome<unknown>(path, {
    ...QUERY_API_LIVE_INIT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!outcome.ok) {
    return {
      data: null,
      error: outcome.status === 400 ? 'bad_request' : 'unavailable',
    };
  }
  const parsed = hiveChangellyWithdrawEstimateApiSchema.safeParse(outcome.data);
  if (!parsed.success) {
    return { data: null, error: 'invalid_response' };
  }
  return { data: parsed.data, error: null };
}

export async function postHiveChangellyWithdrawCreateQuery(
  accountName: string,
  body: {
    amount: number;
    outputCoinType: HiveChangellyOutputCoin;
    address: string;
  },
): Promise<{ data: HiveChangellyWithdrawCreateApiResponse | null; error: string | null }> {
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/wallet/hive/withdraw/create`;
  const outcome = await queryApiFetchOutcome<unknown>(path, {
    ...QUERY_API_LIVE_INIT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!outcome.ok) {
    return {
      data: null,
      error: outcome.status === 400 ? 'bad_request' : 'unavailable',
    };
  }
  const parsed = hiveChangellyWithdrawCreateApiSchema.safeParse(outcome.data);
  if (!parsed.success) {
    return { data: null, error: 'invalid_response' };
  }
  return { data: parsed.data, error: null };
}
