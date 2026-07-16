import 'server-only';

import {
  queryApiFetch,
  queryApiFetchLive,
} from '@/modules/user-profile/infrastructure/clients/query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

import type { ArbitrationStatus } from '../../domain/arbitration-status-url';
import type {
  LedgerContractRow,
  LedgerDisputeRow,
  LedgerInvoiceRow,
} from '../../domain/ledger.types';
import type { OblCursorPage } from '../../domain/obl-pagination.types';

export type ArbitrationDisputeApiRow = {
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

export async function fetchOblArbitration(
  account: string,
  input: {
    status: ArbitrationStatus;
    limit: number;
    cursor?: string;
  },
  live = false,
): Promise<OblCursorPage<ArbitrationDisputeApiRow> | null> {
  const params = new URLSearchParams({
    account,
    status: input.status,
    limit: String(input.limit),
  });
  if (input.cursor) {
    params.set('cursor', input.cursor);
  }
  const path = `/query/v1/obl/arbitration?${params.toString()}`;
  const tags = [queryApiCacheTags.oblArbitration(account, input.status)];
  if (live) {
    return queryApiFetchLive<OblCursorPage<ArbitrationDisputeApiRow>>(path);
  }
  return queryApiFetch<OblCursorPage<ArbitrationDisputeApiRow>>(path, {
    cacheTags: tags,
  });
}
