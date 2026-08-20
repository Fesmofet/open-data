import type { HiveEngineAccountHistoryEntry } from '@opden-data-layer/clients';
import { HiveEngineSwap, HiveEngineWaivAirdrop, HiveEngineDepositRecord } from '@opden-data-layer/odl-db-types';

import {
  classifyWaivEngineOperation,
  WAIV_WALLET_HISTORY_AIRDROP_OP,
  WAIV_WALLET_HISTORY_DEPOSIT_OP,
  WAIV_WALLET_HISTORY_SWAP_OP,
  type WaivWalletHistoryRowKind,
} from '@opden-data-layer/core/hive-engine-history';
import {
  divideNumericStrings,
  multiplyNumericStrings,
  WAIV_FRACTION_PRECISION,
} from '@opden-data-layer/core/utils/numeric-string';

import type { WaivWalletHistorySource } from './waiv-wallet-history-cursor';

export type WaivWalletHistoryItemDto = {
  id: string;
  timestamp: string;
  operation: string;
  kind: WaivWalletHistoryRowKind;
  source: WaivWalletHistorySource;
  payload: Record<string, unknown>;
};

function toIsoTimestampFromUnixSeconds(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

function toIsoTimestampFromDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function buildRpcHistoryTieIdParts(params: {
  transactionId: string;
  operation: string;
  authorperm?: string;
  quantity?: string;
  from?: string;
  to?: string;
}): string {
  const txId = params.transactionId || 'unknown';
  const op = params.operation;
  const authorperm = asTrimmedString(params.authorperm);
  const quantity = asTrimmedString(params.quantity);
  const from = asTrimmedString(params.from);
  const to = asTrimmedString(params.to);
  if (authorperm) {
    return `${txId}:${op}:${authorperm}:${quantity}`;
  }
  if (from || to) {
    return `${txId}:${op}:${from}:${to}:${quantity}`;
  }
  if (quantity) {
    return `${txId}:${op}:${quantity}`;
  }
  return `${txId}:${op}`;
}

/**
 * Unique per Hive Engine history row. Reward ops often share transactionId + operation
 * within one block — include authorperm and quantity. Transfers can share amount in one tx.
 */
export function buildRpcHistoryTieId(entry: HiveEngineAccountHistoryEntry): string {
  return buildRpcHistoryTieIdParts({
    transactionId: entry.transactionId ?? 'unknown',
    operation: entry.operation,
    authorperm: asTrimmedString(entry.authorperm),
    quantity: asTrimmedString(entry.quantity),
    from: asTrimmedString(entry.from),
    to: asTrimmedString(entry.to),
  });
}

function rpcTieIdFromPayload(
  operation: string,
  payload: Record<string, unknown>,
): string {
  return buildRpcHistoryTieIdParts({
    transactionId: asTrimmedString(payload.transactionId) || 'unknown',
    operation,
    authorperm: asTrimmedString(payload.authorperm),
    quantity: asTrimmedString(payload.quantity),
    from: asTrimmedString(payload.from),
    to: asTrimmedString(payload.to),
  });
}

function rpcTieId(entry: HiveEngineAccountHistoryEntry): string {
  return buildRpcHistoryTieId(entry);
}

const MARKET_TRADE_PRICE_OPS = new Set([
  'market_buy',
  'market_sell',
  'market_buyRemaining',
  'market_sellRemaining',
]);

function computeMarketTradePrice(payload: Record<string, unknown>): string | null {
  const hive = String(payload.quantityHive ?? '').trim();
  const tokens = String(payload.quantityTokens ?? payload.quantity ?? '').trim();
  return divideNumericStrings(hive, tokens, WAIV_FRACTION_PRECISION);
}

function enrichMarketPlaceOrderPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const orderType = String(payload.orderType ?? '').toLowerCase();
  const quantityLocked = String(payload.quantityLocked ?? '').trim();
  const price = String(payload.price ?? '').trim();
  const existingQuantity = String(payload.quantity ?? '').trim();

  if (existingQuantity) {
    return payload;
  }

  if (!quantityLocked || !price) {
    return payload;
  }

  if (orderType === 'buy') {
    const quantity = divideNumericStrings(
      quantityLocked,
      price,
      WAIV_FRACTION_PRECISION,
    );
    return quantity ? { ...payload, quantity } : payload;
  }

  if (orderType === 'sell') {
    const quantity = multiplyNumericStrings(
      quantityLocked,
      price,
      WAIV_FRACTION_PRECISION,
    );
    return quantity ? { ...payload, quantity } : payload;
  }

  return payload;
}

function enrichMarketTradePayload(
  payload: Record<string, unknown>,
  operation: string,
): Record<string, unknown> {
  if (!MARKET_TRADE_PRICE_OPS.has(operation)) {
    return payload;
  }
  const existing = payload.price;
  if (existing !== undefined && existing !== null && String(existing).trim() !== '') {
    return payload;
  }
  const computed = computeMarketTradePrice(payload);
  if (!computed) {
    return payload;
  }
  return { ...payload, price: computed };
}

function enrichRpcPayload(
  payload: Record<string, unknown>,
  operation: string,
): Record<string, unknown> {
  if (operation === 'market_placeOrder') {
    return enrichMarketPlaceOrderPayload(payload);
  }
  return enrichMarketTradePayload(payload, operation);
}

function pickPayload(entry: HiveEngineAccountHistoryEntry): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    account: entry.account,
    quantity: entry.quantity,
    symbol: entry.symbol,
  };
  if (entry.authorperm !== undefined) {
    payload.authorperm = entry.authorperm;
  }
  if (entry.to !== undefined) {
    payload.to = entry.to;
  }
  if (entry.from !== undefined) {
    payload.from = entry.from;
  }
  if (entry.memo !== undefined) {
    payload.memo = entry.memo;
  }
  if (entry.price !== undefined) {
    payload.price = entry.price;
  }
  if (entry.orderType !== undefined) {
    payload.orderType = entry.orderType;
  }
  if (entry.quantityHive !== undefined) {
    payload.quantityHive = entry.quantityHive;
  }
  if (entry.quantityTokens !== undefined) {
    payload.quantityTokens = entry.quantityTokens;
  }
  if (entry.quantityLocked !== undefined) {
    payload.quantityLocked = entry.quantityLocked;
  }
  if (entry.quantityReturned !== undefined) {
    payload.quantityReturned = entry.quantityReturned;
  }
  if (entry.quantityUnlocked !== undefined) {
    payload.quantityUnlocked = entry.quantityUnlocked;
  }
  if (entry.transactionId !== undefined) {
    payload.transactionId = entry.transactionId;
  }
  if (entry.blockNumber !== undefined) {
    payload.blockNumber = entry.blockNumber;
  }
  return payload;
}

export function mapRpcHistoryEntry(
  entry: HiveEngineAccountHistoryEntry,
): WaivWalletHistoryItemDto {
  const operation = entry.operation;
  return {
    id: `rpc:${rpcTieId(entry)}`,
    timestamp: toIsoTimestampFromUnixSeconds(entry.timestamp),
    operation,
    kind: classifyWaivEngineOperation(operation),
    source: 'rpc',
    payload: enrichRpcPayload(pickPayload(entry), operation),
  };
}

export function mapSwapRow(row: HiveEngineSwap): WaivWalletHistoryItemDto {
  const id = String(row.id);
  return {
    id: `swap:${id}`,
    timestamp: toIsoTimestampFromDate(row.block_timestamp),
    operation: WAIV_WALLET_HISTORY_SWAP_OP,
    kind: 'swap',
    source: 'swap',
    payload: {
      account: row.account,
      transactionId: row.transaction_id,
      symbolIn: row.symbol_in,
      symbolOut: row.symbol_out,
      symbolInQuantity: row.symbol_in_quantity,
      symbolOutQuantity: row.symbol_out_quantity,
      blockNumber: row.block_number,
    },
  };
}

export function mapAirdropRow(row: HiveEngineWaivAirdrop): WaivWalletHistoryItemDto {
  const id = String(row.id);
  return {
    id: `airdrop:${id}`,
    timestamp: toIsoTimestampFromDate(row.block_timestamp),
    operation: WAIV_WALLET_HISTORY_AIRDROP_OP,
    kind: 'airdrop',
    source: 'airdrop',
    payload: {
      account: row.account,
      quantity: row.quantity,
      symbol: 'WAIV',
      tokenState: row.token_state,
      transactionId: row.transaction_id,
      blockNumber: row.block_number,
    },
  };
}

export function mapDepositRecordRow(
  row: HiveEngineDepositRecord,
): WaivWalletHistoryItemDto {
  const id = String(row.id);
  return {
    id: `deposit:${id}`,
    timestamp: toIsoTimestampFromDate(row.block_timestamp),
    operation: WAIV_WALLET_HISTORY_DEPOSIT_OP,
    kind: 'deposit_instruction',
    source: 'deposit',
    payload: {
      account: row.account,
      destination: row.destination,
      symbolIn: row.symbol_in,
      symbolOut: row.symbol_out,
      pair: row.pair,
      exRate: row.ex_rate,
      depositAccount: row.deposit_account,
      address: row.address,
      memo: row.memo,
      transactionId: row.transaction_id,
    },
  };
}

export function itemCursorParts(
  item: WaivWalletHistoryItemDto,
): { timestamp: number; tieId: string; source: WaivWalletHistorySource } {
  const timestamp = Math.floor(new Date(item.timestamp).getTime() / 1000);
  if (item.source === 'rpc') {
    return {
      timestamp,
      tieId: rpcTieIdFromPayload(item.operation, item.payload),
      source: 'rpc',
    };
  }
  const id = item.id.split(':')[1] ?? item.id;
  return { timestamp, tieId: id, source: item.source };
}
