import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  HiveClient,
  HiveNodeUnavailableError,
} from '@opden-data-layer/clients';
import { CurrencyQueryService } from '@opden-data-layer/currency';

import { AccountsCurrentRepository } from '../../repositories';
import { HiveGlobalPropertiesCache } from '../feed/hive-global-properties.cache';
import {
  buildHiveWalletSummary,
  canClaimHbdInterest,
  daysUntilHbdInterestClaim,
  mapHiveAccountToBalanceFields,
  mapRcAccountToSnapshot,
  parseSavingsWithdrawAsset,
} from './build-hive-wallet-summary';
import type { HiveWalletResponse } from './schemas/hive-wallet.schema';

function parseCoingeckoUsd(block: unknown): number {
  if (!block || typeof block !== 'object') {
    return 0;
  }
  const usd = (block as { usd?: unknown }).usd;
  const parsed = Number(usd);
  return Number.isFinite(parsed) ? parsed : 0;
}

@Injectable()
export class GetUserHiveWalletEndpoint {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly hiveClient: HiveClient,
    private readonly hiveGlobalProperties: HiveGlobalPropertiesCache,
    private readonly currencyQuery: CurrencyQueryService,
  ) {}

  async execute(profileAccountName: string): Promise<HiveWalletResponse | null> {
    const accountRow = await this.accounts.findByName(profileAccountName);
    if (!accountRow) {
      return null;
    }

    const normalized = profileAccountName.trim().toLowerCase();

    try {
      const [hiveAccounts, chainContext, rcAccounts, savingsPending, market] =
        await Promise.all([
          this.hiveClient.getAccountsStrict([normalized]),
          this.hiveGlobalProperties.getChainContextFields(),
          this.hiveClient.findRcAccountsStrict([normalized]),
          this.hiveClient.getSavingsWithdrawFromStrict(normalized),
          this.currencyQuery.marketInfo({}),
        ]);

      const hiveAccount = hiveAccounts[0];
      if (!hiveAccount) {
        throw new HiveNodeUnavailableError('Hive account not found on chain');
      }

      const hbdInterestRatePercent = chainContext.hbdInterestRatePercent;

      const rcRow = rcAccounts[0];
      const rcMax =
        rcRow?.max_rc != null ? String(rcRow.max_rc) : '0';
      const rcSnapshot = mapRcAccountToSnapshot(rcRow);

      const balance = mapHiveAccountToBalanceFields(
        hiveAccount,
        {
          totalVestingShares: chainContext.totalVestingShares,
          totalVestingFundSteem: chainContext.totalVestingFundSteem,
          hbdInterestRatePercent,
        },
        rcMax,
      );

      const hiveUsd = parseCoingeckoUsd(market.current.hive);
      const hbdUsd = parseCoingeckoUsd(market.current.hive_dollar);

      const pendingSavingsWithdrawals = savingsPending.map((row) => ({
        requestId: row.request_id,
        amount: row.amount,
        asset: parseSavingsWithdrawAsset(row.amount),
        to: row.to,
        memo: row.memo,
        complete: row.complete,
      }));

      const summary = buildHiveWalletSummary(
        balance,
        { hiveUsd, hbdUsd },
        {
          canClaimInterest: canClaimHbdInterest(
            hiveAccount.savings_hbd_last_interest_payment,
          ),
          daysUntilInterestClaim: daysUntilHbdInterestClaim(
            hiveAccount.savings_hbd_last_interest_payment,
          ),
          nextVestingWithdrawal: hiveAccount.next_vesting_withdrawal ?? null,
          pendingSavingsWithdrawals,
          rc: rcSnapshot,
        },
      );

      return {
        account: profileAccountName,
        ...summary,
        chain: {
          totalVestingShares: chainContext.totalVestingShares,
          totalVestingFundSteem: chainContext.totalVestingFundSteem,
        },
        rates: { hiveUsd, hbdUsd },
      };
    } catch (e) {
      if (e instanceof HiveNodeUnavailableError) {
        throw new ServiceUnavailableException('Hive node unavailable');
      }
      throw e;
    }
  }
}
