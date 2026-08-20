import type { HiveClient } from '@opden-data-layer/clients';
import { ObjectsCore } from '@opden-data-layer/odl-db-types';

import type {
  AccountSyncQueueRepository,
  AccountsCurrentRepository,
  ValidityVotesRepository,
} from '../../../repositories';

import type { NotificationEmitterService } from '../../notification-adapter/notification-emitter.service';

/** Minimal `objects_core` row for UpdateCreateHandler unit tests. */
export function mockObjectsCore(
  row: Omit<ObjectsCore, 'created_at'>,
): ObjectsCore {
  return { ...row, created_at: new Date() };
}

/** Default mocks for user_ref deps in UpdateCreateHandler unit tests. */
export function defaultUpdateCreateUserRefDeps(): {
  accountsCurrentRepository: AccountsCurrentRepository;
  accountSyncQueueRepository: AccountSyncQueueRepository;
  hiveClient: HiveClient;
} {
  return {
    accountsCurrentRepository: {
      findByName: jest.fn().mockResolvedValue(undefined),
    } as unknown as AccountsCurrentRepository,
    accountSyncQueueRepository: {
      enqueue: jest.fn().mockResolvedValue(undefined),
    } as unknown as AccountSyncQueueRepository,
    hiveClient: {
      getAccounts: jest.fn().mockResolvedValue([]),
    } as unknown as HiveClient,
  };
}

/** Default mock for creator auto-like in UpdateCreateHandler unit tests. */
export function defaultUpdateCreateValidityVotesDeps(): {
  validityVotesRepository: ValidityVotesRepository;
} {
  return {
    validityVotesRepository: {
      createIfAbsent: jest.fn().mockResolvedValue(undefined),
    } as unknown as ValidityVotesRepository,
  };
}

export function defaultNotificationEmitter(): NotificationEmitterService {
  return {
    emitWithContext: jest.fn(),
    emitTrxProcessedOdl: jest.fn(),
    odlContext: jest.fn().mockReturnValue({
      blockNum: 1,
      trxId: 'tx1',
      occurredAt: new Date().toISOString(),
    }),
    emit: jest.fn(),
    hiveContext: jest.fn(),
    emitTrxProcessedHive: jest.fn(),
    emitTrxProcessed: jest.fn(),
  } as unknown as NotificationEmitterService;
}
