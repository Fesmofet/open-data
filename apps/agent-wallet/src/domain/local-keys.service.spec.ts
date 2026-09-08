import { PrivateKey } from '@hiveio/dhive';

import { LocalKeysService } from './local-keys.service';

function buildChainAccount(input: {
  name: string;
  postingPub: string;
  postingWeight?: number;
  postingThreshold?: number;
  activePub?: string;
  memoPub?: string;
  ownerPub?: string;
}) {
  return {
    name: input.name,
    memo_key: input.memoPub ?? 'STM6HhfiYyrZhLwM7AGCJgR2PbnUxmmednYZ2Vt4AgDExVGFwveLB',
    posting: {
      weight_threshold: input.postingThreshold ?? 1,
      account_auths: [],
      key_auths: [[input.postingPub, input.postingWeight ?? 1]],
    },
    active: {
      weight_threshold: 1,
      account_auths: [],
      key_auths: input.activePub ? [[input.activePub, 1]] : [],
    },
    owner: {
      weight_threshold: 1,
      account_auths: [],
      key_auths: input.ownerPub ? [[input.ownerPub, 1]] : [],
    },
  };
}

describe('LocalKeysService', () => {
  const alicePosting = PrivateKey.fromSeed('alice-posting-seed');
  const bobPosting = PrivateKey.fromSeed('bob-posting-seed');
  const bobActive = PrivateKey.fromSeed('bob-active-seed');
  const aliceMemo = PrivateKey.fromSeed('alice-memo-seed');

  const getAccounts = jest.fn();

  const config = {
    get: jest.fn((key: string) => {
      if (key === 'accounts') {
        return [
          {
            account: 'alice',
            keys: {
              posting: alicePosting.toString(),
              memo: aliceMemo.toString(),
            },
          },
          {
            account: 'bob',
            keys: {
              posting: bobPosting.toString(),
              active: bobActive.toString(),
            },
          },
        ];
      }
      if (key === 'defaultAccount') {
        return 'alice';
      }
      if (key === 'hiveRpcNodes') {
        return ['https://api.hive.blog'];
      }
      return undefined;
    }),
  };

  let service: LocalKeysService;

  beforeEach(async () => {
    jest.clearAllMocks();
    config.get.mockImplementation((key: string) => {
      if (key === 'accounts') {
        return [
          {
            account: 'alice',
            keys: {
              posting: alicePosting.toString(),
              memo: aliceMemo.toString(),
            },
          },
          {
            account: 'bob',
            keys: {
              posting: bobPosting.toString(),
              active: bobActive.toString(),
            },
          },
        ];
      }
      if (key === 'defaultAccount') {
        return 'alice';
      }
      if (key === 'hiveRpcNodes') {
        return ['https://api.hive.blog'];
      }
      return undefined;
    });
    getAccounts.mockResolvedValue([
      buildChainAccount({
        name: 'alice',
        postingPub: alicePosting.createPublic().toString(),
        memoPub: aliceMemo.createPublic().toString(),
      }),
      buildChainAccount({
        name: 'bob',
        postingPub: bobPosting.createPublic().toString(),
        activePub: bobActive.createPublic().toString(),
      }),
    ]);

    service = new LocalKeysService(config as never);
    (service as unknown as { client: unknown }).client = {
      database: { getAccounts },
      broadcast: {
        sendOperations: jest.fn().mockResolvedValue({ id: 'tx-1' }),
      },
    };
    await service.onModuleInit();
  });

  it('marks authorized accounts ready after one batch RPC call', () => {
    expect(getAccounts).toHaveBeenCalledTimes(1);
    expect(getAccounts).toHaveBeenCalledWith(['alice', 'bob']);
    const readiness = service.getAllReadiness();
    expect(readiness).toHaveLength(2);
    expect(readiness.every((entry) => entry.ready)).toBe(true);
  });

  it('returns default account readiness without argument', () => {
    expect(service.getReadiness().account).toBe('alice');
  });

  it('broadcasts with the named account posting key', async () => {
    const client = (service as unknown as {
      client: { broadcast: { sendOperations: jest.Mock } };
    }).client;
    await service.broadcast({
      ops: [{ op: 'test' }],
      keyType: 'posting',
      account: 'bob',
    });
    expect(client.broadcast.sendOperations).toHaveBeenCalledTimes(1);
    expect(client.broadcast.sendOperations.mock.calls[0]?.[1]?.toString()).toBe(
      bobPosting.toString(),
    );
  });

  it('rejects active broadcast without active key', async () => {
    const client = (service as unknown as {
      client: { broadcast: { sendOperations: jest.Mock } };
    }).client;
    await expect(
      service.broadcast({ ops: [{ op: 'test' }], keyType: 'active', account: 'alice' }),
    ).rejects.toThrow(/active key/i);
    expect(client.broadcast.sendOperations).not.toHaveBeenCalled();
  });

  it('rejects broadcast for account outside registry', async () => {
    await expect(
      service.broadcast({ ops: [{ op: 'test' }], keyType: 'posting', account: 'carol' }),
    ).rejects.toThrow(/carol/);
  });

  it('does not expose WIF strings in readiness output', () => {
    const serialized = JSON.stringify(service.getAllReadiness());
    expect(serialized).not.toContain(alicePosting.toString());
    expect(serialized).not.toContain(bobPosting.toString());
  });

  describe('per-account isolation', () => {
    const carolPosting = PrivateKey.fromSeed('carol-posting-seed');
    const carolOwner = PrivateKey.fromSeed('carol-owner-seed');

    async function initWithAccounts(
      accounts: Array<{
        account: string;
        keys: Record<string, string>;
      }>,
      chainRows: ReturnType<typeof buildChainAccount>[],
    ): Promise<LocalKeysService> {
      (config.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'accounts') {
          return accounts;
        }
        if (key === 'defaultAccount') {
          return accounts[0]?.account;
        }
        if (key === 'hiveRpcNodes') {
          return ['https://api.hive.blog'];
        }
        return undefined;
      });
      getAccounts.mockResolvedValue(chainRows);

      const next = new LocalKeysService(config as never);
      (next as unknown as { client: unknown }).client = {
        database: { getAccounts },
        broadcast: {
          sendOperations: jest.fn().mockResolvedValue({ id: 'tx-1' }),
        },
      };
      await next.onModuleInit();
      return next;
    }

    it('keeps a valid account ready when another has a malformed posting key', async () => {
      const isolated = await initWithAccounts(
        [
          { account: 'alice', keys: { posting: 'not-a-wif' } },
          { account: 'bob', keys: { posting: bobPosting.toString() } },
        ],
        [
          buildChainAccount({
            name: 'bob',
            postingPub: bobPosting.createPublic().toString(),
          }),
        ],
      );

      const readiness = isolated.getAllReadiness();
      expect(readiness.find((entry) => entry.account === 'alice')?.ready).toBe(false);
      expect(readiness.find((entry) => entry.account === 'bob')?.ready).toBe(true);
    });

    it('keeps a valid account ready when another is missing on chain', async () => {
      const isolated = await initWithAccounts(
        [
          { account: 'alice', keys: { posting: alicePosting.toString() } },
          { account: 'bob', keys: { posting: bobPosting.toString() } },
        ],
        [
          buildChainAccount({
            name: 'alice',
            postingPub: alicePosting.createPublic().toString(),
          }),
        ],
      );

      expect(isolated.getReadiness('alice').ready).toBe(true);
      expect(isolated.getReadiness('bob').ready).toBe(false);
      expect(isolated.getReadiness('bob').error).toMatch(/not found/i);
    });

    it('survives RPC failure without throwing during init', async () => {
      (config.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'accounts') {
          return [
            { account: 'alice', keys: { posting: alicePosting.toString() } },
            { account: 'bob', keys: { posting: bobPosting.toString() } },
          ];
        }
        if (key === 'defaultAccount') {
          return 'alice';
        }
        if (key === 'hiveRpcNodes') {
          return ['https://api.hive.blog'];
        }
        return undefined;
      });
      getAccounts.mockRejectedValue(new Error('RPC unavailable'));

      const isolated = new LocalKeysService(config as never);
      (isolated as unknown as { client: unknown }).client = {
        database: { getAccounts },
        broadcast: {
          sendOperations: jest.fn().mockResolvedValue({ id: 'tx-1' }),
        },
      };

      await expect(isolated.onModuleInit()).resolves.toBeUndefined();
      expect(isolated.getAllReadiness().every((entry) => !entry.ready)).toBe(true);
      expect(
        isolated.getAllReadiness().every((entry) =>
          entry.error?.includes('Could not verify local keys against Hive RPC'),
        ),
      ).toBe(true);
    });

    it('does not sign with owner key even when ownerReady is true', async () => {
      const isolated = await initWithAccounts(
        [
          {
            account: 'carol',
            keys: {
              posting: carolPosting.toString(),
              owner: carolOwner.toString(),
            },
          },
        ],
        [
          buildChainAccount({
            name: 'carol',
            postingPub: carolPosting.createPublic().toString(),
            ownerPub: carolOwner.createPublic().toString(),
          }),
        ],
      );

      expect(isolated.getReadiness('carol').ownerReady).toBe(true);

      const client = (isolated as unknown as {
        client: { broadcast: { sendOperations: jest.Mock } };
      }).client;
      await isolated.broadcast({
        ops: [{ op: 'test' }],
        keyType: 'posting',
        account: 'carol',
      });
      expect(client.broadcast.sendOperations.mock.calls[0]?.[1]?.toString()).toBe(
        carolPosting.toString(),
      );

      await expect(
        isolated.broadcast({ ops: [{ op: 'test' }], keyType: 'active', account: 'carol' }),
      ).rejects.toThrow(/active key/i);
    });
  });
});
