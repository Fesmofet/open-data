import { Injectable } from '@nestjs/common';

import { HiveChangellyWithdrawService } from './hive-changelly-withdraw.service';
import type {
  HiveChangellyWithdrawRangeQuery,
  HiveChangellyWithdrawRangeResponse,
} from './schemas/hive-changelly-withdraw.schema';

@Injectable()
export class GetUserHiveWithdrawRangeEndpoint {
  constructor(private readonly withdraw: HiveChangellyWithdrawService) {}

  async execute(
    profileAccountName: string,
    query: HiveChangellyWithdrawRangeQuery,
  ): Promise<HiveChangellyWithdrawRangeResponse | null> {
    const result = await this.withdraw.getRange(
      profileAccountName,
      query.outputCoinType,
    );
    if (!result) {
      return null;
    }
    return result;
  }
}
