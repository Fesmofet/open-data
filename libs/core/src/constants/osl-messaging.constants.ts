export const CHANNEL_KINDS = ['direct', 'group', 'object'] as const;
export type ChannelKind = (typeof CHANNEL_KINDS)[number];

export const CHANNEL_ACCESS = ['members_only', 'public_read'] as const;
export type ChannelAccess = (typeof CHANNEL_ACCESS)[number];

export const CHANNEL_MEMBER_ROLES = ['admin', 'member'] as const;
export type ChannelMemberRole = (typeof CHANNEL_MEMBER_ROLES)[number];

/** Maximum members in an active group channel (including creator/admin). */
export const MAX_GROUP_CHANNEL_MEMBERS = 100;

/** Max invitees in `channel_create.members` (creator added separately). */
export const MAX_GROUP_CHANNEL_CREATE_INVITEES = MAX_GROUP_CHANNEL_MEMBERS - 1;
