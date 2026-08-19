import { getViewerChannelsQuery } from '../application/queries/get-viewer-channels.query';
import { MessagingChannelListRail } from './messaging-channel-list-rail';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export type RenderProfileMessagesLeftSidebarInput = {
  accountName: string;
  searchParams?: Promise<{ channel?: string; peer?: string }>;
  channel?: string | null;
  peer?: string | null;
};

export async function renderProfileMessagesLeftSidebar({
  accountName,
  searchParams,
  channel: channelOverride,
  peer: peerOverride,
}: RenderProfileMessagesLeftSidebarInput) {
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const channel = channelOverride ?? resolvedSearch?.channel;
  const peer = peerOverride ?? resolvedSearch?.peer;

  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  const viewer = user?.username?.trim() ?? null;

  if (!viewer || viewer.toLowerCase() !== accountName.toLowerCase()) {
    return null;
  }

  const initialChannels = await getViewerChannelsQuery(viewer, { limit: 50 });
  const activeChannelId = channel?.trim() || null;

  return (
    <MessagingChannelListRail
      accountName={accountName}
      viewerUsername={viewer}
      channels={initialChannels.items}
      activeChannelId={activeChannelId}
    />
  );
}
