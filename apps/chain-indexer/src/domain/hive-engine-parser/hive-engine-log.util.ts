import type { HiveEngineTokensLogEvent, HiveEngineTransaction } from '@opden-data-layer/clients';

export type HiveEngineLogsPayload = {
  events?: HiveEngineTokensLogEvent[];
  errors?: unknown;
};

/**
 * Parse Hive Engine transaction logs JSON into log events.
 */
export function parseHiveEngineLogs(tx: HiveEngineTransaction): HiveEngineTokensLogEvent[] {
  try {
    const logs = JSON.parse(tx.logs) as HiveEngineLogsPayload;
    return logs.events ?? [];
  } catch {
    return [];
  }
}

export function hiveEngineLogsHaveErrors(tx: HiveEngineTransaction): boolean {
  try {
    const logs = JSON.parse(tx.logs) as HiveEngineLogsPayload;
    return logs.errors !== undefined && logs.errors !== null;
  } catch {
    return true;
  }
}
