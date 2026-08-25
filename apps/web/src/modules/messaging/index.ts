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
  filterChannelsByFollowing,
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
export { ObjectActivityFeedClient } from './presentation/object-activity-feed-client';
export { ObjectActivityComposeBar } from './presentation/object-activity-compose-bar';
export { ObjectActivityFeedList } from './presentation/object-activity-feed-list';
export { MessagingChannelList } from './presentation/messaging-channel-list';
export { MessagingMessageList } from './presentation/messaging-message-list';
