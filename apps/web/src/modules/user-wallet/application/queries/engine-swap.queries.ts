import 'server-only';

import {
  queryApiFetchOutcome,
  QUERY_API_LIVE_INIT,
} from '@/modules/user-profile/infrastructure/clients/query-api.client';

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
} from '../dto/engine-swap-api.schema';
import {
  filterEngineWithdrawList,
  isDisabledEngineWithdrawPair,
} from '../../domain/filter-engine-withdraw-list';

export async function getEngineSwapListQuery(
  accountName: string,
): Promise<{ data: EngineSwapListApiResponse | null; error: string | null }> {
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/wallet/engine/swap/list`;
  const outcome = await queryApiFetchOutcome<unknown>(path, QUERY_API_LIVE_INIT);
  if (!outcome.ok) {
    return { data: null, error: 'unavailable' };
  }
  const parsed = engineSwapListApiResponseSchema.safeParse(outcome.data);
  if (!parsed.success) {
    return { data: null, error: 'invalid_response' };
  }
  return { data: parsed.data, error: null };
}

export async function postEngineSwapQuoteQuery(
  accountName: string,
  body: {
    fromSymbol: string;
    toSymbol: string;
    amountIn: string;
    direction?: 'exactInput' | 'exactOutput';
    slippage?: number;
  },
): Promise<{ data: EngineSwapQuoteApiResponse | null; error: string | null }> {
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/wallet/engine/swap/quote`;
  const outcome = await queryApiFetchOutcome<unknown>(path, {
    ...QUERY_API_LIVE_INIT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!outcome.ok) {
    return { data: null, error: outcome.status === 400 ? 'bad_request' : 'unavailable' };
  }
  const parsed = engineSwapQuoteApiResponseSchema.safeParse(outcome.data);
  if (!parsed.success) {
    return { data: null, error: 'invalid_response' };
  }
  return { data: parsed.data, error: null };
}

export async function getEngineDepositListQuery(
  accountName: string,
): Promise<{ data: EngineDepositListApiResponse | null; error: string | null }> {
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/wallet/engine/deposit/list`;
  const outcome = await queryApiFetchOutcome<unknown>(path, QUERY_API_LIVE_INIT);
  if (!outcome.ok) {
    return { data: null, error: 'unavailable' };
  }
  const parsed = engineDepositListApiResponseSchema.safeParse(outcome.data);
  if (!parsed.success) {
    return { data: null, error: 'invalid_response' };
  }
  return { data: parsed.data, error: null };
}

export async function getEngineDepositAddressQuery(
  accountName: string,
  symbol: string,
): Promise<{ data: EngineDepositAddressApiResponse | null; error: string | null }> {
  const q = new URLSearchParams({ symbol });
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/wallet/engine/deposit/address?${q.toString()}`;
  const outcome = await queryApiFetchOutcome<unknown>(path, QUERY_API_LIVE_INIT);
  if (!outcome.ok) {
    return { data: null, error: outcome.status === 400 ? 'bad_request' : 'unavailable' };
  }
  const parsed = engineDepositAddressApiResponseSchema.safeParse(outcome.data);
  if (!parsed.success) {
    return { data: null, error: 'invalid_response' };
  }
  return { data: parsed.data, error: null };
}

export async function getEngineWithdrawListQuery(
  accountName: string,
): Promise<{ data: EngineWithdrawListApiResponse | null; error: string | null }> {
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/wallet/engine/withdraw/list`;
  const outcome = await queryApiFetchOutcome<unknown>(path, QUERY_API_LIVE_INIT);
  if (!outcome.ok) {
    return { data: null, error: 'unavailable' };
  }
  const parsed = engineWithdrawListApiResponseSchema.safeParse(outcome.data);
  if (!parsed.success) {
    return { data: null, error: 'invalid_response' };
  }
  return { data: filterEngineWithdrawList(parsed.data), error: null };
}

export async function postEngineWithdrawQuoteQuery(
  accountName: string,
  body: {
    inputSymbol: string;
    outputSymbol: string;
    quantity: string;
    address?: string;
    previewOnly?: boolean;
  },
): Promise<{ data: EngineWithdrawQuoteApiResponse | null; error: string | null }> {
  if (isDisabledEngineWithdrawPair(body.inputSymbol, body.outputSymbol)) {
    return { data: null, error: 'bad_request' };
  }
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/wallet/engine/withdraw/quote`;
  const outcome = await queryApiFetchOutcome<unknown>(path, {
    ...QUERY_API_LIVE_INIT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!outcome.ok) {
    return { data: null, error: outcome.status === 400 ? 'bad_request' : 'unavailable' };
  }
  const parsed = engineWithdrawQuoteApiResponseSchema.safeParse(outcome.data);
  if (!parsed.success) {
    return { data: null, error: 'invalid_response' };
  }
  return { data: parsed.data, error: null };
}
