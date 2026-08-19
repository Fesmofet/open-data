import {
  getObjectChannelMessagesQuery,
  getObjectChannelQuery,
  ObjectChannelMessagesClient,
} from '@/modules/messaging';

import { resolveObjectMessagesSectionProps } from './object-page-messages-section.helpers';

export type ObjectPageMessagesFeedSectionProps = {
  objectId: string;
  objectName: string;
  viewerUsername: string | null;
};

export async function ObjectPageMessagesFeedSection({
  objectId,
  objectName,
  viewerUsername,
}: ObjectPageMessagesFeedSectionProps) {
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
    <ObjectChannelMessagesClient
      objectId={props.objectId}
      objectName={props.objectName}
      viewerUsername={props.viewerUsername}
      channel={props.channel}
      channelExists={channel != null}
      initialMessages={props.initialMessages}
    />
  );
}
