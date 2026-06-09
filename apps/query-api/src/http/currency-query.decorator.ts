import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { SUPPORTED_CURRENCIES, type SupportedCurrency } from '@opden-data-layer/core';

function parseCurrency(raw: unknown): SupportedCurrency {
  const upper = String(raw ?? 'USD')
    .trim()
    .toUpperCase();
  if ((SUPPORTED_CURRENCIES as readonly string[]).includes(upper)) {
    return upper as SupportedCurrency;
  }
  return 'USD';
}

/** Reads `currency` from query string or JSON body; defaults to USD. */
export const ReqCurrency = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SupportedCurrency => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const fromQuery = req.query?.currency;
    const fromBody =
      req.body && typeof req.body === 'object'
        ? (req.body as { currency?: unknown }).currency
        : undefined;
    return parseCurrency(fromQuery ?? fromBody);
  },
);
