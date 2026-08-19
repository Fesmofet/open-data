import { fetchChannelById } from '../../infrastructure/messaging.client';
import type { ChannelDetail } from '../../domain/messaging.types';

export async function getChannelByIdQuery(
  channelId: string,
  viewer: string,
): Promise<ChannelDetail | null> {
  return fetchChannelById(channelId, viewer);
}
