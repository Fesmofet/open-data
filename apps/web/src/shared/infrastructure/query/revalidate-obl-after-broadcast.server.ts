'use server';

import { updateTag } from 'next/cache';

import { queryApiCacheTags } from './query-api-cache-tags';

export async function revalidateOblAfterBroadcast(
  account: string,
  counterparty?: string,
  options?: {
    contractId?: string;
    discover?: boolean;
    drafts?: boolean;
    refreshArbitration?: boolean;
    ledgerPairs?: Array<{ accountA: string; accountB: string }>;
  },
): Promise<void> {
  updateTag(queryApiCacheTags.oblOffers(account));
  updateTag(queryApiCacheTags.oblRelationships(account));
  if (options?.drafts !== false) {
    updateTag(queryApiCacheTags.oblDrafts(account));
  }
  if (options?.discover !== false) {
    updateTag(queryApiCacheTags.oblDiscover('offer::'));
    updateTag(queryApiCacheTags.oblDiscover('request::'));
    updateTag(queryApiCacheTags.oblDiscover('all::'));
  }
  if (counterparty) {
    updateTag(queryApiCacheTags.oblLedger(account, counterparty));
  }
  if (options?.contractId) {
    updateTag(queryApiCacheTags.oblContract(options.contractId));
  }
  if (options?.refreshArbitration) {
    updateTag(queryApiCacheTags.oblArbitration(account, 'open'));
    updateTag(queryApiCacheTags.oblArbitration(account, 'resolved'));
  }
  if (options?.ledgerPairs) {
    for (const pair of options.ledgerPairs) {
      updateTag(queryApiCacheTags.oblLedger(pair.accountA, pair.accountB));
      updateTag(queryApiCacheTags.oblRelationships(pair.accountA));
      updateTag(queryApiCacheTags.oblRelationships(pair.accountB));
    }
  }
}
