import { parseProfileCryptoWallets } from './parse-profile-crypto-wallets';

describe('parseProfileCryptoWallets', () => {
  it('returns wallets in legacy order when profile keys are set', () => {
    const rows = parseProfileCryptoWallets({
      ethereum: ' 0xabc ',
      bitcoin: 'bc1qtest',
      litecoin: 'ltc1qtest',
      lightningBitcoin: 'lnbc1test',
      twitter: 'alice',
    });

    expect(rows.map((row) => row.id)).toEqual([
      'bitcoin',
      'litecoin',
      'ethereum',
      'lightningBitcoin',
    ]);
    expect(rows[0]).toMatchObject({
      label: 'Bitcoin',
      shortName: 'Bitcoin',
      abbreviation: 'BTC',
      address: 'bc1qtest',
      icon: 'bitcoin.png',
      coingeckoId: 'bitcoin',
    });
  });

  it('skips empty or missing addresses', () => {
    expect(
      parseProfileCryptoWallets({
        bitcoin: '   ',
        litecoin: 1,
      }),
    ).toEqual([]);
  });
});
