import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationEmitterService } from './notification-emitter.service';
import type { HiveOperationHandlerContext } from '../hive-parser/hive-handler-context';

describe('NotificationEmitterService', () => {
  const emitter = new EventEmitter2();
  const service = new NotificationEmitterService(emitter);

  it('normalizes hive occurredAt to UTC', () => {
    const ctx = {
      blockNum: 1,
      timestamp: '2026-07-30T12:00:00',
      transaction: { transaction_id: 'trx-1' },
    } as HiveOperationHandlerContext;

    expect(service.hiveContext(ctx).occurredAt).toBe('2026-07-30T12:00:00Z');
  });
});
