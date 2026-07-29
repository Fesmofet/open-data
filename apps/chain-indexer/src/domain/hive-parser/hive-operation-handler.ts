import type { HiveOperationHandlerContext } from './hive-handler-context';

export const HIVE_OPERATION_HANDLERS = Symbol('HIVE_OPERATION_HANDLERS');

export interface RegisteredHiveOperationHandler {
  readonly operation: string;
  handle(
    payload: Record<string, unknown>,
    context: HiveOperationHandlerContext,
  ): Promise<void>;
}
