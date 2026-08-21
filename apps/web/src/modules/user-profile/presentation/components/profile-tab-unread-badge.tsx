'use client';

import {
  formatProfileUnreadBadgeCount,
  useUserProfileFeedUnreadCounts,
} from './user-profile-feed-unread-context';

export function ProfileTabUnreadBadge({ count }: { count: number }) {
  const label = formatProfileUnreadBadgeCount(count);
  if (!label) {
    return null;
  }
  return (
    <span
      className="ms-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-caption font-weight-strong text-accent-fg"
      aria-label={label}
    >
      {label}
    </span>
  );
}

export function ProfileFeedTabLabel({
  label,
  tab,
}: {
  label: string;
  tab: 'posts' | 'threads' | 'messages';
}) {
  const counts = useUserProfileFeedUnreadCounts();
  const count = tab === 'posts' ? counts.posts : tab === 'threads' ? counts.threads : counts.messages;
  return (
    <span className="inline-flex max-w-full min-w-0 items-center gap-0.5 whitespace-nowrap">
      <span>{label}</span>
      <ProfileTabUnreadBadge count={count} />
    </span>
  );
}
