import type {
  ObjectFavorite,
  ObjectOwnership,
  ObjectUpdate,
  ObjectsCore,
  ValidityVote,
} from '@opden-data-layer/odl-db-types';

/**
 * All DB rows for a single object, grouped in memory after the load pipeline.
 * @see docs/spec/data-model/flow.md §Step 3
 */
export interface AggregatedObject {
  core: ObjectsCore;
  updates: ObjectUpdate[];
  validity_votes: ValidityVote[];
  favorites: ObjectFavorite[];
  ownerships: ObjectOwnership[];
}

/**
 * WAIV power per account (stake + delegationsIn) for voters in `user_object_powers`.
 * Key = voter name, value = waiv_power.
 */
export type VoterWaivPowerMap = Map<string, number>;
