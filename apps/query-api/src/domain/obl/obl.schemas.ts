import { z } from 'zod';

export const OBL_OFFER_KINDS = ['offer', 'request'] as const;

export const createOblOfferDraftBodySchema = z.object({
  draftId: z.string().min(1).max(256).optional(),
  kind: z.enum(OBL_OFFER_KINDS),
  fields: z.record(z.string(), z.unknown()).default({}),
  legalText: z.string().max(65536).nullable().optional(),
});

export const patchOblOfferDraftBodySchema = z.object({
  kind: z.enum(OBL_OFFER_KINDS).optional(),
  fields: z.record(z.string(), z.unknown()).optional(),
  legalText: z.string().max(65536).nullable().optional(),
});

export const mutateOblOfferDraftQuerySchema = z.object({
  draftId: z.string().min(1).max(256),
});

export const searchOblOffersQuerySchema = z.object({
  q: z.string().max(256).optional(),
  kind: z.enum(OBL_OFFER_KINDS).optional(),
  tags: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t !== '')
        : undefined,
    ),
  author: z.string().min(1).max(32).optional(),
  status: z.enum(['active', 'retired', 'all']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const pairBalanceQuerySchema = z
  .object({
    accountA: z.string().min(1).max(32),
    accountB: z.string().min(1).max(32),
  })
  .refine(
    (data) => data.accountA.trim().toLowerCase() !== data.accountB.trim().toLowerCase(),
    { message: 'accountA and accountB must differ' },
  );

export const usdToWaivQuerySchema = z.object({
  amountUsd: z.coerce.number().positive(),
});

export const oblAccountQuerySchema = z.object({
  account: z.string().min(1).max(32),
});

export type CreateOblOfferDraftBody = z.infer<typeof createOblOfferDraftBodySchema>;
export type PatchOblOfferDraftBody = z.infer<typeof patchOblOfferDraftBodySchema>;
export type MutateOblOfferDraftQuery = z.infer<typeof mutateOblOfferDraftQuerySchema>;
export type SearchOblOffersQuery = z.infer<typeof searchOblOffersQuerySchema>;
export type PairBalanceQuery = z.infer<typeof pairBalanceQuerySchema>;
export type UsdToWaivQuery = z.infer<typeof usdToWaivQuerySchema>;
export type OblAccountQuery = z.infer<typeof oblAccountQuerySchema>;
