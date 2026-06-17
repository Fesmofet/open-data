'use server';

import {
  fetchObjectRelatedAlbumPageLive,
  fetchObjectRelatedAlbumPreviewLive,
  fetchObjectRelatedAlbumPage,
} from './fetch-object-related-album.server';
import type {
  RelatedAlbumFetchResult,
  RelatedAlbumListView,
  RelatedAlbumPreviewView,
} from '../domain/related-album.types';

export async function fetchObjectRelatedAlbumPreviewAction(
  objectId: string,
): Promise<RelatedAlbumFetchResult<RelatedAlbumPreviewView>> {
  return fetchObjectRelatedAlbumPreviewLive(objectId);
}

export async function fetchObjectRelatedAlbumPageAction(
  objectId: string,
  limit = 20,
): Promise<RelatedAlbumFetchResult<RelatedAlbumListView>> {
  return fetchObjectRelatedAlbumPageLive(objectId, { limit });
}

export async function loadMoreObjectRelatedAlbumAction(
  objectId: string,
  cursor: string | null,
  limit = 20,
): Promise<RelatedAlbumListView> {
  const page = await fetchObjectRelatedAlbumPage(objectId, { limit, cursor });
  return (
    page ?? {
      count: 0,
      items: [],
      hasMore: false,
      cursor: null,
    }
  );
}
