/** Legacy `socialWallets` ids on `posting_json_metadata.profile`. */
const PROFILE_CRYPTO_WALLETS = [
  {
    id: 'bitcoin',
    label: 'Bitcoin',
    shortName: 'Bitcoin',
    abbreviation: 'BTC',
    icon: 'bitcoin.png',
    coingeckoId: 'bitcoin',
  },
  {
    id: 'litecoin',
    label: 'Litecoin',
    shortName: 'Litecoin',
    abbreviation: 'LTC',
    icon: 'litecoin.png',
    coingeckoId: 'litecoin',
  },
  {
    id: 'ethereum',
    label: 'Ethereum',
    shortName: 'Ethereum',
    abbreviation: 'ETH',
    icon: 'ethereum.png',
    coingeckoId: 'ethereum',
  },
  {
    id: 'lightningBitcoin',
    label: 'Lightning Bitcoin',
    shortName: 'Lightning Bitcoin',
    abbreviation: 'LBTC',
    icon: 'lightning_bitcoin.png',
    coingeckoId: 'bitcoin',
  },
] as const;

export type UserAccountSidebarCryptoWallet = {
  id: string;
  label: string;
  shortName: string;
  abbreviation: string;
  address: string;
  icon: string;
  coingeckoId: string;
};

/** Non-empty crypto deposit addresses from Hive profile (legacy `SocialLinks` wallets). */
export function parseProfileCryptoWallets(
  profile: Record<string, unknown> | undefined,
): UserAccountSidebarCryptoWallet[] {
  if (!profile) {
    return [];
  }

  const rows: UserAccountSidebarCryptoWallet[] = [];

  for (const wallet of PROFILE_CRYPTO_WALLETS) {
    const raw = profile[wallet.id];
    if (typeof raw !== 'string') {
      continue;
    }
    const address = raw.trim();
    if (address.length === 0) {
      continue;
    }
    rows.push({
      id: wallet.id,
      label: wallet.label,
      shortName: wallet.shortName,
      abbreviation: wallet.abbreviation,
      address,
      icon: wallet.icon,
      coingeckoId: wallet.coingeckoId,
    });
  }

  return rows;
}
