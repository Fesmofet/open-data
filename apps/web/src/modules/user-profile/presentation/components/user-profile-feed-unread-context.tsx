'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

export type UserProfileFeedUnreadCounts = {
  posts: number;
  threads: number;
  messages: number;
};

const EMPTY_COUNTS: UserProfileFeedUnreadCounts = {
  posts: 0,
  threads: 0,
  messages: 0,
};

const UserProfileFeedUnreadContext = createContext<UserProfileFeedUnreadCounts>(EMPTY_COUNTS);

export function UserProfileFeedUnreadProvider({
  value,
  children,
}: {
  value: UserProfileFeedUnreadCounts | null | undefined;
  children: ReactNode;
}) {
  const counts = useMemo(
    () => value ?? EMPTY_COUNTS,
    [value?.messages, value?.posts, value?.threads],
  );
  return (
    <UserProfileFeedUnreadContext.Provider value={counts}>
      {children}
    </UserProfileFeedUnreadContext.Provider>
  );
}

export function useUserProfileFeedUnreadCounts(): UserProfileFeedUnreadCounts {
  return useContext(UserProfileFeedUnreadContext);
}

export function formatProfileUnreadBadgeCount(count: number): string | null {
  if (count <= 0) {
    return null;
  }
  return count > 9 ? '9+' : String(count);
}
