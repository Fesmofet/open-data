import { z } from 'zod';

const waivWalletHistoryItemApiSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  operation: z.string(),
  kind: z.string(),
  source: z.enum(['rpc', 'swap', 'airdrop']),
  payload: z.record(z.string(), z.unknown()),
});

export const waivWalletHistoryResponseSchema = z.object({
  items: z.array(waivWalletHistoryItemApiSchema),
  cursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type WaivWalletHistoryItemApi = z.infer<typeof waivWalletHistoryItemApiSchema>;
export type WaivWalletHistoryResponseApi = z.infer<typeof waivWalletHistoryResponseSchema>;

const waivAmountViewSchema = z.object({
  amount: z.string(),
  currency: z.string(),
  tone: z.enum(['positive', 'negative', 'neutral']),
  sign: z.enum(['+', '-', 'none']),
});

const waivWalletHistoryRowKindSchema = z.enum([
  'transfer',
  'power_up',
  'power_down_start',
  'power_down_stop',
  'power_down_done',
  'delegate',
  'undelegate_start',
  'undelegate_done',
  'market_trade',
  'market_order',
  'market_cancel',
  'market_expire',
  'market_close',
  'market_partial',
  'lottery',
  'mining',
  'pegged_deposit',
  'pegged_withdraw',
  'author_reward',
  'curation_reward',
  'beneficiary_reward',
  'swap',
  'airdrop',
  'generic',
]);

const waivWalletHistoryRowViewSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('transfer'),
    id: z.string(),
    timestamp: z.string(),
    direction: z.enum(['in', 'out', 'self']),
    amountView: waivAmountViewSchema,
    counterparty: z.string(),
    memo: z.string(),
  }),
  z.object({
    kind: z.literal('power_up'),
    id: z.string(),
    timestamp: z.string(),
    direction: z.enum(['in', 'out', 'self']),
    amountView: waivAmountViewSchema,
    counterparty: z.string(),
  }),
  z.object({
    kind: z.enum(['power_down_start', 'power_down_stop', 'power_down_done']),
    id: z.string(),
    timestamp: z.string(),
    amountView: waivAmountViewSchema,
  }),
  z.object({
    kind: z.literal('delegate'),
    id: z.string(),
    timestamp: z.string(),
    amountView: waivAmountViewSchema,
    counterparty: z.string(),
    isIncoming: z.boolean(),
  }),
  z.object({
    kind: z.literal('undelegate_start'),
    id: z.string(),
    timestamp: z.string(),
    amountView: waivAmountViewSchema,
    counterparty: z.string(),
    isIncoming: z.boolean(),
  }),
  z.object({
    kind: z.literal('undelegate_done'),
    id: z.string(),
    timestamp: z.string(),
    amountView: waivAmountViewSchema,
  }),
  z.object({
    kind: z.enum(['market_trade', 'market_partial']),
    id: z.string(),
    timestamp: z.string(),
    tokenAmount: waivAmountViewSchema,
    hiveAmount: waivAmountViewSchema,
    isBuy: z.boolean(),
    counterparty: z.string(),
    rateLabel: z.string().nullable(),
  }),
  z.object({
    kind: z.literal('market_order'),
    id: z.string(),
    timestamp: z.string(),
    orderType: z.enum(['buy', 'sell', 'marketbuy', 'marketsell']),
    isLimitOrder: z.boolean(),
    lockedAmountLabel: z.string(),
    otherAmountLabel: z.string().nullable(),
    priceLabel: z.string().nullable(),
  }),
  z.object({
    kind: z.enum(['market_cancel', 'market_expire']),
    id: z.string(),
    timestamp: z.string(),
    orderType: z.enum(['buy', 'sell']),
    amount: z.string(),
  }),
  z.object({
    kind: z.literal('market_close'),
    id: z.string(),
    timestamp: z.string(),
    orderType: z.enum(['buy', 'sell']),
  }),
  z.object({
    kind: z.enum(['lottery', 'mining']),
    id: z.string(),
    timestamp: z.string(),
    amountView: waivAmountViewSchema,
  }),
  z.object({
    kind: z.enum(['pegged_deposit', 'pegged_withdraw']),
    id: z.string(),
    timestamp: z.string(),
    amountView: waivAmountViewSchema,
  }),
  z.object({
    kind: z.enum(['author_reward', 'beneficiary_reward', 'curation_reward']),
    id: z.string(),
    timestamp: z.string(),
    amountView: waivAmountViewSchema,
    authorperm: z.string(),
  }),
  z.object({
    kind: z.literal('swap'),
    id: z.string(),
    timestamp: z.string(),
    symbolOut: z.string(),
    symbolIn: z.string(),
    quantityOut: z.string(),
    quantityIn: z.string(),
    rateLabel: z.string().nullable(),
  }),
  z.object({
    kind: z.literal('airdrop'),
    id: z.string(),
    timestamp: z.string(),
    amountView: waivAmountViewSchema,
    tokenState: z.string(),
  }),
  z.object({
    kind: z.literal('generic'),
    id: z.string(),
    timestamp: z.string(),
    operation: z.string(),
    amountView: waivAmountViewSchema.nullable(),
  }),
]);

export { waivWalletHistoryRowKindSchema };

const waivWalletHistoryPageViewSchema = z.object({
  items: z.array(waivWalletHistoryRowViewSchema),
  cursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export const waivWalletHistoryPageQueryResultSchema = z.object({
  page: waivWalletHistoryPageViewSchema,
  error: z.enum(['unavailable', 'invalid_response']).nullable(),
});
