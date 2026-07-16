import { z } from 'zod';
import { dispatchEnvelope, type OdlActionHandler } from './envelope-dispatcher';

const envelopeSchema = z.object({
  events: z.array(
    z.object({
      action: z.string(),
      v: z.number(),
      event_id: z.string().optional(),
      payload: z.record(z.string(), z.unknown()),
    }),
  ),
});

describe('dispatchEnvelope', () => {
  it('dispatches each event to the matching handler', async () => {
    const handled: string[] = [];
    const handler: OdlActionHandler = {
      action: 'test_action',
      handle: async () => {
        handled.push('ok');
      },
    };

    await dispatchEnvelope(
      JSON.stringify({
        events: [{ action: 'test_action', v: 1, payload: { x: 1 } }],
      }),
      {
        schema: envelopeSchema,
        handlerMap: { test_action: handler },
        governanceCache: { resolvePlatform: async () => ({ banned: [] }) },
        logger: { warn: jest.fn(), log: jest.fn(), error: jest.fn() },
        encodeEventSeq: () => BigInt(42),
        hiveCtx: {
          blockNum: 1,
          transactionIndex: 2,
          operationIndex: 3,
          transaction: { transaction_id: 'tx-1' },
          timestamp: '2026-01-01T00:00:00.000Z',
        },
        account: 'alice',
      },
    );

    expect(handled).toEqual(['ok']);
  });

  it('skips banned accounts', async () => {
    const handler: OdlActionHandler = {
      action: 'test_action',
      handle: jest.fn(),
    };

    await dispatchEnvelope(
      JSON.stringify({
        events: [{ action: 'test_action', v: 1, payload: {} }],
      }),
      {
        schema: envelopeSchema,
        handlerMap: { test_action: handler },
        governanceCache: { resolvePlatform: async () => ({ banned: ['alice'] }) },
        logger: { warn: jest.fn(), log: jest.fn(), error: jest.fn() },
        encodeEventSeq: () => BigInt(1),
        hiveCtx: {
          blockNum: 1,
          transactionIndex: 0,
          operationIndex: 0,
          transaction: { transaction_id: 'tx-1' },
          timestamp: '2026-01-01T00:00:00.000Z',
        },
        account: 'alice',
      },
    );

    expect(handler.handle).not.toHaveBeenCalled();
  });
});
