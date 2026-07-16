'use server';

import { queryApiFetchLive } from '@/modules/user-profile/infrastructure/clients/query-api.client';

import type { RelationshipTab } from '../../domain/relationship-tab-url';
import type { ArbitrationStatus } from '../../domain/arbitration-status-url';
import type { OblCursorPage, OblOffsetPage } from '../../domain/obl-pagination.types';
import type { OblOfferDraftView } from '../clients/obl-drafts.server';
import {
  fetchOblBalance,
  fetchOblLedgerContracts,
  fetchOblLedgerDisputes,
  fetchOblLedgerInvoices,
  fetchOblLedgerPayments,
  fetchOblRelationships,
  type OblContractApiRow,
  type OblRelationshipApiRow,
} from '../clients/obl-ledger.server';
import { fetchOblDraftList } from '../clients/obl-drafts.server';
import { searchOblOffers } from '../clients/obl-offers.server';
import type { OblOfferApiRow } from '../clients/obl-offers.server';
import {
  fetchOblArbitration,
  type ArbitrationDisputeApiRow,
} from '../clients/obl-arbitration.server';
import type { PairBalanceView } from '../../domain/ledger.types';

export async function loadMorePublicOffersAction(input: {
  kind: 'offer' | 'request';
  offset: number;
  author?: string;
  q?: string;
}): Promise<OblOffsetPage<OblOfferApiRow>> {
  const page = await searchOblOffers({
    kind: input.kind,
    author: input.author,
    q: input.q,
    limit: 20,
    offset: input.offset,
  });
  return page ?? { items: [], hasMore: false };
}

export async function loadMoreManageOffersAction(input: {
  author: string;
  kind: 'offer' | 'request';
  status: 'active' | 'retired';
  offset: number;
}): Promise<OblOffsetPage<OblOfferApiRow>> {
  const page = await searchOblOffers({
    author: input.author,
    kind: input.kind,
    status: input.status,
    limit: 20,
    offset: input.offset,
  });
  return page ?? { items: [], hasMore: false };
}

export async function loadMoreOblDraftsAction(
  author: string,
  offset: number,
): Promise<OblOffsetPage<OblOfferDraftView>> {
  const page = await fetchOblDraftList(author, { limit: 20, offset });
  return page ?? { items: [], hasMore: false };
}

export async function loadMoreOblRelationshipsAction(
  account: string,
  offset: number,
): Promise<OblOffsetPage<OblRelationshipApiRow>> {
  const page = await fetchOblRelationships(account, { limit: 20, offset });
  return page ?? { items: [], hasMore: false };
}

export async function loadMoreOblArbitrationAction(
  account: string,
  status: ArbitrationStatus,
  cursor: string,
): Promise<OblCursorPage<ArbitrationDisputeApiRow>> {
  const page = await fetchOblArbitration(
    account,
    { status, limit: 20, cursor },
    true,
  );
  return page ?? { items: [], hasMore: false, nextCursor: null };
}

function ledgerTabPath(tab: RelationshipTab): string {
  if (tab === 'payments') {
    return 'payments';
  }
  if (tab === 'invoices') {
    return 'invoices';
  }
  if (tab === 'contracts') {
    return 'contracts';
  }
  return 'disputes';
}

export async function loadMoreOblLedgerTabAction(input: {
  accountA: string;
  accountB: string;
  tab: RelationshipTab;
  cursor: string;
}): Promise<OblCursorPage<unknown>> {
  const path = `/query/v1/obl/ledger/${ledgerTabPath(input.tab)}?${new URLSearchParams({
    accountA: input.accountA,
    accountB: input.accountB,
    limit: '20',
    cursor: input.cursor,
  }).toString()}`;
  const page = await queryApiFetchLive<OblCursorPage<unknown>>(path);
  return page ?? { items: [], hasMore: false, nextCursor: null };
}

export async function fetchOblLedgerTabPage(
  accountA: string,
  accountB: string,
  tab: RelationshipTab,
  cursor?: string,
): Promise<OblCursorPage<unknown>> {
  const params = new URLSearchParams({ limit: '20' });
  if (cursor) {
    params.set('cursor', cursor);
  }
  if (tab === 'payments') {
    return (await fetchOblLedgerPayments(accountA, accountB, params)) ?? {
      items: [],
      hasMore: false,
      nextCursor: null,
    };
  }
  if (tab === 'invoices') {
    return (await fetchOblLedgerInvoices(accountA, accountB, params)) ?? {
      items: [],
      hasMore: false,
      nextCursor: null,
    };
  }
  if (tab === 'contracts') {
    return (await fetchOblLedgerContracts(accountA, accountB, params)) ?? {
      items: [],
      hasMore: false,
      nextCursor: null,
    };
  }
  return (await fetchOblLedgerDisputes(accountA, accountB, params)) ?? {
    items: [],
    hasMore: false,
    nextCursor: null,
  };
}

export type RelationshipDetailInitialData = {
  balance: PairBalanceView;
  tabPages: Partial<Record<RelationshipTab, OblCursorPage<unknown>>>;
  contractLabels: OblContractApiRow[];
};

export async function loadRelationshipDetailInitial(
  accountA: string,
  accountB: string,
  tab: RelationshipTab,
): Promise<RelationshipDetailInitialData | null> {
  const balance = await fetchOblBalance(accountA, accountB);
  if (!balance) {
    return null;
  }
  const tabPages: Partial<Record<RelationshipTab, OblCursorPage<unknown>>> = {
    [tab]: await fetchOblLedgerTabPage(accountA, accountB, tab),
  };
  const contractLabels =
    (await fetchOblLedgerContracts(
      accountA,
      accountB,
      new URLSearchParams({ limit: '50' }),
    ))?.items ?? [];
  if (tab === 'invoices') {
    tabPages.disputes = await fetchOblLedgerTabPage(accountA, accountB, 'disputes');
  }
  if (tab === 'disputes') {
    tabPages.invoices = await fetchOblLedgerTabPage(accountA, accountB, 'invoices');
  }
  return { balance, tabPages, contractLabels };
}
