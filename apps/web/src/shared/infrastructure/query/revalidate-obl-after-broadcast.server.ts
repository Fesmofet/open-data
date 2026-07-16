'use server';

import { updateTag } from 'next/cache';

import { queryApiCacheTags } from './query-api-cache-tags';

export async function revalidateOblAfterBroadcast(
  account: string,
  counterparty?: string,
): Promise<void> {
  updateTag(queryApiCacheTags.oblOffers(account));
  updateTag(queryApiCacheTags.oblRelationships(account));
  if (counterparty) {
    updateTag(queryApiCacheTags.oblLedger(account, counterparty));
  }
}
