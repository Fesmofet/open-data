import type { WithdrawListToken } from './withdraw-modal-defaults';

export type ParsedPaymentQr = {
  address: string;
  scheme: string | null;
  amount: number | null;
};

/** Port of legacy QrModal handleAccept parsing. */
export function parsePaymentQrUri(raw: string): ParsedPaymentQr {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { address: '', scheme: null, amount: null };
  }
  if (!trimmed.includes(':')) {
    return { address: trimmed, scheme: null, amount: null };
  }
  const scheme = trimmed.split(':')[0]?.trim().toLowerCase() ?? null;
  const afterScheme = trimmed.split(':').slice(1).join(':');
  const [addressPart, queryPart] = afterScheme.split('?');
  const address = addressPart?.trim() ?? '';
  let amount: number | null = null;
  if (queryPart) {
    const params = new URLSearchParams(
      queryPart.startsWith('?') ? queryPart : `?${queryPart}`,
    );
    const amountRaw = params.get('amount');
    if (amountRaw) {
      const parsed = Number.parseFloat(amountRaw);
      amount = Number.isFinite(parsed) ? parsed : null;
    }
  }
  return { address, scheme, amount };
}

export type QrSchemeMatch = {
  inputSymbol: string;
  outputSymbol: string;
} | null;

/** Legacy setToken: match displayName containing QR scheme (e.g. litecoin). */
export function matchQrSchemeToWithdrawPair(
  scheme: string | null,
  tokens: readonly WithdrawListToken[],
): QrSchemeMatch {
  if (!scheme?.trim()) {
    return null;
  }
  const needle = scheme.trim().toLowerCase();
  const row = tokens.find((item) =>
    item.displayName.toLowerCase().includes(needle),
  );
  if (!row) {
    return null;
  }
  return {
    inputSymbol: row.inputSymbol,
    outputSymbol: row.outputSymbol,
  };
}
