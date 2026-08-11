import { z } from 'zod';

export const WAIV_SYMBOL = 'WAIV';

export const waivWalletBalanceSchema = z.object({
  liquid: z.string(),
  stake: z.string(),
  delegationsIn: z.string(),
  delegationsOut: z.string(),
  pendingUnstake: z.string(),
  pendingUndelegations: z.string(),
});

export const waivWalletDisplaySchema = z.object({
  liquidWaiv: z.string(),
  waivPower: z.string(),
  delegationsNet: z.string(),
  estAccountValueUsd: z.string(),
});

export const waivWalletResponseSchema = z.object({
  account: z.string(),
  balance: waivWalletBalanceSchema,
  display: waivWalletDisplaySchema,
  flags: z.object({
    showDelegationsRow: z.boolean(),
    showPowerDownRow: z.boolean(),
  }),
  powerDown: z
    .object({
      nextUnstakeAt: z.number().nullable(),
      weeksRemaining: z.number(),
      weeksTotal: z.number(),
    })
    .optional(),
  rates: z.object({
    waivHive: z.number(),
    waivUsd: z.number(),
  }),
});

export type WaivWalletResponse = z.infer<typeof waivWalletResponseSchema>;
