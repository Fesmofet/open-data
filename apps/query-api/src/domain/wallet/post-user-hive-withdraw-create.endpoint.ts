import { Injectable } from '@nestjs/common';

import { HiveChangellyWithdrawService } from './hive-changelly-withdraw.service';
import type {
  HiveChangellyWithdrawCreateBody,
  HiveChangellyWithdrawCreateResponse,
} from './schemas/hive-changelly-withdraw.schema';

@Injectable()
export class PostUserHiveWithdrawCreateEndpoint {
  constructor(private readonly withdraw: HiveChangellyWithdrawService) {}

  async execute(
    profileAccountName: string,
    body: HiveChangellyWithdrawCreateBody,
  ): Promise<HiveChangellyWithdrawCreateResponse | null> {
    return this.withdraw.create(profileAccountName, body);
  }
}
