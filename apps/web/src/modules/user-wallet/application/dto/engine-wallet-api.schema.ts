import { z } from 'zod';

export const engineTokenBalanceRowApiSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  iconUrl: z.string().nullable(),
  balance: z.string(),
  stake: z.string(),
  stakingEnabled: z.boolean(),
  precision: z.number().int(),
  usdEstimate: z.number(),
  isPinned: z.boolean(),
});

export const engineWalletApiResponseSchema = z.object({
  account: z.string(),
  pinnedTokens: z.array(engineTokenBalanceRowApiSchema),
  tokens: z.array(engineTokenBalanceRowApiSchema),
  estimatedAccountValueUsd: z.number(),
  rates: z.object({
    hiveUsd: z.number(),
  }),
});

export type EngineWalletApiResponse = z.infer<typeof engineWalletApiResponseSchema>;
