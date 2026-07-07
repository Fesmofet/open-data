/** Default asset for transfer/power/delegate modals from the active wallet tab. */
export function getDefaultWalletAssetForTab(walletType: string): string {
  if (walletType === 'HIVE' || walletType === 'ENGINE') {
    return 'HIVE';
  }
  return 'WAIV';
}

export function getDefaultSwapFromSymbolForTab(walletType: string): string {
  return getDefaultWalletAssetForTab(walletType);
}
