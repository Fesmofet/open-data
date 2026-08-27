export function userProfilePath(username: string): string {
  return `/@${encodeURIComponent(username)}`;
}

export function postPath(author: string, permlink: string): string {
  return `/@${encodeURIComponent(author)}/${encodeURIComponent(permlink)}`;
}

export function objectPath(objectIdOrPermlink: string): string {
  return `/object/${encodeURIComponent(objectIdOrPermlink)}`;
}

export function objectActivityPath(objectId: string): string {
  return `/object/${encodeURIComponent(objectId)}/reviews/activity`;
}

export function objectUpdatePath(objectId: string, updateId: string): string {
  return `/object/${encodeURIComponent(objectId)}/updates/${encodeURIComponent(updateId)}`;
}

export function walletTransfersPath(
  username: string,
  type?: string,
): string {
  const base = `/@${encodeURIComponent(username)}/transfers`;
  if (!type) {
    return base;
  }
  return `${base}?type=${encodeURIComponent(type)}`;
}

export function inboxPath(username: string, channelId: string): string {
  return `/@${encodeURIComponent(username)}/messages?channel=${encodeURIComponent(channelId)}`;
}

export type WalletTabType = 'WAIV' | 'HIVE' | 'ENGINE';

/** Maps token/currency symbol to web wallet tab — legacy getWalletType parity. */
export function walletTabFromSymbol(symbol: string): WalletTabType {
  const currency = symbol.trim().toUpperCase();
  if (currency === 'WAIV' || currency === 'WP') {
    return 'WAIV';
  }
  if (
    currency === 'HIVE' ||
    currency === 'HP' ||
    currency === 'HBD' ||
    currency === 'VESTS'
  ) {
    return 'HIVE';
  }
  if (currency.length === 0) {
    return 'HIVE';
  }
  return 'ENGINE';
}

/** Parses "0.001 HIVE" / "1.616380 VESTS" amount strings. */
export function walletTabFromAmount(amount: string): WalletTabType {
  const parts = amount.trim().split(/\s+/);
  const currency = parts[1] ?? '';
  return walletTabFromSymbol(currency);
}
