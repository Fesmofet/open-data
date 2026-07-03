/**
 * One row per validity vote. Table: validity_votes.
 *
 * Position inlined via CanonicalPositionColumns. FK to object_updates ON DELETE CASCADE;
 * replacing an update automatically deletes its votes.
 *
 * On every successful `update_create`, chain-indexer inserts a `for` vote from `creator`
 * (idempotent on PK `update_id` + `voter`). Clients do not broadcast self-votes on create.
 */

import type { CanonicalPositionColumns, ValidityVoteValue } from './shared-types';

export interface ValidityVoteRow extends CanonicalPositionColumns {
  update_id: string;
  object_id: string;
  voter: string;
  vote: ValidityVoteValue;
}
