import { UPDATE_TYPES } from '@opden-data-layer/core/update-types';
import {
  buildOdlGalleryItemWithAlbumEnsureOp,
  buildOdlUpdateCreateOp,
  buildOdlUpdateCreateWithLikeOp,
  type CustomJsonOp,
} from '@opden-data-layer/hive-broadcast';

function readAlbumName(itemValue: unknown): string {
  if (!itemValue || typeof itemValue !== 'object') {
    return '';
  }
  const album = (itemValue as Record<string, unknown>).album;
  return typeof album === 'string' ? album.trim() : '';
}

export function buildGalleryItemBroadcastOp(params: {
  id: string;
  objectId: string;
  creator: string;
  itemValue: unknown;
  onChainGalleryAlbumNames: readonly string[];
  withLike: boolean;
}): CustomJsonOp {
  const albumName = readAlbumName(params.itemValue);
  const ensureAlbum =
    albumName.length > 0 && !params.onChainGalleryAlbumNames.includes(albumName);

  if (ensureAlbum) {
    return buildOdlGalleryItemWithAlbumEnsureOp({
      id: params.id,
      objectId: params.objectId,
      creator: params.creator,
      albumName,
      itemValue: params.itemValue,
      withLike: params.withLike,
      required_posting_auths: [params.creator],
    });
  }

  const createInput = {
    id: params.id,
    objectId: params.objectId,
    updateType: UPDATE_TYPES.IMAGE_GALLERY_ITEM,
    creator: params.creator,
    valueKind: 'json' as const,
    value: params.itemValue,
    required_posting_auths: [params.creator],
  };

  return params.withLike
    ? buildOdlUpdateCreateWithLikeOp(createInput)
    : buildOdlUpdateCreateOp(createInput);
}
