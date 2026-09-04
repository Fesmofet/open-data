/** Emitted when `object_ownership` gains or loses a row for `account` on `objectId`. */
export const OWNERSHIP_CHANGED_EVENT = 'odl.object_ownership.changed';

export class OwnershipChangedEvent {
  constructor(
    public readonly account: string,
    public readonly objectId: string,
  ) {}
}
