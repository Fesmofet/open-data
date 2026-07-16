import 'server-only';

import {
  queryApiFetch,
  queryApiFetchLive,
} from '@/modules/user-profile/infrastructure/clients/query-api.client';

import type { PairBalanceView } from '../../domain/ledger.types';

export type OblLedgerApiResponse = {
  accountA: string;
  accountB: string;
  startedEventSeq: string | null;
  contracts: unknown[];
  invoices: unknown[];
  payments: unknown[];
  disputes: unknown[];
  balance: PairBalanceView;
};

export type OblRelationshipApiRow = {
  counterparty: string;
  roles: Array<'provider' | 'client'>;
  contractCount: number;
  balance: PairBalanceView;
  lastActivityAt: string | null;
};

export type OblContractApiRow = {
  contract_id: string;
  offer_id: string;
  offer_version: number;
  provider: string;
  client: string;
  dispute_rule: 'client' | 'provider' | 'arbiter';
  arbiter: string | null;
  metadata: Record<string, unknown>;
  offer_name: string;
  offer_description: string | null;
  created_event_seq: string;
  created_at: string;
  transaction_id: string;
};

export async function fetchOblLedger(accountA: string, accountB: string) {
  const q = new URLSearchParams({ accountA, accountB });
  return queryApiFetch<OblLedgerApiResponse>(`/query/v1/obl/ledger?${q.toString()}`);
}

export async function fetchOblLedgerLive(accountA: string, accountB: string) {
  const q = new URLSearchParams({ accountA, accountB });
  return queryApiFetchLive<OblLedgerApiResponse>(
    `/query/v1/obl/ledger?${q.toString()}`,
  );
}

export async function fetchOblRelationships(account: string) {
  const q = new URLSearchParams({ account });
  return queryApiFetch<OblRelationshipApiRow[]>(
    `/query/v1/obl/relationships?${q.toString()}`,
  );
}

export async function fetchOblContract(contractId: string) {
  return queryApiFetch<OblContractApiRow>(
    `/query/v1/obl/contracts/${encodeURIComponent(contractId)}`,
  );
}

export async function resolveOfferAlreadySigned(
  viewer: string | null,
  offerId: string,
  author: string,
): Promise<boolean> {
  if (!viewer || viewer === author) {
    return false;
  }
  const ledger = await fetchOblLedger(viewer, author);
  if (!ledger) {
    return false;
  }
  return (ledger.contracts as Array<{ offer_id: string }>).some(
    (contract) => contract.offer_id === offerId,
  );
}

export async function convertUsdToWaiv(amountUsd: number) {
  const q = new URLSearchParams({ amountUsd: String(amountUsd) });
  return queryApiFetch<{
    amountUsd: number;
    rateUsd: number | null;
    amountWaiv: number | null;
  }>(`/query/v1/obl/convert/usd-to-waiv?${q.toString()}`);
}
