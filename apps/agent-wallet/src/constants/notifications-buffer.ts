/** Max messaging notifications kept in the agent-wallet WS ring buffer. */
export const NOTIFICATIONS_BUFFER_MAX = 200;

export const DEFAULT_MESSAGING_NOTIFICATION_TYPES = [
  'message_direct',
  'message_group',
  'bell_object_message',
] as const;
