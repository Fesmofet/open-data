import { Injectable } from '@nestjs/common';

import { HiveChangellyWithdrawService } from './hive-changelly-withdraw.service';
import type {
  HiveChangellyWithdrawEstimateBody,
  HiveChangellyWithdrawEstimateResponse,
} from './schemas/hive-changelly-withdraw.schema';

@Injectable()
export class PostUserHiveWithdrawEstimateEndpoint {
  constructor(private readonly withdraw: HiveChangellyWithdrawService) {}

  async execute(
    profileAccountName: string,
    body: HiveChangellyWithdrawEstimateBody,
  ): Promise<HiveChangellyWithdrawEstimateResponse | null> {
    return this.withdraw.estimate(
      profileAccountName,
      body.amount,
      body.outputCoinType,
    );
  }
}
