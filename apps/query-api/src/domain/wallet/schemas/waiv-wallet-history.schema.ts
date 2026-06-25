import { z } from 'zod';

import { ACTIVITY_DISPLAY_PAGE_SIZE, ACTIVITY_MAX_PAGE_SIZE } from '@opden-data-layer/core/hive-account-history';

export const waivWalletHistoryBodySchema = z.object({
  limit: z.number().int().min(1).max(ACTIVITY_MAX_PAGE_SIZE).optional(),
  cursor: z.string().min(1).optional(),
  showRewards: z.boolean().optional(),
});

export type WaivWalletHistoryBody = z.infer<typeof waivWalletHistoryBodySchema>;

export const waivWalletHistoryItemSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  operation: z.string(),
  kind: z.string(),
  source: z.enum(['rpc', 'swap', 'airdrop']),
  payload: z.record(z.string(), z.unknown()),
});

export const waivWalletHistoryResponseSchema = z.object({
  items: z.array(waivWalletHistoryItemSchema),
  cursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type WaivWalletHistoryResponse = z.infer<typeof waivWalletHistoryResponseSchema>;

export const WAIV_WALLET_HISTORY_DEFAULT_LIMIT = ACTIVITY_DISPLAY_PAGE_SIZE;
