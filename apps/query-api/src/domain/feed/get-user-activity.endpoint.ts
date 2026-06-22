import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ACTIVITY_DISPLAY_PAGE_SIZE,
  buildActivityFilterMask,
} from '@opden-data-layer/core/hive-account-history';

import { AccountsCurrentRepository } from '../../repositories';
import {
  decodeActivityCursor,
  encodeActivityCursor,
} from './activity-cursor';
import type { UserActivityResponse } from './activity-item-dtos';
import type { UserActivityBody } from './schemas/user-activity.schema';
import { HiveGlobalPropertiesCache } from './hive-global-properties.cache';
import { HiveAccountHistoryPagerService } from './hive-account-history-pager.service';

@Injectable()
export class GetUserActivityEndpoint {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly pager: HiveAccountHistoryPagerService,
    private readonly hiveGlobalProperties: HiveGlobalPropertiesCache,
  ) {}

  async execute(
    profileAccountName: string,
    body: UserActivityBody,
  ): Promise<UserActivityResponse | null> {
    const accountRow = await this.accounts.findByName(profileAccountName);
    if (!accountRow) {
      return null;
    }

    const cursorPayload = body.cursor ? decodeActivityCursor(body.cursor) : null;
    if (body.cursor && !cursorPayload) {
      throw new BadRequestException('Invalid activity cursor');
    }

    const filters = body.filters ?? [];
    const operationFilter = buildActivityFilterMask(filters);
    const pageLimit = body.limit ?? ACTIVITY_DISPLAY_PAGE_SIZE;
    const from = cursorPayload?.operationIndex ?? -1;
    const collected = await this.pager.collectItems({
      account: profileAccountName,
      startFrom: from,
      targetCount: pageLimit + 1,
      filters,
      operationFilter,
    });

    const pageItems = collected.items.slice(0, pageLimit);
    const hasMoreItems = collected.items.length > pageLimit;
    const canScanFurther =
      collected.resumeFrom !== null && collected.resumeFrom > 0;
    const hasMore = hasMoreItems || (pageItems.length < pageLimit && canScanFurther);
    const oldestInPage = pageItems[pageItems.length - 1];
    const cursor = hasMoreItems
      ? oldestInPage && oldestInPage.operationIndex > 0
        ? encodeActivityCursor({ operationIndex: oldestInPage.operationIndex - 1 })
        : null
      : canScanFurther && collected.resumeFrom !== null
        ? encodeActivityCursor({ operationIndex: collected.resumeFrom })
        : null;

    const chainContext = await this.hiveGlobalProperties.getChainContextFields();

    return {
      items: pageItems,
      cursor,
      hasMore,
      chainContext,
    };
  }
}
