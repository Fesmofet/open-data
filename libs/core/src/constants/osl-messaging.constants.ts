export const CHANNEL_KINDS = ['direct', 'group', 'object'] as const;
export type ChannelKind = (typeof CHANNEL_KINDS)[number];

export const CHANNEL_ACCESS = ['members_only', 'public_read'] as const;
export type ChannelAccess = (typeof CHANNEL_ACCESS)[number];

export const CHANNEL_MEMBER_ROLES = ['admin', 'member'] as const;
export type ChannelMemberRole = (typeof CHANNEL_MEMBER_ROLES)[number];
