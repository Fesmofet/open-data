import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import { AccountsCurrentRepository } from '../../repositories';
import { decodeWaivWalletHistoryCursor } from './waiv-wallet-history-cursor';
import type { WaivWalletHistoryBody, WaivWalletHistoryResponse } from './schemas/waiv-wallet-history.schema';
import { WAIV_WALLET_HISTORY_DEFAULT_LIMIT } from './schemas/waiv-wallet-history.schema';
import { WaivWalletHistoryPagerService } from './waiv-wallet-history-pager.service';

@Injectable()
export class GetUserWaivWalletHistoryEndpoint {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly pager: WaivWalletHistoryPagerService,
  ) {}

  async execute(
    profileAccountName: string,
    body: WaivWalletHistoryBody,
  ): Promise<WaivWalletHistoryResponse | null> {
    const accountRow = await this.accounts.findByName(profileAccountName);
    if (!accountRow) {
      return null;
    }

    if (body.cursor && !decodeWaivWalletHistoryCursor(body.cursor)) {
      throw new BadRequestException('Invalid WAIV wallet history cursor');
    }

    const pageLimit = body.limit ?? WAIV_WALLET_HISTORY_DEFAULT_LIMIT;
    const result = await this.pager.collectPage({
      account: profileAccountName,
      limit: pageLimit,
      cursor: body.cursor ?? null,
      showRewards: body.showRewards ?? false,
    });

    if (
      result.rpcUnavailable &&
      result.items.length === 0 &&
      !body.cursor
    ) {
      throw new ServiceUnavailableException('Hive Engine history unavailable');
    }

    return {
      items: result.items,
      cursor: result.cursor,
      hasMore: result.hasMore,
    };
  }
}
