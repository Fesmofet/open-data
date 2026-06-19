import { z } from 'zod';

export const engineTokenDelegationItemSchema = z.object({
  from: z.string(),
  to: z.string(),
  symbol: z.string(),
  quantity: z.string(),
  created: z.number(),
  updated: z.number(),
});

export const engineTokenDelegationsResponseSchema = z.object({
  account: z.string(),
  symbol: z.string(),
  incoming: z.array(engineTokenDelegationItemSchema),
  outgoing: z.array(engineTokenDelegationItemSchema),
});

export type EngineTokenDelegationsResponse = z.infer<
  typeof engineTokenDelegationsResponseSchema
>;
