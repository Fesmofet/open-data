import { z } from 'zod';

const hiveAccountNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(16)
  .transform((value) => value.toLowerCase());

export const hiveAccountCreatedDatesBodySchema = z.object({
  accounts: z
    .array(hiveAccountNameSchema)
    .min(1)
    .max(20)
    .transform((accounts) => [...new Set(accounts)]),
});

export type HiveAccountCreatedDatesBody = z.infer<
  typeof hiveAccountCreatedDatesBodySchema
>;

export const hiveAccountCreatedDatesResponseSchema = z.object({
  startDateYmd: z.string().nullable(),
  dates: z.record(z.string(), z.string().nullable()),
});

export type HiveAccountCreatedDatesResponse = z.infer<
  typeof hiveAccountCreatedDatesResponseSchema
>;
