import { z } from 'zod';
import {
  ACTIVITY_DISPLAY_PAGE_SIZE,
  ACTIVITY_MAX_PAGE_SIZE,
} from '@opden-data-layer/core/hive-account-history';

export const userActivityBodyFieldsSchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(ACTIVITY_MAX_PAGE_SIZE)
    .default(ACTIVITY_DISPLAY_PAGE_SIZE),
  cursor: z.string().optional(),
});

export const userActivityBodySchema = z.preprocess(
  (data) => (data === undefined || data === null ? {} : data),
  userActivityBodyFieldsSchema,
);

export type UserActivityBody = z.infer<typeof userActivityBodyFieldsSchema>;
