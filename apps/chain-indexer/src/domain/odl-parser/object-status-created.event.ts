import type { ObjectStatus } from '@opden-data-layer/core';

export const OBJECT_STATUS_RECOMPUTE_EVENT = 'odl.object.status_recompute';

export class ObjectStatusRecomputeEvent {
  constructor(public readonly objectId: string) {}
}

/** @deprecated Use ObjectStatusRecomputeEvent */
export const OBJECT_STATUS_CREATED_EVENT = OBJECT_STATUS_RECOMPUTE_EVENT;

/** @deprecated Use ObjectStatusRecomputeEvent */
export class ObjectStatusCreatedEvent extends ObjectStatusRecomputeEvent {
  constructor(
    objectId: string,
    /** @deprecated Ignored — status is resolved from votes */
    _creator?: string,
    /** @deprecated Ignored — status is resolved from votes */
    _status?: ObjectStatus,
  ) {
    super(objectId);
  }
}
