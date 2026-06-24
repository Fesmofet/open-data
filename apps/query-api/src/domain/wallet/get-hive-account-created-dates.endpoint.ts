import { Injectable } from '@nestjs/common';
import { minYmd } from '@opden-data-layer/core/hive-account-history';

import type {
  HiveAccountCreatedDatesBody,
  HiveAccountCreatedDatesResponse,
} from './schemas/hive-account-created-dates.schema';
import { HiveAccountCreationDateService } from './hive-account-creation-date.service';

@Injectable()
export class GetHiveAccountCreatedDatesEndpoint {
  constructor(
    private readonly creationDates: HiveAccountCreationDateService,
  ) {}

  async execute(
    body: HiveAccountCreatedDatesBody,
  ): Promise<HiveAccountCreatedDatesResponse> {
    const dates = await this.creationDates.resolveDates(body.accounts);
    return {
      dates,
      startDateYmd: minYmd(Object.values(dates)),
    };
  }
}
