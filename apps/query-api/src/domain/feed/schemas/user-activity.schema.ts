import { z } from 'zod';
import {
  ACTIVITY_DISPLAY_PAGE_SIZE,
  ACTIVITY_FILTER_KEYS,
  ACTIVITY_MAX_PAGE_SIZE,
  type ActivityFilterKey,
} from '@opden-data-layer/core/hive-account-history';

const activityFilterKeySchema = z.enum(
  ACTIVITY_FILTER_KEYS as unknown as [ActivityFilterKey, ...ActivityFilterKey[]],
);

export const userActivityBodyFieldsSchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(ACTIVITY_MAX_PAGE_SIZE)
    .default(ACTIVITY_DISPLAY_PAGE_SIZE),
  cursor: z.string().optional(),
  filters: z
    .array(activityFilterKeySchema)
    .max(ACTIVITY_FILTER_KEYS.length)
    .optional()
    .default([]),
});

export const userActivityBodySchema = z.preprocess(
  (data) => (data === undefined || data === null ? {} : data),
  userActivityBodyFieldsSchema,
);

export type UserActivityBody = z.output<typeof userActivityBodyFieldsSchema>;
export type UserActivityBodyInput = z.input<typeof userActivityBodyFieldsSchema>;
