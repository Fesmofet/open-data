import { EventEmitter2 } from '@nestjs/event-emitter';
import { UPDATE_TYPES } from '@opden-data-layer/core';
import { NotificationEmitterService } from '../../notification-adapter/notification-emitter.service';
import type { OdlEventContext } from '../odl-action-handler';
import { WriteGuardRunner } from '../guards';
import { UpdateVoteHandler } from './update-vote.handler';

describe('UpdateVoteHandler notifications', () => {
  const ctx: OdlEventContext = {
    action: 'update_vote',
    creator: 'voter',
    blockNum: 10,
    transactionIndex: 0,
    operationIndex: 0,
    odlEventIndex: 0,
    transactionId: 'trx-vote',
    timestamp: '2026-01-01T00:00:00.000Z',
    eventSeq: BigInt(1),
    eventIdIndexMap: new Map(),
  };

  const votedUpdate = {
    update_id: 'upd-1',
    object_id: 'obj-1',
    update_type: UPDATE_TYPES.NAME,
  };

  const core = {
    object_id: 'obj-1',
    object_type: 'place',
    creator: 'owner',
  };

  function buildHandler(
    notificationEmitter: NotificationEmitterService,
  ): UpdateVoteHandler {
    return new UpdateVoteHandler(
      {
        create: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
        findByUpdateIdAndVoter: jest.fn().mockResolvedValue(undefined),
        update: jest.fn(),
      } as unknown as import('../../../repositories').ValidityVotesRepository,
      {
        findByUpdateId: jest.fn().mockResolvedValue(votedUpdate),
      } as unknown as import('../../../repositories').ObjectUpdatesRepository,
      {
        findByObjectId: jest.fn().mockResolvedValue(core),
      } as unknown as import('../../../repositories').ObjectsCoreRepository,
      { check: jest.fn().mockReturnValue(null) } as unknown as WriteGuardRunner,
      { emit: jest.fn() } as unknown as EventEmitter2,
      notificationEmitter,
    );
  }

  it('emits vote cast and trx processed after creating a vote', async () => {
    const emitWithContext = jest.fn();
    const emitTrxProcessedOdl = jest.fn();
    const notificationEmitter = {
      odlContext: jest.fn().mockReturnValue({
        blockNum: ctx.blockNum,
        trxId: ctx.transactionId,
        occurredAt: ctx.timestamp,
      }),
      emitWithContext,
      emitTrxProcessedOdl,
    } as unknown as NotificationEmitterService;
    const handler = buildHandler(notificationEmitter);

    await handler.handle(
      {
        update_id: 'upd-1',
        voter: 'voter',
        vote: 'for',
      },
      ctx,
    );

    expect(emitWithContext).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: 'update_vote_cast',
        objectId: 'obj-1',
        actor: 'voter',
        payload: expect.objectContaining({
          updateId: 'upd-1',
          vote: 'for',
          updateType: UPDATE_TYPES.NAME,
          authorPermlink: 'obj-1',
        }),
      }),
    );
    expect(emitTrxProcessedOdl).toHaveBeenCalledWith(ctx);
  });

  it('emits trx processed but not vote cast on vote remove', async () => {
    const emitWithContext = jest.fn();
    const emitTrxProcessedOdl = jest.fn();
    const notificationEmitter = {
      odlContext: jest.fn(),
      emitWithContext,
      emitTrxProcessedOdl,
    } as unknown as NotificationEmitterService;
    const handler = buildHandler(notificationEmitter);

    await handler.handle(
      {
        update_id: 'upd-1',
        voter: 'voter',
        vote: 'remove',
      },
      ctx,
    );

    const voteCastCalls = emitWithContext.mock.calls.filter(
      ([, body]) => body?.type === 'update_vote_cast',
    );
    expect(voteCastCalls).toHaveLength(0);
    expect(emitTrxProcessedOdl).toHaveBeenCalledWith(ctx);
  });
});
