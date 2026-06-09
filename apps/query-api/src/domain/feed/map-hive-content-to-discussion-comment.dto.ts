import type { HiveContentType } from '@opden-data-layer/clients';

import type { DiscussionCommentDto, FeedStoryItemDto } from './feed-story-dtos';
import { mapHiveContentToFeedStoryItemDto } from './map-hive-content-to-feed-story-item.dto';

/** Maps Hive comment node to discussion row with full `body` (excerpt stays feed-sized). */
export function mapHiveContentToDiscussionCommentDto(
  content: HiveContentType,
  authorProfile: FeedStoryItemDto['authorProfile'],
  viewerAccount: string | undefined,
): DiscussionCommentDto {
  const base = mapHiveContentToFeedStoryItemDto(
    content,
    authorProfile,
    viewerAccount,
    false,
  );
  return {
    ...base,
    body: content.body ?? '',
  };
}
