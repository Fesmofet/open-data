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
  limit: z.coerce.number().int().min(1).max(50).default(20),
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

export const oblPaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const oblCursorListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(256).optional(),
});

export const listOblRelationshipsQuerySchema = oblAccountQuerySchema.extend(
  oblPaginationQuerySchema.shape,
);

export const oblLedgerListQuerySchema = pairBalanceQuerySchema.and(
  oblCursorListQuerySchema,
);

export const listOblOfferDraftsQuerySchema = oblPaginationQuerySchema;

export const OBL_ARBITRATION_STATUSES = ['open', 'resolved'] as const;

export const listOblArbitrationQuerySchema = oblAccountQuerySchema.extend({
  status: z.enum(OBL_ARBITRATION_STATUSES).default('open'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(256).optional(),
});

export const listOblDisputeResolutionQuerySchema = oblAccountQuerySchema.extend({
  status: z.enum(OBL_ARBITRATION_STATUSES).default('open'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(256).optional(),
});

export type CreateOblOfferDraftBody = z.infer<typeof createOblOfferDraftBodySchema>;
export type PatchOblOfferDraftBody = z.infer<typeof patchOblOfferDraftBodySchema>;
export type MutateOblOfferDraftQuery = z.infer<typeof mutateOblOfferDraftQuerySchema>;
export type SearchOblOffersQuery = z.infer<typeof searchOblOffersQuerySchema>;
export type PairBalanceQuery = z.infer<typeof pairBalanceQuerySchema>;
export type UsdToWaivQuery = z.infer<typeof usdToWaivQuerySchema>;
export type OblAccountQuery = z.infer<typeof oblAccountQuerySchema>;
export type OblPaginationQuery = z.infer<typeof oblPaginationQuerySchema>;
export type OblCursorListQuery = z.infer<typeof oblCursorListQuerySchema>;
export type ListOblRelationshipsQuery = z.infer<typeof listOblRelationshipsQuerySchema>;
export type OblLedgerListQuery = z.infer<typeof oblLedgerListQuerySchema>;
export type ListOblOfferDraftsQuery = z.infer<typeof listOblOfferDraftsQuerySchema>;
export type ListOblArbitrationQuery = z.infer<typeof listOblArbitrationQuerySchema>;
export type ListOblDisputeResolutionQuery = z.infer<typeof listOblDisputeResolutionQuerySchema>;
