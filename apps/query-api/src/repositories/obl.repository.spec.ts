import { OblRepository } from './obl.repository';
import type { Kysely } from 'kysely';

function createChainableMock(finalExecute: jest.Mock) {
  const chain: Record<string, jest.Mock> = {};
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'execute' || prop === 'executeTakeFirst') {
        return finalExecute;
      }
      if (!chain[String(prop)]) {
        chain[String(prop)] = jest.fn().mockReturnValue(new Proxy({}, handler));
      }
      return chain[String(prop)];
    },
  };
  return new Proxy({}, handler) as Kysely<unknown>;
}

describe('OblRepository', () => {
  it('findLedgerStartedSeq prefers obl_ledgers over earliest contract', async () => {
    const executeTakeFirst = jest
      .fn()
      .mockResolvedValueOnce({ started_event_seq: BigInt(99) });
    const db = createChainableMock(executeTakeFirst);
    const repo = new OblRepository(db as never);

    const seq = await repo.findLedgerStartedSeq('alice', 'bob');

    expect(seq).toBe(BigInt(99));
    expect(executeTakeFirst).toHaveBeenCalledTimes(1);
  });

  it('findLedgerStartedSeq falls back to earliest contract', async () => {
    const executeTakeFirst = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ created_event_seq: BigInt(42) });
    const db = createChainableMock(executeTakeFirst);
    const repo = new OblRepository(db as never);

    const seq = await repo.findLedgerStartedSeq('alice', 'bob');

    expect(seq).toBe(BigInt(42));
    expect(executeTakeFirst).toHaveBeenCalledTimes(2);
  });

  it('searchOffers defaults to active status filter', async () => {
    const execute = jest.fn().mockResolvedValue([]);
    const chain: Record<string, jest.Mock> = {};
    const handler: ProxyHandler<object> = {
      get(_target, prop) {
        if (prop === 'execute') {
          return execute;
        }
        if (!chain[String(prop)]) {
          chain[String(prop)] = jest.fn().mockReturnValue(new Proxy({}, handler));
        }
        return chain[String(prop)];
      },
    };
    const db = new Proxy({}, handler) as Kysely<unknown>;
    const repo = new OblRepository(db as never);

    await repo.searchOffers({ limit: 10, offset: 0 });

    expect(chain.where).toHaveBeenCalledWith('status', '=', 'active');
  });

  it('searchOffers skips status filter when status is all', async () => {
    const execute = jest.fn().mockResolvedValue([]);
    const where = jest.fn();
    const chain: Record<string, jest.Mock> = { where };
    const handler: ProxyHandler<object> = {
      get(_target, prop) {
        if (prop === 'execute') {
          return execute;
        }
        if (!chain[String(prop)]) {
          chain[String(prop)] = jest.fn().mockReturnValue(new Proxy({}, handler));
        }
        return chain[String(prop)];
      },
    };
    where.mockReturnValue(new Proxy({}, handler));
    const db = new Proxy({}, handler) as Kysely<unknown>;
    const repo = new OblRepository(db as never);

    await repo.searchOffers({ limit: 10, offset: 0, status: 'all' });

    const statusFilters = where.mock.calls.filter(
      (call) => call[0] === 'status',
    );
    expect(statusFilters).toHaveLength(0);
  });

  it('listArbitrationDisputesForAccount filters arbiter contracts and status', async () => {
    const execute = jest.fn().mockResolvedValue([]);
    const where = jest.fn();
    const chain: Record<string, jest.Mock> = { where };
    const handler: ProxyHandler<object> = {
      get(_target, prop) {
        if (prop === 'execute') {
          return execute;
        }
        if (!chain[String(prop)]) {
          chain[String(prop)] = jest.fn().mockReturnValue(new Proxy({}, handler));
        }
        return chain[String(prop)];
      },
    };
    where.mockReturnValue(new Proxy({}, handler));
    const db = new Proxy({}, handler) as Kysely<unknown>;
    const repo = new OblRepository(db as never);

    await repo.listArbitrationDisputesForAccount('carol', 'open', 20, undefined);

    expect(where).toHaveBeenCalledWith('c.dispute_rule', '=', 'arbiter');
    expect(where).toHaveBeenCalledWith('c.arbiter', '=', 'carol');
    expect(where).toHaveBeenCalledWith('d.status', '=', 'open');
    expect(execute).toHaveBeenCalled();
  });
});
