import {
  fetchObjectChannel,
  fetchObjectChannelMessages,
} from '../../infrastructure/messaging.client';
import type { ChannelDetail, MessageHistoryPage } from '../../domain/messaging.types';

const EMPTY_MESSAGES: MessageHistoryPage = { items: [], cursor: null, hasMore: false };

export async function getObjectChannelQuery(
  objectId: string,
  viewer?: string | null,
): Promise<ChannelDetail | null> {
  return fetchObjectChannel(objectId, viewer);
}

export async function getObjectChannelMessagesQuery(
  objectId: string,
  params: { limit?: number; cursor?: string } = {},
  viewer?: string | null,
): Promise<MessageHistoryPage> {
  const page = await fetchObjectChannelMessages(objectId, params, viewer);
  return page ?? EMPTY_MESSAGES;
}
