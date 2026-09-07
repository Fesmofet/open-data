import { AccountsCurrentRepository, UserAccountAuthsRepository } from '../../repositories';
import { GetUserAuthorityGrantorsEndpoint } from './get-user-authority-grantors.endpoint';
import { userAccountAuthListQuerySchema } from './user-account-auth-list.schema';

describe('GetUserAuthorityGrantorsEndpoint', () => {
  it('returns null when profile account is missing', async () => {
    const accounts = { findByName: jest.fn().mockResolvedValue(null) } as unknown as AccountsCurrentRepository;
    const auths = {} as unknown as UserAccountAuthsRepository;
    const endpoint = new GetUserAuthorityGrantorsEndpoint(accounts, auths);

    await expect(
      endpoint.execute('waivio.import', { skip: 0, limit: 20 }),
    ).resolves.toBeNull();
  });

  it('filters by posting type and returns lean items', async () => {
    const accounts = {
      findByName: jest.fn().mockResolvedValue({ name: 'waivio.import' }),
    } as unknown as AccountsCurrentRepository;
    const auths = {
      countGrantorsFor: jest.fn().mockResolvedValue(1),
      findGrantorsFor: jest.fn().mockResolvedValue([
        { grantor: 'flowmaster', authority_type: 'posting' },
      ]),
    } as unknown as UserAccountAuthsRepository;

    const endpoint = new GetUserAuthorityGrantorsEndpoint(accounts, auths);
    const result = await endpoint.execute('waivio.import', {
      type: 'posting',
      skip: 0,
      limit: 20,
    });

    expect(result).toEqual({
      items: [{ grantor: 'flowmaster', authorityType: 'posting' }],
      total: 1,
      hasMore: false,
    });
    expect(auths.findGrantorsFor).toHaveBeenCalledWith('waivio.import', 'posting', 0, 20);
  });

  it('sets hasMore when more grantors exist', async () => {
    const accounts = {
      findByName: jest.fn().mockResolvedValue({ name: 'waivio.import' }),
    } as unknown as AccountsCurrentRepository;
    const auths = {
      countGrantorsFor: jest.fn().mockResolvedValue(3),
      findGrantorsFor: jest.fn().mockResolvedValue([
        { grantor: 'alpha', authority_type: 'posting' },
        { grantor: 'beta', authority_type: 'posting' },
      ]),
    } as unknown as UserAccountAuthsRepository;

    const endpoint = new GetUserAuthorityGrantorsEndpoint(accounts, auths);
    const result = await endpoint.execute('waivio.import', { skip: 0, limit: 2 });

    expect(result?.hasMore).toBe(true);
    expect(result?.total).toBe(3);
  });

  it('sets hasMore false on last page', async () => {
    const accounts = {
      findByName: jest.fn().mockResolvedValue({ name: 'waivio.import' }),
    } as unknown as AccountsCurrentRepository;
    const auths = {
      countGrantorsFor: jest.fn().mockResolvedValue(3),
      findGrantorsFor: jest.fn().mockResolvedValue([
        { grantor: 'gamma', authority_type: 'posting' },
      ]),
    } as unknown as UserAccountAuthsRepository;

    const endpoint = new GetUserAuthorityGrantorsEndpoint(accounts, auths);
    const result = await endpoint.execute('waivio.import', { skip: 2, limit: 2 });

    expect(result).toEqual({
      items: [{ grantor: 'gamma', authorityType: 'posting' }],
      total: 3,
      hasMore: false,
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

  it('defaults limit to 20', () => {
    const parsed = userAccountAuthListQuerySchema.parse({});
    expect(parsed.limit).toBe(20);
  });
});
