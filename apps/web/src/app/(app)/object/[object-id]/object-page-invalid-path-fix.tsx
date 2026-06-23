'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { useInstantNavigation } from '@/shared/presentation';

import { OBJECT_PAGE_VIEW_PATH_PARAM } from './object-page-search';

export function ObjectPageInvalidPathFix({ objectId }: { objectId: string }) {
  const searchParams = useSearchParams();
  const { navigateInstant } = useInstantNavigation();

  useEffect(() => {
    const u = new URLSearchParams(searchParams.toString());
    if (!u.has(OBJECT_PAGE_VIEW_PATH_PARAM)) {
      return;
    }
    u.delete(OBJECT_PAGE_VIEW_PATH_PARAM);
    const qs = u.toString();
    const base = `/object/${encodeURIComponent(objectId)}`;
    const href = qs ? `${base}?${qs}` : base;
    navigateInstant({ href, method: 'replace', scroll: false });
  }, [navigateInstant, objectId, searchParams]);

  return null;
}
