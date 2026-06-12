import type {
  HiveEngineAccountHistoryEntry,
  HiveEngineAccountHistoryParams,
} from '../type';

export interface HiveEngineHistoryClientInterface {
  accountHistory(
    params: HiveEngineAccountHistoryParams,
  ): Promise<HiveEngineAccountHistoryEntry[]>;
}
