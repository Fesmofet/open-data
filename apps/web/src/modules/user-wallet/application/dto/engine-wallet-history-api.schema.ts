import { z } from 'zod';

import {
  waivWalletHistoryPageQueryResultSchema,
  waivWalletHistoryResponseSchema,
} from './waiv-wallet-history-api.schema';

export const engineWalletHistoryResponseSchema = waivWalletHistoryResponseSchema.extend({
  items: z.array(
    z.object({
      id: z.string(),
      timestamp: z.string(),
      operation: z.string(),
      kind: z.string(),
      source: z.enum(['rpc', 'swap', 'airdrop', 'deposit']),
      payload: z.record(z.string(), z.unknown()),
    }),
  ),
});

export type EngineWalletHistoryResponseApi = z.infer<
  typeof engineWalletHistoryResponseSchema
>;

export const engineWalletHistoryPageQueryResultSchema =
  waivWalletHistoryPageQueryResultSchema;

export type EngineWalletHistoryPageQueryResult = z.infer<
  typeof engineWalletHistoryPageQueryResultSchema
>;
