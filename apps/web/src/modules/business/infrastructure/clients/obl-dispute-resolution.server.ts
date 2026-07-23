import 'server-only';

import {
  queryApiFetch,
  queryApiFetchLive,
} from '@/modules/user-profile/infrastructure/clients/query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

import type { DisputeResolutionStatus } from '../../domain/dispute-resolution-status-url';
import type {
  LedgerContractRow,
  LedgerDisputeRow,
  LedgerInvoiceRow,
} from '../../domain/ledger.types';
import type { OblCursorPage } from '../../domain/obl-pagination.types';

export type DisputeResolutionApiRow = {
  dispute: LedgerDisputeRow & {
    created_event_seq?: string;
    resolved_event_seq?: string | null;
    transaction_id?: string;
  };
  invoice: LedgerInvoiceRow & {
    created_event_seq?: string;
    transaction_id?: string;
  };
  contract: LedgerContractRow & {
    metadata?: Record<string, unknown>;
    created_event_seq?: string;
    transaction_id?: string;
  };
  offerName: string;
  pair: { provider: string; client: string };
};

export async function fetchOblDisputeResolution(
  account: string,
  input: {
    status: DisputeResolutionStatus;
    limit: number;
    cursor?: string;
  },
  live = false,
): Promise<OblCursorPage<DisputeResolutionApiRow> | null> {
  const params = new URLSearchParams({
    account,
    status: input.status,
    limit: String(input.limit),
  });
  if (input.cursor) {
    params.set('cursor', input.cursor);
  }
  const path = `/query/v1/obl/dispute-resolution?${params.toString()}`;
  const tags = [queryApiCacheTags.oblDisputeResolution(account, input.status)];
  if (live) {
    return queryApiFetchLive<OblCursorPage<DisputeResolutionApiRow>>(path);
  }
  return queryApiFetch<OblCursorPage<DisputeResolutionApiRow>>(path, {
    cacheTags: tags,
  });
}
