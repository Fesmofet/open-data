import { z } from 'zod';

export const hiveEngineDepositPayloadSchema = z
  .object({
    author: z.string().min(1).max(32),
    destination: z.string().min(1).max(32),
    symbol_in: z.string().min(1).max(32),
    symbol_out: z.string().min(1).max(32),
    pair: z.string().min(1).max(512),
    ex_rate: z.number().finite(),
    memo: z.string().max(8192).optional(),
    deposit_account: z.string().min(1).max(32).optional(),
    address: z.string().min(1).max(256).optional(),
  })
  .superRefine((data, ctx) => {
    const hasAccount = Boolean(data.deposit_account?.trim());
    const hasAddress = Boolean(data.address?.trim());
    if (hasAccount === hasAddress) {
      ctx.addIssue({
        code: 'custom',
        message:
          'hive_engine_deposit: provide exactly one of deposit_account or address',
      });
    }
  });

export type HiveEngineDepositPayload = z.infer<
  typeof hiveEngineDepositPayloadSchema
>;

const oslEventSchema = z.object({
  action: z.enum(['hive_engine_deposit']),
  v: z.number().int().min(1),
  event_id: z.string().uuid().optional(),
  payload: z.record(z.string(), z.unknown()),
});

export const oslEnvelopeSchema = z.object({
  events: z.array(oslEventSchema).min(1),
});

export type OslEnvelope = z.infer<typeof oslEnvelopeSchema>;
