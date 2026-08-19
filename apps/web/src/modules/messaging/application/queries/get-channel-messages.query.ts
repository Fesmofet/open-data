import { fetchChannelMessages } from '../../infrastructure/messaging.client';
import type { MessageHistoryPage } from '../../domain/messaging.types';

const EMPTY_PAGE: MessageHistoryPage = { items: [], cursor: null, hasMore: false };

export async function getChannelMessagesQuery(
  channelId: string,
  viewer: string,
  params: { limit?: number; cursor?: string } = {},
): Promise<MessageHistoryPage> {
  const page = await fetchChannelMessages(channelId, viewer, params);
  return page ?? EMPTY_PAGE;
}
