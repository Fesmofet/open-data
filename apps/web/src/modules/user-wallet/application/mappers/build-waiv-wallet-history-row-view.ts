import type { WaivWalletHistoryItemApi } from '../dto/waiv-wallet-history-api.schema';
import type {
  WaivAmountSign,
  WaivAmountTone,
  WaivAmountView,
  WaivMarketOrderType,
  WaivWalletHistoryRowView,
} from '../../domain/types/waiv-wallet-history-view';
import {
  divideNumericStrings,
  formatWalletHistoryAmountLabel,
  formatWalletHistoryQuantity,
  WAIV_FRACTION_PRECISION,
} from '../../domain/waiv-wallet-history-amount-format';

function asString(value: unknown): string {
  return typeof value === 'string' ? value : value != null ? String(value) : '';
}

function toPowerSymbol(symbol: string): string {
  return symbol === 'WAIV' ? 'WP' : symbol;
}

function amountView(
  quantity: unknown,
  currency: string,
  tone: WaivAmountTone,
  sign: WaivAmountSign,
): WaivAmountView {
  return {
    amount: formatWalletHistoryQuantity(quantity),
    currency,
    tone,
    sign,
  };
}

function formatAmount(quantity: unknown, symbol: unknown): string {
  return formatWalletHistoryAmountLabel(quantity, symbol);
}

function normalizeMarketOrderType(orderType: unknown): WaivMarketOrderType {
  const raw = asString(orderType).toLowerCase();
  if (raw === 'buy' || raw === 'sell' || raw === 'marketbuy' || raw === 'marketsell') {
    return raw;
  }
  if (raw === 'market_buy') {
    return 'marketbuy';
  }
  if (raw === 'market_sell') {
    return 'marketsell';
  }
  return 'buy';
}

function normalizeLimitOrderSide(orderType: WaivMarketOrderType): 'buy' | 'sell' {
  return orderType === 'sell' || orderType === 'marketsell' ? 'sell' : 'buy';
}

function formatSwapRateLabel(
  quantityOut: unknown,
  quantityIn: unknown,
  symbolOut: string,
  symbolIn: string,
): string | null {
  const rate = divideNumericStrings(
    asString(quantityOut),
    asString(quantityIn),
    3,
  );
  if (!rate) {
    return null;
  }
  const formatted = formatWalletHistoryQuantity(rate);
  if (!formatted) {
    return null;
  }
  return `${formatted} ${symbolOut} per ${symbolIn}`;
}

function resolveMarketTradePrice(
  price: unknown,
  quantityHive: unknown,
  quantityTokens: unknown,
  quantity: unknown,
): string | null {
  const direct = asString(price).trim();
  if (direct && Number.isFinite(Number.parseFloat(direct))) {
    return direct;
  }
  return divideNumericStrings(
    asString(quantityHive),
    asString(quantityTokens || quantity),
    WAIV_FRACTION_PRECISION,
  );
}

function formatMarketTradeRateLabel(
  price: unknown,
  symbol: string,
  quantityHive: unknown,
  quantityTokens: unknown,
  quantity: unknown,
): string | null {
  const raw = resolveMarketTradePrice(
    price,
    quantityHive,
    quantityTokens,
    quantity,
  );
  if (!raw) {
    return null;
  }
  const formatted = formatWalletHistoryQuantity(raw);
  if (!formatted) {
    return null;
  }
  return `${formatted} per ${symbol}`;
}

function buildMarketOrderView(
  base: { id: string; timestamp: string },
  payload: Record<string, unknown>,
): WaivWalletHistoryRowView {
  const orderType = normalizeMarketOrderType(payload.orderType);
  const isLimitOrder = orderType === 'buy' || orderType === 'sell';
  const symbol = asString(payload.symbol) || 'WAIV';
  const quantityLocked = payload.quantityLocked ?? payload.quantity;
  const quantity = payload.quantity ?? payload.quantityLocked;
  const price = payload.price;

  if (isLimitOrder) {
    const side = normalizeLimitOrderSide(orderType);
    const lockedSymbol = side === 'buy' ? 'SWAP.HIVE' : symbol;
    const otherSymbol = side === 'buy' ? symbol : 'SWAP.HIVE';
    const priceSymbol = side === 'buy' ? symbol : 'SWAP.HIVE';
    const priceRaw = asString(price).trim();
    const priceLabel =
      priceRaw && Number.isFinite(Number.parseFloat(priceRaw))
        ? `${formatWalletHistoryQuantity(priceRaw)} per ${priceSymbol}`
        : null;

    return {
      ...base,
      kind: 'market_order',
      orderType,
      isLimitOrder: true,
      lockedAmountLabel: formatAmount(quantityLocked, lockedSymbol),
      otherAmountLabel: formatAmount(quantity, otherSymbol),
      priceLabel,
    };
  }

  const lockedSymbol =
    orderType === 'marketbuy' ? 'SWAP.HIVE' : symbol;

  return {
    ...base,
    kind: 'market_order',
    orderType,
    isLimitOrder: false,
    lockedAmountLabel: formatAmount(quantityLocked ?? quantity, lockedSymbol),
    otherAmountLabel: null,
    priceLabel: null,
  };
}

function parseAuthorPermlink(authorperm: unknown): { author: string; permlink: string } {
  const raw = asString(authorperm).trim();
  const withoutAt = raw.startsWith('@') ? raw.slice(1) : raw;
  const slash = withoutAt.indexOf('/');
  if (slash <= 0) {
    return { author: withoutAt, permlink: '' };
  }
  return {
    author: withoutAt.slice(0, slash),
    permlink: withoutAt.slice(slash + 1),
  };
}

export function buildWaivWalletHistoryRowView(
  item: WaivWalletHistoryItemApi,
  profileAccount: string,
): WaivWalletHistoryRowView {
  const profile = profileAccount.trim().toLowerCase();
  const p = item.payload;
  const base = { id: item.id, timestamp: item.timestamp };
  const symbol = asString(p.symbol) || 'WAIV';

  switch (item.kind) {
    case 'transfer': {
      const to = asString(p.to).toLowerCase();
      const from = asString(p.from).toLowerCase();
      const isSelf = from === to && from === profile;
      const direction = isSelf ? 'self' : to === profile ? 'in' : 'out';
      const amountTone: WaivAmountTone =
        direction === 'in' ? 'positive' : direction === 'out' ? 'negative' : 'neutral';
      const amountSign: WaivAmountSign =
        direction === 'in' ? '+' : direction === 'out' ? '-' : 'none';
      return {
        ...base,
        kind: 'transfer',
        direction,
        amountView: amountView(p.quantity, symbol, amountTone, amountSign),
        counterparty: to === profile ? asString(p.from) : asString(p.to),
        memo: asString(p.memo),
      };
    }
    case 'power_up': {
      const to = asString(p.to).toLowerCase();
      const from = asString(p.from).toLowerCase();
      const fromName = asString(p.from);
      const toName = asString(p.to);
      const isSelf = to === from;

      if (isSelf) {
        return {
          ...base,
          kind: 'power_up',
          direction: 'self',
          amountView: amountView(p.quantity, toPowerSymbol(symbol), 'neutral', 'none'),
          counterparty: fromName,
        };
      }

      const isReceiver = to === profile;
      return {
        ...base,
        kind: 'power_up',
        direction: isReceiver ? 'in' : 'out',
        amountView: amountView(
          p.quantity,
          isReceiver ? toPowerSymbol(symbol) : symbol,
          isReceiver ? 'positive' : 'negative',
          isReceiver ? '+' : '-',
        ),
        counterparty: isReceiver ? fromName : toName,
      };
    }
    case 'power_down_start':
    case 'power_down_stop':
    case 'power_down_done':
      return {
        ...base,
        kind: item.kind,
        amountView: amountView(p.quantity, toPowerSymbol(symbol), 'neutral', 'none'),
      };
    case 'delegate': {
      const to = asString(p.to).toLowerCase();
      const isIncoming = profile === to;
      return {
        ...base,
        kind: 'delegate',
        amountView: amountView(p.quantity, 'WP', 'neutral', isIncoming ? '+' : '-'),
        counterparty: isIncoming ? asString(p.from) : asString(p.to),
        isIncoming,
      };
    }
    case 'undelegate_start': {
      const to = asString(p.to).toLowerCase();
      const isIncoming = profile !== to;
      return {
        ...base,
        kind: 'undelegate_start',
        amountView: amountView(p.quantity, 'WP', 'neutral', isIncoming ? '-' : '+'),
        counterparty: isIncoming ? asString(p.to) : asString(p.from),
        isIncoming,
      };
    }
    case 'undelegate_done':
      return {
        ...base,
        kind: 'undelegate_done',
        amountView: amountView(p.quantity, 'WP', 'neutral', 'none'),
      };
    case 'market_trade':
    case 'market_partial': {
      const orderType = asString(p.orderType).toLowerCase();
      const isBuy =
        item.operation === 'market_buy' ||
        item.operation === 'market_buyRemaining' ||
        orderType === 'buy';
      const tokenSymbol = symbol;
      const counterparty = isBuy ? asString(p.from) : asString(p.to);
      return {
        ...base,
        kind: item.kind,
        tokenAmount: amountView(
          p.quantity ?? p.quantityTokens,
          tokenSymbol,
          isBuy ? 'positive' : 'negative',
          isBuy ? '+' : '-',
        ),
        hiveAmount: amountView(
          p.quantityHive,
          'SWAP.HIVE',
          isBuy ? 'negative' : 'positive',
          isBuy ? '-' : '+',
        ),
        isBuy,
        counterparty,
        rateLabel: formatMarketTradeRateLabel(
          p.price,
          tokenSymbol,
          p.quantityHive,
          p.quantityTokens,
          p.quantity,
        ),
      };
    }
    case 'market_order':
      return buildMarketOrderView(base, p);
    case 'market_cancel':
    case 'market_expire': {
      const orderType = normalizeLimitOrderSide(normalizeMarketOrderType(p.orderType));
      const quantity =
        item.kind === 'market_expire'
          ? p.quantityUnlocked ?? p.quantity
          : p.quantityReturned ?? p.quantity ?? p.quantityLocked;
      return {
        ...base,
        kind: item.kind,
        orderType,
        amount: formatAmount(quantity, p.symbol || symbol),
      };
    }
    case 'market_close':
      return {
        ...base,
        kind: 'market_close',
        orderType: normalizeLimitOrderSide(normalizeMarketOrderType(p.orderType)),
      };
    case 'lottery':
    case 'mining':
      return {
        ...base,
        kind: item.kind,
        amountView: amountView(p.quantity, symbol, 'positive', '+'),
      };
    case 'pegged_deposit':
      return {
        ...base,
        kind: 'pegged_deposit',
        amountView: amountView(p.quantity, symbol, 'positive', '+'),
      };
    case 'pegged_withdraw':
      return {
        ...base,
        kind: 'pegged_withdraw',
        amountView: amountView(p.quantity, symbol, 'negative', '-'),
      };
    case 'author_reward':
    case 'beneficiary_reward':
    case 'curation_reward':
      return {
        ...base,
        kind: item.kind,
        amountView: amountView(p.quantity, symbol, 'positive', '+'),
        authorperm: asString(p.authorperm),
      };
    case 'swap': {
      const symbolOut = asString(p.symbolOut);
      const symbolIn = asString(p.symbolIn);
      const quantityOut = formatWalletHistoryQuantity(p.symbolOutQuantity);
      const quantityIn = formatWalletHistoryQuantity(p.symbolInQuantity);
      return {
        ...base,
        kind: 'swap',
        symbolOut,
        symbolIn,
        quantityOut,
        quantityIn,
        rateLabel: formatSwapRateLabel(
          p.symbolOutQuantity,
          p.symbolInQuantity,
          symbolOut,
          symbolIn,
        ),
      };
    }
    case 'airdrop':
      return {
        ...base,
        kind: 'airdrop',
        amountView: amountView(p.quantity, 'WP', 'positive', '+'),
        tokenState: asString(p.tokenState),
      };
    default: {
      const qty = asString(p.quantity);
      return {
        ...base,
        kind: 'generic',
        operation: item.operation,
        amountView: qty
          ? amountView(p.quantity, symbol, 'neutral', 'none')
          : null,
      };
    }
  }
}

export function buildWaivWalletHistoryPageViews(
  items: WaivWalletHistoryItemApi[],
  profileAccount: string,
): WaivWalletHistoryRowView[] {
  return items.map((item) => buildWaivWalletHistoryRowView(item, profileAccount));
}

export { parseAuthorPermlink };
