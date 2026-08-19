export type ChannelListItem = {
  channel_id: string;
  kind: string;
  display_title: string | null;
  list_title: string | null;
  peer: string | null;
  members: string[];
  last_message_at_unix: number | null;
  unread_count: number;
  image: unknown;
  last_message_preview: string | null;
};

export type ChannelListPage = {
  items: ChannelListItem[];
  cursor: string | null;
  hasMore: boolean;
};

export type ChannelDetail = {
  channel_id: string;
  kind: string;
  creator: string;
  title: string | null;
  image: unknown;
  object_id: string | null;
  access: string;
  display_title: string | null;
  list_title: string | null;
  peer: string | null;
  members: string[];
};

export type MessageItem = {
  message_id: string;
  channel_id: string;
  author: string;
  body: string | null;
  overflow_ref: string | null;
  reply_to: string | null;
  quote_json: unknown;
  attachments: unknown;
  mentions: string[];
  created_at_unix: number;
};

export type MessageHistoryPage = {
  items: MessageItem[];
  cursor: string | null;
  hasMore: boolean;
};

export type MessagingListFilter = 'all' | 'unread';

export type SendMessageTarget =
  | { channelId: string; peer?: never }
  | { peer: string; channelId?: never };
