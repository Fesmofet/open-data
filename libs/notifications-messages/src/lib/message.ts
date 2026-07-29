export type NotificationIcon =
  | 'follow'
  | 'vote'
  | 'reply'
  | 'wallet'
  | 'object'
  | 'bell'
  | 'generic';

export interface NotificationMessage {
  readonly key: string;
  readonly params: Readonly<Record<string, string>>;
  readonly href: string | null;
  readonly icon: NotificationIcon;
  readonly actor: string | null;
  /** Per-placeholder relative paths for inline web links (keys match i18n `{param}` names). */
  readonly paramHrefs?: Readonly<Record<string, string>>;
}

export function withParamHrefs(
  message: NotificationMessage,
  paramHrefs: Readonly<Record<string, string>>,
): NotificationMessage {
  return { ...message, paramHrefs };
}

export const GENERIC_NOTIFICATION_KEY = 'notification_generic_default_message';
