import 'server-only';

import { queryApiFetch } from '@/modules/user-profile/infrastructure/clients/query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

import type {
  ChannelDetail,
  ChannelListPage,
  MessageHistoryPage,
} from '../domain/messaging.types';

function viewerHeaders(viewer: string | null | undefined): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const name = viewer?.trim();
  if (name) {
    headers['X-Viewer'] = name;
  }
  return headers;
}

export async function fetchViewerChannels(
  viewer: string,
  params: { kind?: string; cursor?: string; limit?: number } = {},
): Promise<ChannelListPage | null> {
  const search = new URLSearchParams();
  if (params.kind) {
    search.set('kind', params.kind);
  }
  if (params.cursor) {
    search.set('cursor', params.cursor);
  }
  if (params.limit != null) {
    search.set('limit', String(params.limit));
  }
  const qs = search.toString();
  const path = `/query/v1/channels${qs ? `?${qs}` : ''}`;
  return queryApiFetch<ChannelListPage>(path, {
    headers: viewerHeaders(viewer),
    cacheTags: [queryApiCacheTags.viewerChannels(viewer)],
  });
}

export async function fetchChannelById(
  channelId: string,
  viewer: string,
): Promise<ChannelDetail | null> {
  const path = `/query/v1/channels/${encodeURIComponent(channelId)}`;
  return queryApiFetch<ChannelDetail>(path, {
    headers: viewerHeaders(viewer),
    cacheTags: [queryApiCacheTags.channelDetail(channelId)],
  });
}

export async function fetchChannelMessages(
  channelId: string,
  viewer: string,
  body: { limit?: number; cursor?: string } = {},
): Promise<MessageHistoryPage | null> {
  const path = `/query/v1/channels/${encodeURIComponent(channelId)}/messages`;
  return queryApiFetch<MessageHistoryPage>(path, {
    method: 'POST',
    headers: viewerHeaders(viewer),
    body: JSON.stringify(body),
    cacheTags: [queryApiCacheTags.channelMessages(channelId)],
  });
}

export async function markChannelRead(
  channelId: string,
  viewer: string,
  lastReadAtUnix: number,
): Promise<{ updated: boolean; last_read_at_unix: number } | null> {
  const path = `/query/v1/channels/${encodeURIComponent(channelId)}/read`;
  return queryApiFetch<{ updated: boolean; last_read_at_unix: number }>(path, {
    method: 'POST',
    headers: viewerHeaders(viewer),
    body: JSON.stringify({ last_read_at_unix: lastReadAtUnix }),
    cache: 'no-store',
  });
}

export async function fetchObjectChannel(
  objectId: string,
  viewer?: string | null,
): Promise<ChannelDetail | null> {
  const path = `/query/v1/objects/${encodeURIComponent(objectId)}/channel`;
  return queryApiFetch<ChannelDetail>(path, {
    headers: viewerHeaders(viewer),
    cacheTags: [queryApiCacheTags.objectChannel(objectId)],
  });
}

export async function fetchObjectChannelMessages(
  objectId: string,
  body: { limit?: number; cursor?: string } = {},
  viewer?: string | null,
): Promise<MessageHistoryPage | null> {
  const path = `/query/v1/objects/${encodeURIComponent(objectId)}/channel/messages`;
  return queryApiFetch<MessageHistoryPage>(path, {
    method: 'POST',
    headers: viewerHeaders(viewer),
    body: JSON.stringify(body),
    cacheTags: [queryApiCacheTags.objectChannelMessages(objectId)],
  });
}
