import { planObjectCreateUrlSync } from './object-create-url-sync';

describe('planObjectCreateUrlSync', () => {
  const base = {
    draftHydrated: true,
    urlWantsEdit: true,
    urlObjectTypeValid: true,
  } as const;

  it('syncs URL to state when user picked a new type (recipe URL, restaurant state)', () => {
    expect(
      planObjectCreateUrlSync({
        ...base,
        urlObjectType: 'recipe',
        stateObjectType: 'restaurant',
      }),
    ).toEqual({ kind: 'sync_url_to_state', objectType: 'restaurant' });
  });

  it('applies URL type only when workspace has no type yet', () => {
    expect(
      planObjectCreateUrlSync({
        ...base,
        urlObjectType: 'recipe',
        stateObjectType: null,
      }),
    ).toEqual({ kind: 'apply_url_type', objectType: 'recipe' });
  });
});
