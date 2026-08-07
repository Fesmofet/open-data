import { ServiceUnavailableException } from '@nestjs/common';
import { HiveNodeUnavailableError } from '@opden-data-layer/clients';

import { GetUserHiveWalletEndpoint } from './get-user-hive-wallet.endpoint';

describe('GetUserHiveWalletEndpoint', () => {
  const accounts = { findByName: jest.fn() };
  const hiveClient = {
    getAccountsStrict: jest.fn(),
    findRcAccountsStrict: jest.fn(),
    getSavingsWithdrawFromStrict: jest.fn(),
  };
  const hiveGlobalProperties = { getChainContextFields: jest.fn() };
  const currencyQuery = { marketInfo: jest.fn() };

  let endpoint: GetUserHiveWalletEndpoint;

  beforeEach(() => {
    jest.clearAllMocks();
    endpoint = new GetUserHiveWalletEndpoint(
      accounts as never,
      hiveClient as never,
      hiveGlobalProperties as never,
      currencyQuery as never,
    );
  });

  it('returns null when account is missing in db', async () => {
    accounts.findByName.mockResolvedValue(undefined);
    await expect(endpoint.execute('ghost')).resolves.toBeNull();
  });

  it('throws 503 when hive node is unavailable', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    hiveClient.getAccountsStrict.mockRejectedValue(new HiveNodeUnavailableError());
    await expect(endpoint.execute('alice')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('returns wallet summary for known account', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    hiveClient.getAccountsStrict.mockResolvedValue([
      {
        name: 'alice',
        balance: '10 HIVE',
        hbd_balance: '1 HBD',
        vesting_shares: '1000000 VESTS',
        delegated_vesting_shares: '0 VESTS',
        received_vesting_shares: '0 VESTS',
        savings_balance: '0 HIVE',
        savings_hbd_balance: '0 HBD',
        savings_hbd_seconds: '0',
        savings_hbd_seconds_last_update: '1970-01-01T00:00:00',
        savings_hbd_last_interest_payment: '1970-01-01T00:00:00',
        to_withdraw: '0 VESTS',
        vesting_withdraw_rate: '0 VESTS',
      },
    ]);
    hiveGlobalProperties.getChainContextFields.mockResolvedValue({
      totalVestingShares: '1000000000 VESTS',
      totalVestingFundSteem: '500000000 HIVE',
      hbdInterestRatePercent: 20,
    });
    hiveClient.findRcAccountsStrict.mockResolvedValue([
      { max_rc: '1000000000' },
    ]);
    hiveClient.getSavingsWithdrawFromStrict.mockResolvedValue([]);
    currencyQuery.marketInfo.mockResolvedValue({
      current: {
        hive: { usd: 0.25 },
        hive_dollar: { usd: 1 },
      },
    });

    const result = await endpoint.execute('alice');
    expect(result?.account).toBe('alice');
    expect(result?.display.liquidHive).toBe('10');
    expect(result?.pendingRewards.hasRewards).toBe(false);
    expect(result?.chain.totalVestingShares).toContain('VESTS');
  });
});
