import { parseOblUsdAmount, type OblUsdAmountKind } from '@opden-data-layer/core';
import { z } from 'zod';

function oblUsdAmountSchema(kind: OblUsdAmountKind) {
  return z
    .union([z.number(), z.string()])
    .superRefine((value, ctx) => {
      if (parseOblUsdAmount(value, kind) === null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'invalid_amount_usd' });
      }
    })
    .transform((value) => parseOblUsdAmount(value, kind) as string);
}

export const oblPositiveUsdAmountSchema = oblUsdAmountSchema('positive');
export const oblNonNegativeUsdAmountSchema = oblUsdAmountSchema('nonnegative');
