import { normalizeHiveBlockTimestampUtc } from '@opden-data-layer/core';
import type { HiveEngineBlock } from '@opden-data-layer/clients';
import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import type { NotificationEmitterService } from '../notification-adapter/notification-emitter.service';

type EngineNotificationType = Extract<
  AnyNotificationEvent['type'],
  | 'engine_transfer'
  | 'engine_transfer_out'
  | 'engine_swap'
  | 'engine_stake'
  | 'engine_unstake'
  | 'engine_delegate'
  | 'engine_undelegate'
>;

export function emitEngineNotification(
  notificationEmitter: NotificationEmitterService,
  block: HiveEngineBlock,
  type: EngineNotificationType,
  actor: string,
  payload: Record<string, unknown>,
  trxId: string,
): void {
  notificationEmitter.emit({
    type,
    occurredAt: normalizeHiveBlockTimestampUtc(
      block.timestamp ?? '1970-01-01T00:00:00',
    ),
    blockNum: block.refHiveBlockNumber || block.blockNumber,
    trxId,
    objectId: null,
    actor,
    payload,
  } as Parameters<NotificationEmitterService['emit']>[0]);
}
