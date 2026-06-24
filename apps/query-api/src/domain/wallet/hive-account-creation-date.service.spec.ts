import { HiveClient } from '@opden-data-layer/clients';

import { AccountsCurrentRepository } from '../../repositories';
import { HiveAccountCreationDateService } from './hive-account-creation-date.service';

describe('HiveAccountCreationDateService', () => {
  let accounts: jest.Mocked<Pick<AccountsCurrentRepository, 'findByNames'>>;
  let hiveClient: jest.Mocked<Pick<HiveClient, 'getAccounts' | 'getAccountHistory'>>;
  let service: HiveAccountCreationDateService;

  beforeEach(() => {
    accounts = { findByNames: jest.fn() };
    hiveClient = {
      getAccounts: jest.fn(),
      getAccountHistory: jest.fn(),
    };
    service = new HiveAccountCreationDateService(
      accounts as unknown as AccountsCurrentRepository,
      hiveClient as unknown as HiveClient,
    );
  });

  it('uses accounts_current.created when present', async () => {
    accounts.findByNames.mockResolvedValue([
      {
        name: 'flowmaster',
        created: '2020-06-18T15:10:30',
      } as never,
    ]);

    const dates = await service.resolveDates(['flowmaster']);

    expect(dates).toEqual({ flowmaster: '2020-06-18' });
    expect(hiveClient.getAccounts).not.toHaveBeenCalled();
    expect(hiveClient.getAccountHistory).not.toHaveBeenCalled();
  });

  it('falls back to get_accounts when DB row is missing created', async () => {
    accounts.findByNames.mockResolvedValue([
      { name: 'alice', created: null } as never,
    ]);
    hiveClient.getAccounts.mockResolvedValue([
      { name: 'alice', created: '2018-03-01T12:00:00' } as never,
    ]);

    const dates = await service.resolveDates(['alice']);

    expect(dates).toEqual({ alice: '2018-03-01' });
    expect(hiveClient.getAccountHistory).not.toHaveBeenCalled();
  });

  it('falls back to account_created history when RPC account has no created', async () => {
    accounts.findByNames.mockResolvedValue([]);
    hiveClient.getAccounts.mockResolvedValue([]);
    hiveClient.getAccountHistory.mockResolvedValue({
      rows: [
        [
          1,
          {
            op: [
              'account_created',
              {
                creator: 'tipu',
                new_account_name: 'flowmaster',
              },
            ],
            timestamp: '2020-06-18T15:10:30',
            block: 44402714,
            trx_id: 'abc',
            op_in_trx: 1,
            virtual_op: true,
            trx_in_block: 30,
          },
        ],
      ],
    });

    const dates = await service.resolveDates(['flowmaster']);

    expect(dates).toEqual({ flowmaster: '2020-06-18' });
    expect(hiveClient.getAccountHistory).toHaveBeenCalledWith(
      'flowmaster',
      -1,
      1,
      expect.objectContaining({ filterHigh: 0x4000_0000 }),
    );
  });

  it('returns null when account_created name mismatches', async () => {
    accounts.findByNames.mockResolvedValue([]);
    hiveClient.getAccounts.mockResolvedValue([]);
    hiveClient.getAccountHistory.mockResolvedValue({
      rows: [
        [
          1,
          {
            op: ['account_created', { new_account_name: 'other' }],
            timestamp: '2020-06-18T15:10:30',
            block: 1,
            trx_id: 'abc',
            op_in_trx: 1,
            virtual_op: true,
            trx_in_block: 1,
          },
        ],
      ],
    });

    const dates = await service.resolveDates(['flowmaster']);

    expect(dates).toEqual({ flowmaster: null });
  });
});
