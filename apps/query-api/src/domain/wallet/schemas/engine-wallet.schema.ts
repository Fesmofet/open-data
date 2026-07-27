import { z } from 'zod';

export const engineTokenBalanceRowSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  iconUrl: z.string().nullable(),
  balance: z.string(),
  stake: z.string(),
  stakingEnabled: z.boolean(),
  precision: z.number().int(),
  usdEstimate: z.number(),
  isPinned: z.boolean(),
  unstakingCooldown: z.number().int().nonnegative(),
  numberTransactions: z.number().int().nonnegative(),
});

export const engineWalletResponseSchema = z.object({
  account: z.string(),
  pinnedTokens: z.array(engineTokenBalanceRowSchema),
  tokens: z.array(engineTokenBalanceRowSchema),
  powerEligibleTokens: z.array(engineTokenBalanceRowSchema),
  estimatedAccountValueUsd: z.number(),
  rates: z.object({
    hiveUsd: z.number(),
  }),
});

export type EngineTokenBalanceRow = z.infer<typeof engineTokenBalanceRowSchema>;
export type EngineWalletResponse = z.infer<typeof engineWalletResponseSchema>;
