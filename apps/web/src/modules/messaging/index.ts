export type {
  ChannelDetail,
  ChannelListItem,
  ChannelListPage,
  MessageHistoryPage,
  MessageItem,
  MessagingListFilter,
  SendMessageTarget,
} from './domain/messaging.types';

export {
  filterChannelsByUnread,
  filterChannelsBySearch,
  buildMessageCreatePayload,
  buildGroupChannelCreatePayload,
  buildObjectChannelCreatePayload,
  buildSyntheticObjectChannel,
  generateGroupChannelId,
  canSendMessageBody,
} from './domain/messaging.helpers';

export { getViewerChannelsQuery } from './application/queries/get-viewer-channels.query';
export { getChannelMessagesQuery } from './application/queries/get-channel-messages.query';
export { getChannelByIdQuery } from './application/queries/get-channel-by-id.query';
export {
  getObjectChannelQuery,
  getObjectChannelMessagesQuery,
} from './application/queries/get-object-channel-messages.query';

export { MessagingInboxClient } from './presentation/messaging-inbox-client';
export { MessagingChannelListRail } from './presentation/messaging-channel-list-rail';
export { ObjectChannelMessagesClient } from './presentation/object-channel-messages-client';
export { MessagingChannelList } from './presentation/messaging-channel-list';
export { MessagingMessageList } from './presentation/messaging-message-list';
