import { redirect } from 'next/navigation';

import {
  getChannelMessagesQuery,
  getChannelByIdQuery,
  getViewerChannelsQuery,
  MessagingInboxClient,
} from '@/modules/messaging';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export default async function UserProfileMessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ channel?: string; peer?: string }>;
}) {
  const { name } = await params;
  const { channel: channelParam, peer: peerParam } = await searchParams;
  const accountName = decodeURIComponent(name);
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  const viewer = user?.username?.trim() ?? null;

  if (!viewer) {
    redirect(`/sign-in?next=${encodeURIComponent(`/@${accountName}/messages`)}`);
  }

  if (viewer.toLowerCase() !== accountName.toLowerCase()) {
    redirect(`/@${viewer}/messages`);
  }

  const initialChannels = await getViewerChannelsQuery(viewer, { limit: 20 });
  const initialPeer = peerParam?.trim() || null;
  const channelFromUrl = channelParam?.trim() || null;

  if (!channelFromUrl && !initialPeer && initialChannels.items[0]?.channel_id) {
    redirect(
      `/@${accountName}/messages?${new URLSearchParams({
        channel: initialChannels.items[0].channel_id,
      }).toString()}`,
    );
  }

  const initialChannelId = channelFromUrl;

  const initialMessages =
    initialChannelId && !initialPeer
    ? await getChannelMessagesQuery(initialChannelId, viewer, { limit: 50 })
    : { items: [], cursor: null, hasMore: false };

  const initialChannelDetail =
    initialChannelId && !initialPeer
    ? await getChannelByIdQuery(initialChannelId, viewer)
    : null;

  return (
    <MessagingInboxClient
      viewerUsername={viewer}
      accountName={accountName}
      initialChannels={initialChannels}
      initialChannelId={initialChannelId}
      initialPeer={initialPeer}
      initialMessages={initialMessages}
      initialChannelDetail={initialChannelDetail}
      listInLeftRail
    />
  );
}
