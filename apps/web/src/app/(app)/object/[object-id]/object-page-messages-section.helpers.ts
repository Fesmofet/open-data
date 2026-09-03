import type { ChannelDetail, MessageHistoryPage } from '@/modules/messaging/domain/messaging.types';
import { buildSyntheticObjectChannel } from '@/modules/messaging/domain/messaging.helpers';

const EMPTY_MESSAGES: MessageHistoryPage = { items: [], cursor: null, hasMore: false };

export type ObjectMessagesSectionProps = {
  objectId: string;
  objectName: string;
  viewerUsername: string | null;
  channel: ChannelDetail;
  initialMessages: MessageHistoryPage;
};

export function resolveObjectMessagesSectionProps(input: {
  objectId: string;
  objectName: string;
  viewerUsername: string | null;
  channel: ChannelDetail | null;
  initialMessages?: MessageHistoryPage | null;
}): ObjectMessagesSectionProps {
  const channel =
    input.channel ??
    buildSyntheticObjectChannel({
      objectId: input.objectId,
      objectName: input.objectName,
      viewerUsername: input.viewerUsername,
    });

  return {
    objectId: input.objectId,
    objectName: input.objectName,
    viewerUsername: input.viewerUsername,
    channel,
    initialMessages: input.initialMessages ?? EMPTY_MESSAGES,
  };
}
