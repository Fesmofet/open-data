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
});
