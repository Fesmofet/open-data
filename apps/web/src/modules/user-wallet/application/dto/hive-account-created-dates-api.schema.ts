import { z } from 'zod';

export const hiveAccountCreatedDatesRequestSchema = z.object({
  accounts: z.array(z.string().min(1)).min(1).max(20),
});

export type HiveAccountCreatedDatesRequest = z.infer<
  typeof hiveAccountCreatedDatesRequestSchema
>;

export const hiveAccountCreatedDatesResponseSchema = z.object({
  startDateYmd: z.string().nullable(),
  dates: z.record(z.string(), z.string().nullable()),
});

export type HiveAccountCreatedDatesResponseApi = z.infer<
  typeof hiveAccountCreatedDatesResponseSchema
>;

export type HiveAccountCreatedDatesResult =
  | { ok: true; data: HiveAccountCreatedDatesResponseApi }
  | { ok: false; error: 'invalid_body' | 'invalid_response' | 'unavailable' };
