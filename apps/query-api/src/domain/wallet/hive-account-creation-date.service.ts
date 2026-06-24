import { Injectable, Logger } from '@nestjs/common';
import { HiveClient } from '@opden-data-layer/clients';
import {
  HIVE_OPERATION_INDEX,
  hiveTimestampToYmd,
  makeOperationBitMask,
} from '@opden-data-layer/core/hive-account-history';

import { AccountsCurrentRepository } from '../../repositories';

const ACCOUNT_CREATED_FILTER = makeOperationBitMask([
  HIVE_OPERATION_INDEX.account_created,
]);

@Injectable()
export class HiveAccountCreationDateService {
  private readonly logger = new Logger(HiveAccountCreationDateService.name);

  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly hiveClient: HiveClient,
  ) {}

  async resolveDates(accounts: readonly string[]): Promise<Record<string, string | null>> {
    const names = [...new Set(accounts.map((name) => name.trim().toLowerCase()))].filter(
      (name) => name !== '',
    );
    if (names.length === 0) {
      return {};
    }

    const dates: Record<string, string | null> = Object.fromEntries(
      names.map((name) => [name, null]),
    );

    const rows = await this.accounts.findByNames(names);
    for (const row of rows) {
      const ymd = row.created ? hiveTimestampToYmd(row.created) : null;
      if (ymd) {
        dates[row.name] = ymd;
      }
    }

    const missingAfterDb = names.filter((name) => dates[name] === null);
    if (missingAfterDb.length > 0) {
      await this.fillFromGetAccounts(missingAfterDb, dates);
    }

    const missingAfterRpc = names.filter((name) => dates[name] === null);
    for (const name of missingAfterRpc) {
      const ymd = await this.resolveFromAccountHistory(name);
      dates[name] = ymd;
    }

    return dates;
  }

  private async fillFromGetAccounts(
    names: readonly string[],
    dates: Record<string, string | null>,
  ): Promise<void> {
    const hiveAccounts = await this.hiveClient.getAccounts([...names]);
    for (const hive of hiveAccounts) {
      const accountName = hive.name?.trim().toLowerCase();
      if (!accountName || dates[accountName] !== null) {
        continue;
      }
      const ymd = hive.created ? hiveTimestampToYmd(hive.created) : null;
      if (ymd) {
        dates[accountName] = ymd;
      }
    }
  }

  private async resolveFromAccountHistory(account: string): Promise<string | null> {
    const page = await this.hiveClient.getAccountHistory(
      account,
      -1,
      1,
      ACCOUNT_CREATED_FILTER,
    );
    const row = page?.rows[0];
    if (!row) {
      this.logger.warn(`No account_created history for ${account}`);
      return null;
    }

    const [, entry] = row;
    if (entry.op[0] !== 'account_created') {
      this.logger.warn(`Unexpected op ${entry.op[0]} for ${account} account_created lookup`);
      return null;
    }

    const payload = entry.op[1];
    const newAccountName = String(payload.new_account_name ?? '')
      .trim()
      .toLowerCase();
    if (newAccountName !== account) {
      this.logger.warn(
        `account_created name mismatch for ${account}: got ${newAccountName || '(empty)'}`,
      );
      return null;
    }

    return hiveTimestampToYmd(entry.timestamp);
  }
}
