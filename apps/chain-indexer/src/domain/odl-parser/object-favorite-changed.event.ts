/** Emitted when `object_favorite` gains or loses a row for `account`. */
export const OBJECT_FAVORITE_CHANGED_EVENT = 'odl.object_favorite.changed';

export class ObjectFavoriteChangedEvent {
  constructor(public readonly account: string) {}
}
