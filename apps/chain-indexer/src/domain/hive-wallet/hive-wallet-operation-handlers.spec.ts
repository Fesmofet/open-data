import { HIVE_OPERATION } from '../../constants/hive-parser';
import type { HiveOperationHandlerContext } from '../hive-parser/hive-handler-context';
import { NotificationEmitterService } from '../notification-adapter/notification-emitter.service';
import { HiveChainContextCache } from './hive-chain-context.cache';
import { HiveWalletOperationHandlers } from './hive-wallet-operation-handlers';

describe('HiveWalletOperationHandlers transfer notifications', () => {
  const ctx = {
    blockNum: 1,
    timestamp: '2026-01-01T00:00:00.000Z',
  } as HiveOperationHandlerContext;

  function buildHandlers(emitWithContext: jest.Mock) {
    const notificationEmitter = {
      hiveContext: jest.fn().mockReturnValue({
        blockNum: ctx.blockNum,
        occurredAt: ctx.timestamp,
      }),
      emitWithContext,
    } as unknown as NotificationEmitterService;
    const handlers = new HiveWalletOperationHandlers(
      notificationEmitter,
      {} as HiveChainContextCache,
    );
    const transferHandler = handlers
      .list()
      .find((entry) => entry.operation === HIVE_OPERATION.TRANSFER);
    if (!transferHandler) {
      throw new Error('transfer handler not registered');
    }
    return { transferHandler, emitWithContext };
  }

  it('emits transfer_in and transfer_out for two-party transfer', async () => {
    const emitWithContext = jest.fn();
    const { transferHandler } = buildHandlers(emitWithContext);

    await transferHandler.handle(
      {
        from: 'alice',
        to: 'bob',
        amount: '1.000 HIVE',
        memo: 'hi',
      },
      ctx,
    );

    expect(emitWithContext).toHaveBeenCalledTimes(2);
    expect(emitWithContext.mock.calls.map((call) => call[1].type)).toEqual([
      'transfer_in',
      'transfer_out',
    ]);
  });

  it('emits only transfer_in for self-transfer', async () => {
    const emitWithContext = jest.fn();
    const { transferHandler } = buildHandlers(emitWithContext);

    await transferHandler.handle(
      {
        from: 'Alice',
        to: 'alice',
        amount: '1.000 HIVE',
        memo: null,
      },
      ctx,
    );

    expect(emitWithContext).toHaveBeenCalledTimes(1);
    expect(emitWithContext).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: 'transfer_in',
        actor: 'Alice',
        payload: {
          from: 'Alice',
          to: 'alice',
          amount: '1.000',
          symbol: 'HIVE',
          memo: null,
        },
      }),
    );
  });
});
