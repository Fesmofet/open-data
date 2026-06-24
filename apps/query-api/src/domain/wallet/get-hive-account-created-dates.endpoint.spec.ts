import { GetHiveAccountCreatedDatesEndpoint } from './get-hive-account-created-dates.endpoint';
import { HiveAccountCreationDateService } from './hive-account-creation-date.service';

describe('GetHiveAccountCreatedDatesEndpoint', () => {
  it('returns min startDateYmd across accounts', async () => {
    const creationDates = {
      resolveDates: jest.fn().mockResolvedValue({
        alice: '2021-01-01',
        bob: '2020-06-18',
      }),
    } as unknown as HiveAccountCreationDateService;

    const endpoint = new GetHiveAccountCreatedDatesEndpoint(creationDates);
    const result = await endpoint.execute({ accounts: ['alice', 'bob'] });

    expect(result).toEqual({
      dates: { alice: '2021-01-01', bob: '2020-06-18' },
      startDateYmd: '2020-06-18',
    });
  });
});
