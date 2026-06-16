import 'server-only';

import { UPDATE_TYPES } from '@opden-data-layer/core/update-types';

import { objectUpdatesFeedResponseSchema } from '@/modules/object-updates/application/dto/object-updates-feed.dto';
import { fetchObjectUpdatesFeed } from '@/modules/object-updates/infrastructure/clients/object-updates.client';

import type { TagApprovalStat, TagApprovalStatsIndex } from '../domain/tag-approval-stats';

const TAG_APPROVAL_PAGE_LIMIT = 50;
const TAG_APPROVAL_MAX_PAGES = 20;

async function mergeTagCategoryItemsIntoIndex(
  objectId: string,
  init: { locale: string; viewer?: string | null },
  byUpdateId: Record<string, TagApprovalStat>,
): Promise<void> {
  let cursor: string | null = null;
  for (let page = 0; page < TAG_APPROVAL_MAX_PAGES; page += 1) {
    const raw = await fetchObjectUpdatesFeed({
      objectId,
      locale: init.locale,
      viewer: init.viewer ?? null,
      update_type: UPDATE_TYPES.TAG_CATEGORY_ITEM,
      sort: 'approval',
      limit: TAG_APPROVAL_PAGE_LIMIT,
      cursor,
    });

    if (raw == null) {
      break;
    }

    const parsed = objectUpdatesFeedResponseSchema.safeParse(raw);
    if (!parsed.success) {
      break;
    }

    for (const item of parsed.data.items) {
      byUpdateId[item.update_id] = {
        approvePercent: item.approve_percent,
        forCount: item.for_vote_count,
        againstCount: item.against_vote_count,
        viewer_vote: item.viewer_vote,
        updateId: item.update_id,
      };
    }

    if (!parsed.data.hasMore || !parsed.data.cursor) {
      break;
    }
    cursor = parsed.data.cursor;
  }
}

export async function loadTagApprovalStatsIndex(
  objectId: string,
  init: { locale: string; viewer?: string | null },
): Promise<TagApprovalStatsIndex> {
  const byUpdateId: Record<string, TagApprovalStat> = {};
  await mergeTagCategoryItemsIntoIndex(objectId, init, byUpdateId);
  return { byUpdateId };
}
