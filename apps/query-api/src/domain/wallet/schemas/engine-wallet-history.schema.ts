import { z } from 'zod';

import {
  ACTIVITY_DISPLAY_PAGE_SIZE,
  ACTIVITY_MAX_PAGE_SIZE,
} from '@opden-data-layer/core/hive-account-history';

export const engineWalletHistoryBodySchema = z.object({
  limit: z.number().int().min(1).max(ACTIVITY_MAX_PAGE_SIZE).optional(),
  cursor: z.string().min(1).optional(),
});

export type EngineWalletHistoryBody = z.infer<typeof engineWalletHistoryBodySchema>;

export const engineWalletHistoryItemSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  operation: z.string(),
  kind: z.string(),
  source: z.enum(['rpc', 'swap']),
  payload: z.record(z.string(), z.unknown()),
});

export const engineWalletHistoryResponseSchema = z.object({
  items: z.array(engineWalletHistoryItemSchema),
  cursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type EngineWalletHistoryResponse = z.infer<
  typeof engineWalletHistoryResponseSchema
>;

export const ENGINE_WALLET_HISTORY_DEFAULT_LIMIT = ACTIVITY_DISPLAY_PAGE_SIZE;
