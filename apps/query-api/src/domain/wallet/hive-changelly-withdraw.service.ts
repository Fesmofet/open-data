import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ChangellyClient, HiveClient, HiveNodeUnavailableError } from '@opden-data-layer/clients';
import { CurrencyQueryService } from '@opden-data-layer/currency';

import { AccountsCurrentRepository } from '../../repositories';
import {
  HIVE_CHANGELLY_WITHDRAW_USD_CAP,
  hasHiveBalanceForChangellyWithdraw,
  isHiveWithdrawAmountWithinPairLimits,
  isHiveWithdrawAmountWithinUsdCap,
  normalizeHiveChangellyOutputCoin,
  parseLiquidHiveBalance,
  type HiveChangellyOutputCoin,
} from './hive-changelly-withdraw.constants';
import type {
  HiveChangellyWithdrawCreateResponse,
  HiveChangellyWithdrawEstimateResponse,
  HiveChangellyWithdrawRangeResponse,
} from './schemas/hive-changelly-withdraw.schema';

function parseCoingeckoUsd(block: unknown): number {
  if (!block || typeof block !== 'object') {
    return 0;
  }
  const usd = (block as { usd?: unknown }).usd;
  const parsed = Number(usd);
  return Number.isFinite(parsed) ? parsed : 0;
}

@Injectable()
export class HiveChangellyWithdrawService {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly hiveClient: HiveClient,
    private readonly changellyClient: ChangellyClient,
    private readonly currencyQuery: CurrencyQueryService,
  ) {}

  private assertOutputCoin(outputCoinType: string): HiveChangellyOutputCoin {
    const coin = normalizeHiveChangellyOutputCoin(outputCoinType);
    if (!coin) {
      throw new BadRequestException('Unsupported output coin');
    }
    return coin;
  }

  private async getLiquidHiveBalance(accountName: string): Promise<number> {
    try {
      const accounts = await this.hiveClient.getAccountsStrict([
        accountName.trim().toLowerCase(),
      ]);
      const row = accounts[0];
      if (!row) {
        throw new HiveNodeUnavailableError('Hive account not found on chain');
      }
      return parseLiquidHiveBalance(row.balance ?? '0 HIVE');
    } catch (e) {
      if (e instanceof HiveNodeUnavailableError) {
        throw new ServiceUnavailableException('Hive node unavailable');
      }
      throw e;
    }
  }

  private async getHiveUsdRate(): Promise<number> {
    const market = await this.currencyQuery.marketInfo({});
    return parseCoingeckoUsd(market.current.hive);
  }

  private async getPairLimits(outputCoinType: HiveChangellyOutputCoin) {
    const { result, error } = await this.changellyClient.getPairsParams({
      to: outputCoinType,
    });
    if (error || !result) {
      throw new ServiceUnavailableException('Changelly unavailable');
    }
    return {
      min: Number.parseFloat(result.minAmountFloat),
      max: Number.parseFloat(result.maxAmountFloat),
    };
  }

  async getRange(
    profileAccountName: string,
    outputCoinType: string,
  ): Promise<HiveChangellyWithdrawRangeResponse | null> {
    const accountRow = await this.accounts.findByName(profileAccountName);
    if (!accountRow) {
      return null;
    }
    const coin = this.assertOutputCoin(outputCoinType);
    const pair = await this.getPairLimits(coin);
    const { result, error } = await this.changellyClient.getExchangeAmount({
      to: coin,
      amountFrom: 1,
    });
    if (error || !result) {
      throw new ServiceUnavailableException('Changelly unavailable');
    }
    return {
      min: String(pair.min),
      max: String(pair.max),
      rate: result.amountTo,
    };
  }

  async estimate(
    profileAccountName: string,
    amount: number,
    outputCoinType: string,
  ): Promise<HiveChangellyWithdrawEstimateResponse | null> {
    const accountRow = await this.accounts.findByName(profileAccountName);
    if (!accountRow) {
      return null;
    }
    const coin = this.assertOutputCoin(outputCoinType);
    const { result, error } = await this.changellyClient.getExchangeAmount({
      to: coin,
      amountFrom: amount,
    });
    if (error || !result) {
      throw new ServiceUnavailableException('Changelly unavailable');
    }
    return { result: result.amountTo };
  }

  async create(
    profileAccountName: string,
    input: {
      amount: number;
      outputCoinType: string;
      address: string;
    },
  ): Promise<HiveChangellyWithdrawCreateResponse | null> {
    const accountRow = await this.accounts.findByName(profileAccountName);
    if (!accountRow) {
      return null;
    }
    const coin = this.assertOutputCoin(input.outputCoinType);
    const [liquidHive, hiveUsd, pair] = await Promise.all([
      this.getLiquidHiveBalance(profileAccountName),
      this.getHiveUsdRate(),
      this.getPairLimits(coin),
    ]);

    if (liquidHive < input.amount) {
      throw new BadRequestException('Insufficient HIVE balance');
    }
    if (
      !hasHiveBalanceForChangellyWithdraw({
        liquidHive,
        amount: input.amount,
      })
    ) {
      throw new BadRequestException('Insufficient HIVE for tracking transfer');
    }
    if (
      !isHiveWithdrawAmountWithinUsdCap({
        amountHive: input.amount,
        hiveUsd,
        capUsd: HIVE_CHANGELLY_WITHDRAW_USD_CAP,
      })
    ) {
      throw new BadRequestException('Withdrawal exceeds USD cap');
    }
    if (
      !isHiveWithdrawAmountWithinPairLimits({
        amount: input.amount,
        min: pair.min,
        max: pair.max,
      })
    ) {
      throw new BadRequestException('Amount outside Changelly limits');
    }

    const { result, error } = await this.changellyClient.createTransaction({
      to: coin,
      amountFrom: input.amount,
      address: input.address,
      refundAddress: profileAccountName,
    });
    if (error || !result) {
      throw new ServiceUnavailableException('Changelly unavailable');
    }

    return {
      receiver: result.receiver,
      memo: result.memo,
      exchangeId: result.exchangeId,
      amount: input.amount,
      outputAmount: result.outputAmount,
      trackUrl: result.trackUrl,
    };
  }
}
