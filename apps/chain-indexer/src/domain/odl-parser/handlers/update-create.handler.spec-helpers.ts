import type { HiveClient } from '@opden-data-layer/clients';
import type { ObjectsCore } from '@opden-data-layer/core';
import type {
  AccountSyncQueueRepository,
  AccountsCurrentRepository,
} from '../../../repositories';

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
