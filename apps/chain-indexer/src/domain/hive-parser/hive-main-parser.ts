import { Inject, Injectable, Logger } from '@nestjs/common';
import { SignedBlock } from '@hiveio/dhive/lib/chain/block';
import { HiveTransaction } from '@opden-data-layer/clients';
import { AccountLastActivityService } from '../hive-social/account-last-activity.service';
import type { HiveOperationHandlerContext } from './hive-handler-context';
import {
  HIVE_OPERATION_HANDLERS,
  type RegisteredHiveOperationHandler,
} from './hive-operation-handler';

@Injectable()
export class HiveMainParser {
  private readonly logger = new Logger(HiveMainParser.name);
  private readonly handlers: Map<string, RegisteredHiveOperationHandler>;

  constructor(
    @Inject(HIVE_OPERATION_HANDLERS)
    handlers: RegisteredHiveOperationHandler[],
    private readonly accountLastActivity: AccountLastActivityService,
  ) {
    this.handlers = new Map(handlers.map((h) => [h.operation, h]));
  }

  async parseBlock(block: SignedBlock): Promise<void> {
    const transactions = block.transactions as HiveTransaction[];
    const { timestamp } = block;

    for (let transactionIndex = 0; transactionIndex < transactions.length; transactionIndex++) {
      const transaction = transactions[transactionIndex];
      if (!transaction?.operations?.length) continue;

      const operations = transaction.operations as [
        string,
        Record<string, unknown>,
      ][];
      for (let operationIndex = 0; operationIndex < operations.length; operationIndex++) {
        const [type, payload] = operations[operationIndex];
        const handler = this.handlers.get(type);
        if (!handler) continue;

        const context: HiveOperationHandlerContext = {
          transaction,
          timestamp,
          blockNum: transaction.block_num,
          transactionIndex,
          operationIndex,
        };
        try {
          await handler.handle(payload, context);
        } catch (error: unknown) {
          const base =
            error instanceof Error ? error.message : String(error);
          const pgDetail =
            error &&
            typeof error === 'object' &&
            'detail' in error &&
            typeof (error as { detail?: unknown }).detail === 'string'
              ? (error as { detail: string }).detail
              : '';
          this.logger.error(
            `Handler [${type}] failed: ${base}${pgDetail ? ` | ${pgDetail}` : ''}`,
          );
        }
      }
    }

    await this.accountLastActivity.touchFromBlock(transactions, timestamp);
  }
}
