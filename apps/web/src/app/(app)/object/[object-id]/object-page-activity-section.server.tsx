import {
  getObjectChannelMessagesQuery,
  getObjectChannelQuery,
  ObjectActivityFeedClient,
} from '@/modules/messaging';

import { resolveObjectMessagesSectionProps } from './object-page-messages-section.helpers';

export type ObjectPageActivityFeedSectionProps = {
  objectId: string;
  objectName: string;
  viewerUsername: string | null;
};

export async function ObjectPageActivityFeedSection({
  objectId,
  objectName,
  viewerUsername,
}: ObjectPageActivityFeedSectionProps) {
  const channel = await getObjectChannelQuery(objectId, viewerUsername);
  const initialMessages = channel
    ? await getObjectChannelMessagesQuery(objectId, { limit: 50 }, viewerUsername)
    : null;

  const props = resolveObjectMessagesSectionProps({
    objectId,
    objectName,
    viewerUsername,
    channel,
    initialMessages,
  });

  return (
    <ObjectActivityFeedClient
      objectId={props.objectId}
      objectName={props.objectName}
      viewerUsername={props.viewerUsername}
      channel={props.channel}
      channelExists={channel != null}
      initialMessages={props.initialMessages}
    />
  );
}
