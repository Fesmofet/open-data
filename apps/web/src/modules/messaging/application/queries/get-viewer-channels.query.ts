import { fetchViewerChannels } from '../../infrastructure/messaging.client';
import type { ChannelListPage } from '../../domain/messaging.types';

const EMPTY_PAGE: ChannelListPage = { items: [], cursor: null, hasMore: false };

export async function getViewerChannelsQuery(
  viewer: string,
  params: { kind?: string; cursor?: string; limit?: number } = {},
): Promise<ChannelListPage> {
  const page = await fetchViewerChannels(viewer, params);
  return page ?? EMPTY_PAGE;
}
