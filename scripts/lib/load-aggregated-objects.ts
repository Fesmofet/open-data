import type { Kysely } from 'kysely';
import type { OdlDatabase } from '@opden-data-layer/odl-db-types';
import type {
  AggregatedObject,
  VoterWaivPowerMap,
} from '@opden-data-layer/objects-domain';

export async function loadAggregatedByObjectIds(
  db: Kysely<OdlDatabase>,
  objectIds: string[],
): Promise<{ objects: AggregatedObject[]; voterWaivPowers: VoterWaivPowerMap }> {
  if (objectIds.length === 0) {
    return { objects: [], voterWaivPowers: new Map() };
  }

  const [cores, updates, validityVotes, favorites, ownerships] = await Promise.all([
    db.selectFrom('objects_core').where('object_id', 'in', objectIds).selectAll().execute(),
    db.selectFrom('object_updates').where('object_id', 'in', objectIds).selectAll().execute(),
    db.selectFrom('validity_votes').where('object_id', 'in', objectIds).selectAll().execute(),
    db.selectFrom('object_favorite').where('object_id', 'in', objectIds).selectAll().execute(),
    db.selectFrom('object_ownership').where('object_id', 'in', objectIds).selectAll().execute(),
  ]);

  const voterNames = new Set(validityVotes.map((v) => v.voter));
  const voterWaivPowers: VoterWaivPowerMap = new Map();

  if (voterNames.size > 0) {
    const rows = await db
      .selectFrom('user_object_powers')
      .where('account', 'in', [...voterNames])
      .select(['account', 'waiv_power'])
      .execute();
    for (const row of rows) {
      voterWaivPowers.set(row.account, row.waiv_power);
    }
  }

  const objects: AggregatedObject[] = cores.map((core) => ({
    core,
    updates: updates.filter((u) => u.object_id === core.object_id),
    validity_votes: validityVotes.filter((v) => v.object_id === core.object_id),
    favorites: favorites.filter((f) => f.object_id === core.object_id),
    ownerships: ownerships.filter((o) => o.object_id === core.object_id),
  }));

  return { objects, voterWaivPowers };
}
