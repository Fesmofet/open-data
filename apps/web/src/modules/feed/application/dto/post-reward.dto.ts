import { z } from 'zod';

export const moneyLineSchema = z.object({
  amount: z.number(),
  currency: z.string(),
  label: z.string(),
});

export const postRewardBeneficiarySchema = z.object({
  account: z.string(),
  percent: z.number(),
  payout: moneyLineSchema.optional(),
});

export const postRewardBreakdownSchema = z.object({
  waiv: moneyLineSchema,
  hive: moneyLineSchema,
  hbd: moneyLineSchema,
  total: moneyLineSchema,
  authorPayout: moneyLineSchema.optional(),
  curatorPayout: moneyLineSchema.optional(),
});

export const postRewardSchema = z.object({
  amount: z.number(),
  currency: z.string(),
  label: z.string(),
  phase: z.enum(['potential', 'paid']),
  breakdown: postRewardBreakdownSchema,
  beneficiaries: z.array(postRewardBeneficiarySchema).optional(),
  cashoutAt: z.string().optional(),
  isPayoutDeclined: z.boolean().optional(),
  payoutLimitHit: z.boolean().optional(),
  promotionCost: moneyLineSchema.optional(),
  rewardPowerOnly: z.boolean().optional(),
});

export type MoneyLineView = z.infer<typeof moneyLineSchema>;
export type PostRewardView = z.infer<typeof postRewardSchema>;
