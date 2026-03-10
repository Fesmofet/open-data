/**
 * One document per update. Collection: object_updates.
 *
 * Extracted from the v1 embedded updates[] array. Flat, directly indexable.
 * Validity and rank votes are stored in validity_votes and rank_votes collections.
 */

import type {
  CanonicalPosition,
  UpdateCardinality,
  UpdateValue,
} from './shared-types';

export interface ObjectUpdateDocument {
  updateId: string;
  objectId: string;
  updateType: string;
  creator: string;
  cardinality: UpdateCardinality;
  /** BCP 47 language-REGION tag, e.g. "en-US", "fr-FR". Null means language-neutral. */
  locale: string | null;
  createdAtUnix: number;
  createdPosition: CanonicalPosition;
  value: UpdateValue;
}
