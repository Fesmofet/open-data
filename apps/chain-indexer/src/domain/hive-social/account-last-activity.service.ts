import { Injectable, Logger } from '@nestjs/common';
import type { HiveTransaction } from '@opden-data-layer/clients';
import { AccountsCurrentRepository } from '../../repositories/accounts-current.repository';
import { collectActiveAccountNamesFromBlock } from './account-last-activity.util';

@Injectable()
export class AccountLastActivityService {
  private readonly logger = new Logger(AccountLastActivityService.name);

  constructor(private readonly accounts: AccountsCurrentRepository) {}

  /**
   * Batch-touch `accounts_current.last_activity` for every account that
   * appeared in the block (legacy `updateLastActivity`).
   */
  async touchFromBlock(
    transactions: ReadonlyArray<Pick<HiveTransaction, 'operations'>>,
    blockTimestamp: string,
  ): Promise<void> {
    const names = collectActiveAccountNamesFromBlock(transactions);
    if (names.length === 0) {
      return;
    }

    const timestampUnix = Math.floor(Date.parse(blockTimestamp) / 1000);
    if (!Number.isFinite(timestampUnix) || timestampUnix <= 0) {
      this.logger.warn(`skip last_activity touch: invalid block timestamp ${blockTimestamp}`);
      return;
    }

    try {
      await this.accounts.touchLastActivity(names, timestampUnix);
    } catch (e) {
      this.logger.error((e as Error).message);
    }
  }
}
