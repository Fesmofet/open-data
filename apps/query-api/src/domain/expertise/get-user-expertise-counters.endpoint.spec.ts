import { AccountsCurrentRepository, UserObjectExpertiseRepository } from '../../repositories';
import { GetUserExpertiseCountersEndpoint } from './get-user-expertise-counters.endpoint';

describe('GetUserExpertiseCountersEndpoint', () => {
  it('returns null for empty username', async () => {
    const endpoint = new GetUserExpertiseCountersEndpoint(
      {} as AccountsCurrentRepository,
      {} as UserObjectExpertiseRepository,
    );
    await expect(endpoint.execute('  ')).resolves.toBeNull();
  });

  it('returns null when account missing', async () => {
    const accounts = {
      findByName: jest.fn().mockResolvedValue(null),
    } as unknown as AccountsCurrentRepository;
    const endpoint = new GetUserExpertiseCountersEndpoint(
      accounts,
      {} as UserObjectExpertiseRepository,
    );
    await expect(endpoint.execute('ghost')).resolves.toBeNull();
  });

  it('returns scope counts for existing user', async () => {
    const accounts = {
      findByName: jest.fn().mockResolvedValue({ name: 'alice' }),
    } as unknown as AccountsCurrentRepository;
    const expertiseRepo = {
      countByScope: jest
        .fn()
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(7),
    } as unknown as UserObjectExpertiseRepository;

    const endpoint = new GetUserExpertiseCountersEndpoint(accounts, expertiseRepo);
    await expect(endpoint.execute('alice')).resolves.toEqual({
      hashtagsCount: 3,
      objectsCount: 7,
    });
    expect(expertiseRepo.countByScope).toHaveBeenNthCalledWith(1, 'alice', 'hashtags');
    expect(expertiseRepo.countByScope).toHaveBeenNthCalledWith(2, 'alice', 'objects');
  });
});
