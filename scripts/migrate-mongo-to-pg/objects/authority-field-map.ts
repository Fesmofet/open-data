import type { NewObjectFavorite, NewObjectOwnership } from '@opden-data-layer/odl-db-types';

import type { MongoWObjectField } from './types';
import {
  createdAtUnixFromObjectId,
  legacyEventSeqFromObjectIdHex,
  mongoIdToString,
} from './utils';

const AUTHORITY_TYPES = new Set<string>(['ownership', 'administrative']);

export type MongoAuthorityFieldResult =
  | { kind: 'skip' }
  | { kind: 'favorite'; row: NewObjectFavorite }
  | { kind: 'ownership'; row: NewObjectOwnership };

/**
 * Maps legacy Mongo `authority` field body to `object_favorite` or `object_ownership` rows.
 */
export function mapMongoAuthorityField(
  objectId: string,
  field: MongoWObjectField,
): MongoAuthorityFieldResult {
  const body = field.body?.trim();
  const account = field.creator?.trim();
  if (!body || !AUTHORITY_TYPES.has(body) || !account) {
    return { kind: 'skip' };
  }

  const idHex = mongoIdToString(field._id);
  const eventSeq = legacyEventSeqFromObjectIdHex(idHex);
  const createdAtSec = idHex ? createdAtUnixFromObjectId(idHex) : 0;
  const createdAt = new Date(createdAtSec * 1000);

  if (body === 'administrative') {
    return {
      kind: 'favorite',
      row: {
        object_id: objectId,
        account,
        event_seq: eventSeq,
        created_at: createdAt,
      },
    };
  }

  if (body === 'ownership') {
    return {
      kind: 'ownership',
      row: {
        object_id: objectId,
        account,
        ownership_type: 'exclusive',
        event_seq: eventSeq,
        created_at: createdAt,
      },
    };
  }

  return { kind: 'skip' };
}
