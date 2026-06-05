export {
  useSyncedPaginatedList,
  type SyncedPaginatedInitial,
  type SyncedPaginatedListState,
} from './hooks/use-synced-paginated-list';
export {
  useInfiniteScroll,
  type UseInfiniteScrollOptions,
} from './hooks/use-infinite-scroll';
export { useLockBodyScroll } from './hooks/use-lock-body-scroll';
export { shouldUnoptimizeRemoteImage } from './image/should-unoptimize-remote-image';
export {
  AVATAR_PLACEHOLDER_SRC,
  OBJECT_LOGO_FRAME_CLASS,
  OBJECT_LOGO_IMAGE_CLASS,
  resolveAvatarUrl,
} from './avatar';
export type { ResolveAvatarUrlInput, UserAvatarProps } from './avatar';
export { UserAvatar } from './avatar';

export { IpfsImageDropZone } from './components/ipfs-image-drop-zone';
export type { IpfsImageDropZoneProps } from './components/ipfs-image-drop-zone';
export { HydrationSafeAnchor } from './components/hydration-safe-anchor';
export { NavMenu } from './components/nav-menu';
export type { NavMenuItem, NavMenuProps } from './components/nav-menu';
export {
  profileSectionTabClass,
  profileSectionVerticalLinkClass,
} from './components/profile-section-tab-classes';
export type { ProfileSectionTabSize } from './components/profile-section-tab-classes';
export { PlaceholderSlot } from './components/placeholder-slot';
export { ShellModeSwitcher } from './components/shell-mode-switcher';
export { ThemeSwitcher } from './components/theme-switcher';

export * from './layout';
