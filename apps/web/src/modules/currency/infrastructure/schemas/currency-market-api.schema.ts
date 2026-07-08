import { z } from 'zod';

const tokenPricesSchema = z.object({
  usd: z.number(),
  btc: z.number(),
  usd_24h_change: z.number(),
  btc_24h_change: z.number(),
});

const marketRowSchema = z.object({
  hive: tokenPricesSchema,
  hive_dollar: tokenPricesSchema,
  type: z.string(),
  createdAt: z.unknown().optional(),
  updatedAt: z.unknown().optional(),
});

export const currencyMarketResponseSchema = z.object({
  current: marketRowSchema.passthrough(),
  weekly: z.array(marketRowSchema.passthrough()),
});

export type CurrencyMarketApiResponse = z.infer<typeof currencyMarketResponseSchema>;

const engineRatesPointSchema = z.object({
  dateString: z.string().optional(),
  base: z.string().optional(),
  rates: z.object({
    HIVE: z.number(),
    USD: z.number(),
  }),
  change24h: z
    .object({
      HIVE: z.number(),
      USD: z.number(),
    })
    .optional(),
});

export const currencyEngineRatesResponseSchema = z.object({
  current: engineRatesPointSchema.nullable(),
  weekly: z.array(z.record(z.string(), z.unknown())),
  error: z.string().optional(),
});

export type CurrencyEngineRatesApiResponse = z.infer<
  typeof currencyEngineRatesResponseSchema
>;

export const currencyMarketPanelResponseSchema = z.object({
  tokens: z.array(
    z.object({
      symbol: z.enum(['WAIV', 'HIVE', 'HBD']),
      usdPrice: z.number().nullable(),
      usdChangePercent: z.number().nullable(),
      showUsdChangePercent: z.boolean(),
      secondary: z
        .object({
          currency: z.string(),
          price: z.number(),
          changePercent: z.number(),
        })
        .nullable(),
      sparkline: z.array(
        z.object({
          label: z.string(),
          value: z.number(),
        }),
      ),
    }),
  ),
  fetchedAt: z.string(),
});

export type CurrencyMarketPanelApiResponse = z.infer<
  typeof currencyMarketPanelResponseSchema
>;
