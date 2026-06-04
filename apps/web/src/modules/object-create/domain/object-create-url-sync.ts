export type ObjectCreateUrlSyncInput = {
  draftHydrated: boolean;
  urlWantsEdit: boolean;
  urlObjectType: string | null;
  urlObjectTypeValid: boolean;
  stateObjectType: string | null;
};

export type ObjectCreateUrlSyncAction =
  | { kind: 'none' }
  | { kind: 'apply_url_type'; objectType: string }
  | { kind: 'sync_url_to_state'; objectType: string }
  | { kind: 'go_select_type' };

/**
 * Workspace state wins over a stale `type` query param (e.g. after switching recipe → restaurant).
 */
export function planObjectCreateUrlSync(
  input: ObjectCreateUrlSyncInput,
): ObjectCreateUrlSyncAction {
  if (!input.draftHydrated || !input.urlWantsEdit) {
    return { kind: 'none' };
  }

  const { stateObjectType, urlObjectType, urlObjectTypeValid } = input;

  if (
    stateObjectType &&
    urlObjectTypeValid &&
    urlObjectType &&
    urlObjectType !== stateObjectType
  ) {
    return { kind: 'sync_url_to_state', objectType: stateObjectType };
  }

  if (!stateObjectType && urlObjectTypeValid && urlObjectType) {
    return { kind: 'apply_url_type', objectType: urlObjectType };
  }

  if (!stateObjectType && !urlObjectTypeValid) {
    return { kind: 'go_select_type' };
  }

  return { kind: 'none' };
}
