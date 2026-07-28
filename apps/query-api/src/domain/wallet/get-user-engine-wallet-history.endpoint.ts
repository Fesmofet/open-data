import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import { AccountsCurrentRepository } from '../../repositories';
import { decodeWaivWalletHistoryCursor } from './waiv-wallet-history-cursor';
import { EngineWalletHistoryPagerService } from './engine-wallet-history-pager.service';
import type {
  EngineWalletHistoryBody,
  EngineWalletHistoryResponse,
} from './schemas/engine-wallet-history.schema';
import { ENGINE_WALLET_HISTORY_DEFAULT_LIMIT } from './schemas/engine-wallet-history.schema';

@Injectable()
export class GetUserEngineWalletHistoryEndpoint {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly pager: EngineWalletHistoryPagerService,
  ) {}

  async execute(
    profileAccountName: string,
    body: EngineWalletHistoryBody,
  ): Promise<EngineWalletHistoryResponse | null> {
    const accountRow = await this.accounts.findByName(profileAccountName);
    if (!accountRow) {
      return null;
    }

    if (body.cursor && !decodeWaivWalletHistoryCursor(body.cursor)) {
      throw new BadRequestException('Invalid engine wallet history cursor');
    }

    const pageLimit = body.limit ?? ENGINE_WALLET_HISTORY_DEFAULT_LIMIT;
    const result = await this.pager.collectPage({
      account: profileAccountName,
      limit: pageLimit,
      cursor: body.cursor ?? null,
    });

    if (
      result.rpcUnavailable &&
      result.items.length === 0 &&
      !body.cursor
    ) {
      throw new ServiceUnavailableException('Hive Engine history unavailable');
    }

    return {
      items: result.items.filter(
        (item): item is typeof item & { source: 'rpc' | 'swap' | 'deposit' } =>
          item.source === 'rpc' ||
          item.source === 'swap' ||
          item.source === 'deposit',
      ),
      cursor: result.cursor,
      hasMore: result.hasMore,
    };
  }
}
