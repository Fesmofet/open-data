import {
  mapStatusUpdateTitleToCoreStatus,
  UPDATE_STATUS_SCHEMA,
  UPDATE_TYPES,
  type ObjectStatus,
} from '@opden-data-layer/core';

import type { ObjectViewService } from '../services/object-view.service';
import type { AggregatedObject, VoterWaivPowerMap } from '../types/aggregated-object';
import type { GovernanceSnapshot } from '../types/governance-snapshot';

/**
 * Resolves the winning VALID status update and maps it to `objects_core.status`.
 * Returns `'active'` when there is no VALID winner or the payload is invalid.
 */
export function materializeObjectCoreStatus(
  aggregated: AggregatedObject,
  voterWaivPowers: VoterWaivPowerMap,
  governance: GovernanceSnapshot,
  objectViewService: ObjectViewService,
): ObjectStatus {
  const views = objectViewService.resolve([aggregated], voterWaivPowers, {
    update_types: [UPDATE_TYPES.STATUS],
    governance,
  });
  const winner = views[0]?.fields[UPDATE_TYPES.STATUS]?.values[0];
  if (!winner) {
    return 'active';
  }

  const raw = winner.value_json;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return 'active';
  }

  const parsed = UPDATE_STATUS_SCHEMA.safeParse(raw);
  if (!parsed.success) {
    return 'active';
  }

  return mapStatusUpdateTitleToCoreStatus(parsed.data.title);
}
