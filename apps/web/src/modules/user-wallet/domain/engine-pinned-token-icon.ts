/** Local fallback icons for pinned SWAP.* rows on the ENGINE wallet tab. */
const PINNED_SWAP_FALLBACK_ICON_SRC: Record<string, string> = {
  'SWAP.HIVE': '/images/icons/cryptocurrencies/hive.png',
  'SWAP.LTC': '/images/icons/cryptocurrencies/litecoin.png',
  'SWAP.BTC': '/images/icons/cryptocurrencies/bitcoin.png',
  'SWAP.ETH': '/images/icons/cryptocurrencies/ethereum.png',
};

export function getEnginePinnedTokenFallbackIconSrc(
  symbol: string,
): string | null {
  return PINNED_SWAP_FALLBACK_ICON_SRC[symbol] ?? null;
}
