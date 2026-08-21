'use client';

import { useEffect, useState } from 'react';

import { fetchViewerFollowingSetAction } from '../infrastructure/messaging-following.actions';

export function useViewerFollowingSet(viewerUsername: string | null): ReadonlySet<string> {
  const [followingSet, setFollowingSet] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    const viewer = viewerUsername?.trim() ?? '';
    if (!viewer) {
      setFollowingSet(new Set());
      return;
    }
    let cancelled = false;
    void fetchViewerFollowingSetAction(viewer).then((names) => {
      if (!cancelled) {
        setFollowingSet(new Set(names));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [viewerUsername]);

  return followingSet;
}
