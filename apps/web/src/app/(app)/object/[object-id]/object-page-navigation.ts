import {
  buildObjectAddOnPath,
  buildObjectGalleryPath,
  buildObjectRelatedPath,
  buildObjectSimilarPath,
} from '@/modules/object/domain/object-page-url.constants';

import {
  OBJECT_PAGE_AUTHORITY_SUB_PARAM,
  OBJECT_PAGE_PRIMARY_TAB_PARAM,
  OBJECT_PAGE_VIEW_PATH_PARAM,
} from './object-page-search';

export type ObjectPrimaryTabNavigation = {
  href: string;
  method: 'push' | 'replace';
};

/** Build href + history method for object primary tab navigation. */
export function buildObjectPrimaryTabNavigation(
  objectId: string,
  segment: string,
  searchParams: URLSearchParams,
): ObjectPrimaryTabNavigation {
  const id = encodeURIComponent(objectId);
  const base = `/object/${id}`;
  const u = new URLSearchParams(searchParams.toString());

  if (segment === 'reviews') {
    u.delete(OBJECT_PAGE_VIEW_PATH_PARAM);
    u.delete(OBJECT_PAGE_AUTHORITY_SUB_PARAM);
    const qs = u.toString();
    return {
      href: qs ? `${base}/reviews?${qs}` : `${base}/reviews`,
      method: 'push',
    };
  }

  if (segment === 'updates') {
    u.delete(OBJECT_PAGE_PRIMARY_TAB_PARAM);
    u.delete(OBJECT_PAGE_AUTHORITY_SUB_PARAM);
    const qs = u.toString();
    return {
      href: qs ? `${base}/updates?${qs}` : `${base}/updates`,
      method: 'replace',
    };
  }

  if (segment === 'followers') {
    u.delete(OBJECT_PAGE_PRIMARY_TAB_PARAM);
    u.delete(OBJECT_PAGE_AUTHORITY_SUB_PARAM);
    const qs = u.toString();
    return {
      href: qs ? `${base}/followers?${qs}` : `${base}/followers`,
      method: 'replace',
    };
  }

  if (segment === 'authority') {
    u.delete(OBJECT_PAGE_PRIMARY_TAB_PARAM);
    const qs = u.toString();
    return {
      href: qs ? `${base}/authority?${qs}` : `${base}/authority`,
      method: 'replace',
    };
  }

  if (segment === 'gallery' || segment === 'experts') {
    u.delete(OBJECT_PAGE_PRIMARY_TAB_PARAM);
    u.delete(OBJECT_PAGE_AUTHORITY_SUB_PARAM);
    u.delete('sort');
    u.delete('update_type');
    u.delete('locale');
    const qs = u.toString();
    if (segment === 'gallery') {
      return {
        href: qs ? `${base}/gallery?${qs}` : `${base}/gallery`,
        method: 'replace',
      };
    }
    return {
      href: qs ? `${base}/${segment}?${qs}` : `${base}/${segment}`,
      method: 'replace',
    };
  }

  if (segment === 'related') {
    u.delete(OBJECT_PAGE_PRIMARY_TAB_PARAM);
    u.delete(OBJECT_PAGE_AUTHORITY_SUB_PARAM);
    const qs = u.toString();
    return {
      href: qs
        ? `${buildObjectRelatedPath(objectId)}?${qs}`
        : buildObjectRelatedPath(objectId),
      method: 'replace',
    };
  }

  if (segment === 'similar') {
    u.delete(OBJECT_PAGE_PRIMARY_TAB_PARAM);
    u.delete(OBJECT_PAGE_AUTHORITY_SUB_PARAM);
    const qs = u.toString();
    return {
      href: qs
        ? `${buildObjectSimilarPath(objectId)}?${qs}`
        : buildObjectSimilarPath(objectId),
      method: 'replace',
    };
  }

  if (segment === 'add-on') {
    u.delete(OBJECT_PAGE_PRIMARY_TAB_PARAM);
    u.delete(OBJECT_PAGE_AUTHORITY_SUB_PARAM);
    const qs = u.toString();
    return {
      href: qs
        ? `${buildObjectAddOnPath(objectId)}?${qs}`
        : buildObjectAddOnPath(objectId),
      method: 'replace',
    };
  }

  u.delete(OBJECT_PAGE_PRIMARY_TAB_PARAM);
  u.delete(OBJECT_PAGE_AUTHORITY_SUB_PARAM);
  u.delete('sort');
  u.delete('update_type');
  u.delete('locale');
  u.set(OBJECT_PAGE_PRIMARY_TAB_PARAM, segment);
  const qs = u.toString();
  return { href: `${base}?${qs}`, method: 'replace' };
}

export function buildObjectUpdatesFieldHref(
  objectId: string,
  searchParams: URLSearchParams,
  updateType: string | null,
): string {
  const id = encodeURIComponent(objectId);
  const base = `/object/${id}`;
  const u = new URLSearchParams(searchParams.toString());
  u.delete(OBJECT_PAGE_PRIMARY_TAB_PARAM);
  u.delete(OBJECT_PAGE_AUTHORITY_SUB_PARAM);
  if (updateType) {
    u.set('update_type', updateType);
  } else {
    u.delete('update_type');
  }
  const qs = u.toString();
  return qs ? `${base}/updates?${qs}` : `${base}/updates`;
}

export function buildObjectAuthoritySubHref(
  objectId: string,
  searchParams: URLSearchParams,
  sub: string,
): string {
  const id = encodeURIComponent(objectId);
  const base = `/object/${id}`;
  const u = new URLSearchParams(searchParams.toString());
  u.delete(OBJECT_PAGE_PRIMARY_TAB_PARAM);
  u.set(OBJECT_PAGE_AUTHORITY_SUB_PARAM, sub);
  const qs = u.toString();
  return qs ? `${base}/authority?${qs}` : `${base}/authority`;
}

export { buildObjectGalleryPath };
