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
  unstakingCooldown: z.coerce.number().int().nonnegative().optional().default(0),
  numberTransactions: z.coerce.number().int().nonnegative().optional().default(0),
});

export const engineWalletApiResponseSchema = z.object({
  account: z.string(),
  pinnedTokens: z.array(engineTokenBalanceRowApiSchema),
  tokens: z.array(engineTokenBalanceRowApiSchema),
  powerEligibleTokens: z
    .array(engineTokenBalanceRowApiSchema)
    .optional()
    .default([]),
  estimatedAccountValueUsd: z.number(),
  rates: z.object({
    hiveUsd: z.number(),
  }),
});

export type EngineWalletApiResponse = z.infer<typeof engineWalletApiResponseSchema>;
