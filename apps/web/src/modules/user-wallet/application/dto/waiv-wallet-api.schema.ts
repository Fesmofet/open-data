import { z } from 'zod';

export const waivWalletApiResponseSchema = z.object({
  account: z.string(),
  balance: z.object({
    liquid: z.string(),
    stake: z.string(),
    delegationsIn: z.string(),
    delegationsOut: z.string(),
    pendingUnstake: z.string(),
    pendingUndelegations: z.string(),
  }),
  display: z.object({
    liquidWaiv: z.string(),
    waivPower: z.string(),
    delegationsNet: z.string(),
    estAccountValueUsd: z.string(),
  }),
  flags: z.object({
    showDelegationsRow: z.boolean(),
    showPowerDownRow: z.boolean(),
  }),
  powerDown: z
    .object({
      nextUnstakeAt: z.number().nullable(),
    })
    .optional(),
  rates: z.object({
    waivHive: z.number(),
    waivUsd: z.number(),
  }),
});

export type WaivWalletApiResponse = z.infer<typeof waivWalletApiResponseSchema>;

export const engineTokenDelegationsApiResponseSchema = z.object({
  account: z.string(),
  symbol: z.string(),
  incoming: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      symbol: z.string(),
      quantity: z.string(),
      created: z.number(),
      updated: z.number(),
    }),
  ),
  outgoing: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      symbol: z.string(),
      quantity: z.string(),
      created: z.number(),
      updated: z.number(),
    }),
  ),
});

export type EngineTokenDelegationsApiResponse = z.infer<
  typeof engineTokenDelegationsApiResponseSchema
>;
