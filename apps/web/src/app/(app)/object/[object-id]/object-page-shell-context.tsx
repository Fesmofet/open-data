'use client';

import { createContext, useContext } from 'react';

import type {
  FollowersSubType,
  OwnershipSubType,
} from '@/modules/object/domain/object-page.types';
import type { ProjectedGalleryAlbumView } from '@/modules/object/domain/object-page.types';

export type ObjectPageShellContextValue = {
  activePrimarySegment: string;
  activeGalleryAlbum: string | null;
  activeCategoryName: string | null;
  onOwnershipSubSelect: (sub: OwnershipSubType) => void;
  onFollowersSubSelect: (sub: FollowersSubType) => void;
  onOpenGalleryAlbum: (albumName: string) => void;
  onBackToGalleryAlbums: () => void;
  onOpenGalleryPhoto: (album: ProjectedGalleryAlbumView, photoIndex: number) => void;
  isNavigating: boolean;
};

const ObjectPageShellContext = createContext<ObjectPageShellContextValue | null>(null);

export function ObjectPageShellProvider({
  value,
  children,
}: {
  value: ObjectPageShellContextValue;
  children: React.ReactNode;
}) {
  return (
    <ObjectPageShellContext.Provider value={value}>{children}</ObjectPageShellContext.Provider>
  );
}

export function useObjectPageShell(): ObjectPageShellContextValue {
  const ctx = useContext(ObjectPageShellContext);
  if (!ctx) {
    throw new Error('useObjectPageShell must be used within ObjectPageShellClient');
  }
  return ctx;
}
