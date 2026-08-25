import type { Kysely } from 'kysely';
import { OBJECT_TYPES } from '@opden-data-layer/core';
import type { OdlDatabase } from '@opden-data-layer/odl-db-types';
import type { AggregatedObject, GovernanceSnapshot } from '@opden-data-layer/objects-domain';
import {
  DEFAULT_GOVERNANCE_SNAPSHOT,
  ObjectViewService,
  type GovernanceScope,
} from '@opden-data-layer/objects-domain';
import { assembleSnapshot } from '../../apps/chain-indexer/src/domain/governance/assemble-snapshot';
import { GOVERNANCE_UPDATE_TYPES } from '../../apps/chain-indexer/src/domain/governance/governance.constants';
import { loadAggregatedByObjectIds } from './load-aggregated-objects';

const objectViewService = new ObjectViewService();

/**
 * Resolves platform governance for status materialization (same rules as live indexer).
 */
export async function resolvePlatformGovernance(
  db: Kysely<OdlDatabase>,
  governanceObjectId: string,
): Promise<GovernanceSnapshot> {
  const id = governanceObjectId.trim();
  if (id.length === 0) {
    return DEFAULT_GOVERNANCE_SNAPSHOT;
  }
  return resolveGovernanceObject(db, id);
}

async function resolveGovernanceObject(
  db: Kysely<OdlDatabase>,
  objectId: string,
): Promise<GovernanceSnapshot> {
  const { objects, voterWaivPowers } = await loadAggregatedByObjectIds(db, [objectId]);
  const root = objects[0];
  if (!root || root.core.object_type !== OBJECT_TYPES.GOVERNANCE) {
    return DEFAULT_GOVERNANCE_SNAPSHOT;
  }

  const rootView = resolveFilteredView(root, voterWaivPowers);
  const snapshot = assembleSnapshot(rootView);

  const inheritedIds = uniqueIds(snapshot.inherits_from.map((e) => e.object_id));
  if (inheritedIds.length > 0) {
    const { objects: inheritedRows } = await loadAggregatedByObjectIds(db, inheritedIds);
    const byId = new Map(inheritedRows.map((o) => [o.core.object_id, o]));

    for (const entry of snapshot.inherits_from) {
      const childAgg = byId.get(entry.object_id);
      if (!childAgg || childAgg.core.object_type !== OBJECT_TYPES.GOVERNANCE) {
        continue;
      }
      const childView = resolveFilteredView(childAgg, voterWaivPowers);
      const childSnap = assembleSnapshot(childView);
      await applyModeratorMutes(db, childSnap);
      mergeInheritedScopes(snapshot, childSnap, entry.scope);
    }
  }

  await applyModeratorMutes(db, snapshot);
  applyWhitelistToMuted(snapshot);
  return snapshot;
}

function resolveFilteredView(agg: AggregatedObject, voterWaivPowers: Map<string, number>) {
  const creator = agg.core.creator;
  const filtered: AggregatedObject = {
    ...agg,
    updates: agg.updates.filter((u) => u.creator === creator),
    validity_votes: agg.validity_votes.filter((v) => v.voter === creator),
  };
  const [view] = objectViewService.resolve([filtered], voterWaivPowers, {
    update_types: GOVERNANCE_UPDATE_TYPES,
    governance: DEFAULT_GOVERNANCE_SNAPSHOT,
  });
  return view;
}

async function loadMutesForModerators(
  db: Kysely<OdlDatabase>,
  moderators: string[],
): Promise<string[]> {
  if (moderators.length === 0) {
    return [];
  }
  const uniqueMuters = [...new Set(moderators)];
  const rows = await db
    .selectFrom('user_account_mutes')
    .select('muted')
    .where('muter', 'in', uniqueMuters)
    .execute();
  return [...new Set(rows.map((r) => r.muted))];
}

async function applyModeratorMutes(
  db: Kysely<OdlDatabase>,
  snapshot: GovernanceSnapshot,
): Promise<void> {
  const fromModerators = await loadMutesForModerators(db, snapshot.moderators);
  snapshot.muted = dedupeStrings([...snapshot.muted, ...fromModerators]);
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function mergeInheritedScopes(
  root: GovernanceSnapshot,
  child: GovernanceSnapshot,
  scopes: GovernanceScope[],
): void {
  for (const scope of scopes) {
    switch (scope) {
      case 'admins':
        root.admins = dedupeStrings([...root.admins, ...child.admins]);
        break;
      case 'trusted':
        root.trusted = dedupeStrings([...root.trusted, ...child.trusted]);
        break;
      case 'moderators':
        root.moderators = dedupeStrings([...root.moderators, ...child.moderators]);
        break;
      case 'authorities':
        root.authorities = dedupeStrings([...root.authorities, ...child.authorities]);
        break;
      case 'restricted':
        root.restricted = dedupeStrings([...root.restricted, ...child.restricted]);
        break;
      case 'banned':
        root.banned = dedupeStrings([...root.banned, ...child.banned]);
        break;
      case 'whitelist':
        root.whitelist = dedupeStrings([...root.whitelist, ...child.whitelist]);
        break;
      case 'muted':
        root.muted = dedupeStrings([...root.muted, ...child.muted]);
        break;
      case 'validityCutoff':
        root.validity_cutoff = mergeValidityCutoff(root.validity_cutoff, child.validity_cutoff);
        break;
      default:
        break;
    }
  }
}

function mergeValidityCutoff(
  a: GovernanceSnapshot['validity_cutoff'],
  b: GovernanceSnapshot['validity_cutoff'],
): GovernanceSnapshot['validity_cutoff'] {
  const byAccount = new Map<string, (typeof a)[0]>();
  for (const row of a) {
    byAccount.set(row.account, row);
  }
  for (const row of b) {
    byAccount.set(row.account, row);
  }
  return [...byAccount.values()];
}

function applyWhitelistToMuted(snapshot: GovernanceSnapshot): void {
  if (snapshot.whitelist.length === 0) {
    return;
  }
  const allow = new Set(snapshot.whitelist);
  snapshot.muted = snapshot.muted.filter((m) => !allow.has(m));
}
