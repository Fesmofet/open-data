import { z } from 'zod';

const activityItemApiSchema = z.object({
  id: z.string(),
  operationIndex: z.number(),
  trxId: z.string(),
  timestamp: z.string(),
  block: z.number(),
  type: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

export const userActivityResponseSchema = z.object({
  items: z.array(activityItemApiSchema),
  cursor: z.string().nullable(),
  hasMore: z.boolean(),
  chainContext: z.object({
    totalVestingShares: z.string(),
    totalVestingFundSteem: z.string(),
  }),
});

export type ActivityItemApi = z.infer<typeof activityItemApiSchema>;
export type UserActivityResponseApi = z.infer<typeof userActivityResponseSchema>;
