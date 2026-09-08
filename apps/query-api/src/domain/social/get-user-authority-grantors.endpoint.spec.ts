import { AccountsCurrentRepository, UserAccountAuthsRepository } from '../../repositories';
import { GetUserAuthorityGrantorsEndpoint } from './get-user-authority-grantors.endpoint';
import { userAccountAuthListQuerySchema } from './user-account-auth-list.schema';

function accountsMock(overrides?: Partial<AccountsCurrentRepository>): AccountsCurrentRepository {
  return {
    findByName: jest.fn().mockResolvedValue({ name: 'waivio.import' }),
    findByNames: jest.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as AccountsCurrentRepository;
}

const joinedProfile = {
  updated_at_block: 100,
  posting_json_metadata: null,
  json_metadata: null,
  profile_image: null,
  wobjects_weight: 0,
  users_following_count: 0,
};

describe('GetUserAuthorityGrantorsEndpoint', () => {
  it('returns null when profile account is missing', async () => {
    const accounts = { findByName: jest.fn().mockResolvedValue(null) } as unknown as AccountsCurrentRepository;
    const auths = {} as unknown as UserAccountAuthsRepository;
    const endpoint = new GetUserAuthorityGrantorsEndpoint(accounts, auths);

    await expect(
      endpoint.execute('waivio.import', { skip: 0, limit: 20, sort: 'a-z' }),
    ).resolves.toBeNull();
  });

  it('filters by posting type and returns lean items', async () => {
    const auths = {
      countGrantorsFor: jest.fn().mockResolvedValue(1),
      findGrantorsFor: jest.fn().mockResolvedValue([
        { grantor: 'flowmaster', authority_type: 'posting', ...joinedProfile },
      ]),
    } as unknown as UserAccountAuthsRepository;
    const accounts = accountsMock();

    const endpoint = new GetUserAuthorityGrantorsEndpoint(accounts, auths);
    const result = await endpoint.execute('waivio.import', {
      type: 'posting',
      skip: 0,
      limit: 20,
      sort: 'a-z',
    });

    expect(result).toEqual({
      items: [{
        grantor: 'flowmaster',
        authorityType: 'posting',
        avatarUrl: null,
        wobjectsWeight: 0,
        usersFollowingCount: 0,
      }],
      total: 1,
      hasMore: false,
    });
    expect(auths.findGrantorsFor).toHaveBeenCalledWith('waivio.import', {
      authorityType: 'posting',
      sort: 'a-z',
      skip: 0,
      limit: 20,
    });
  });

  it('sets hasMore when more grantors exist', async () => {
    const accounts = accountsMock();
    const auths = {
      countGrantorsFor: jest.fn().mockResolvedValue(3),
      findGrantorsFor: jest.fn().mockResolvedValue([
        { grantor: 'alpha', authority_type: 'posting', ...joinedProfile },
        { grantor: 'beta', authority_type: 'posting', ...joinedProfile },
      ]),
    } as unknown as UserAccountAuthsRepository;

    const endpoint = new GetUserAuthorityGrantorsEndpoint(accounts, auths);
    const result = await endpoint.execute('waivio.import', { skip: 0, limit: 2, sort: 'a-z' });

    expect(result?.hasMore).toBe(true);
    expect(result?.total).toBe(3);
  });

  it('sets hasMore false on last page', async () => {
    const accounts = accountsMock();
    const auths = {
      countGrantorsFor: jest.fn().mockResolvedValue(3),
      findGrantorsFor: jest.fn().mockResolvedValue([
        { grantor: 'gamma', authority_type: 'posting', ...joinedProfile },
      ]),
    } as unknown as UserAccountAuthsRepository;

    const endpoint = new GetUserAuthorityGrantorsEndpoint(accounts, auths);
    const result = await endpoint.execute('waivio.import', { skip: 2, limit: 2, sort: 'a-z' });

    expect(result).toEqual({
      items: [{
        grantor: 'gamma',
        authorityType: 'posting',
        avatarUrl: null,
        wobjectsWeight: 0,
        usersFollowingCount: 0,
      }],
      total: 3,
      hasMore: false,
    });
  });

  it('passes recency sort to repository', async () => {
    const accounts = accountsMock();
    const auths = {
      countGrantorsFor: jest.fn().mockResolvedValue(0),
      findGrantorsFor: jest.fn().mockResolvedValue([]),
    } as unknown as UserAccountAuthsRepository;

    const endpoint = new GetUserAuthorityGrantorsEndpoint(accounts, auths);
    await endpoint.execute('waivio.import', { skip: 0, limit: 20, sort: 'recency' });

    expect(auths.findGrantorsFor).toHaveBeenCalledWith('waivio.import', {
      authorityType: undefined,
      sort: 'recency',
      skip: 0,
      limit: 20,
    });
  });
});

describe('userAccountAuthListQuerySchema', () => {
  it('rejects unknown type', () => {
    expect(userAccountAuthListQuerySchema.safeParse({ type: 'memo' }).success).toBe(false);
  });

  it('rejects limit above 100', () => {
    expect(userAccountAuthListQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });

  it('accepts limit at 100', () => {
    expect(userAccountAuthListQuerySchema.safeParse({ limit: 100 }).success).toBe(true);
  });

  it('rejects negative skip', () => {
    expect(userAccountAuthListQuerySchema.safeParse({ skip: -1 }).success).toBe(false);
  });

  it('defaults limit to 20 and sort to a-z', () => {
    const parsed = userAccountAuthListQuerySchema.parse({});
    expect(parsed.limit).toBe(20);
    expect(parsed.sort).toBe('a-z');
  });

  it('accepts sort recency and rank', () => {
    expect(userAccountAuthListQuerySchema.parse({ sort: 'recency' }).sort).toBe('recency');
    expect(userAccountAuthListQuerySchema.parse({ sort: 'rank' }).sort).toBe('rank');
    expect(userAccountAuthListQuerySchema.parse({ sort: 'followers' }).sort).toBe('followers');
  });
});
