import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { normalizeHiveBlockTimestampUtc } from '@opden-data-layer/core';
import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import type { HiveOperationHandlerContext } from '../hive-parser/hive-handler-context';
import type { OdlEventContext } from '../odl-shared/envelope-dispatcher';
import { NOTIFICATION_EVENT } from './events/notification-domain-events';

export interface NotificationEmitContext {
  readonly blockNum: number;
  readonly trxId: string;
  readonly occurredAt: string;
}

type NotificationEventBody = Omit<
  AnyNotificationEvent,
  'occurredAt' | 'blockNum' | 'trxId'
>;

@Injectable()
export class NotificationEmitterService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit(event: AnyNotificationEvent): void {
    this.eventEmitter.emit(NOTIFICATION_EVENT, event);
  }

  emitWithContext(
    ctx: NotificationEmitContext,
    body: NotificationEventBody,
  ): void {
    this.emit({
      ...body,
      occurredAt: ctx.occurredAt,
      blockNum: ctx.blockNum,
      trxId: ctx.trxId,
    } as AnyNotificationEvent);
  }

  hiveContext(ctx: HiveOperationHandlerContext): NotificationEmitContext {
    return {
      blockNum: ctx.blockNum,
      trxId: ctx.transaction.transaction_id,
      occurredAt: normalizeHiveBlockTimestampUtc(ctx.timestamp),
    };
  }

  odlContext(ctx: OdlEventContext): NotificationEmitContext {
    return {
      blockNum: ctx.blockNum,
      trxId: ctx.transactionId,
      occurredAt: normalizeHiveBlockTimestampUtc(ctx.timestamp),
    };
  }

  emitTrxProcessedHive(ctx: HiveOperationHandlerContext): void {
    this.emitTrxProcessed(this.hiveContext(ctx));
  }

  emitTrxProcessedOdl(ctx: OdlEventContext): void {
    this.emitTrxProcessed(this.odlContext(ctx));
  }

  emitTrxProcessed(emitCtx: NotificationEmitContext): void {
    this.emitWithContext(emitCtx, {
      type: 'trx_processed',
      objectId: null,
      actor: null,
      payload: {},
    });
  }
}
