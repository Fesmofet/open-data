import type {
  HiveEngineAccountHistoryEntry,
  HiveEngineAccountHistoryParams,
} from '../type';

export type HiveEngineAccountHistoryResult = {
  entries: HiveEngineAccountHistoryEntry[];
  unavailable: boolean;
};

export interface HiveEngineHistoryClientInterface {
  accountHistory(
    params: HiveEngineAccountHistoryParams,
  ): Promise<HiveEngineAccountHistoryEntry[]>;
  accountHistoryWithStatus(
    params: HiveEngineAccountHistoryParams,
  ): Promise<HiveEngineAccountHistoryResult>;
}
