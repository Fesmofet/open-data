/**
 * @jest-environment jsdom
 */

import {
  emptyObjectCreateState,
  resolveInitialObjectCreateState,
} from './object-create-initial-state';
import {
  draftStorageKey,
  saveObjectCreateDraft,
} from './object-create-draft.storage';
import { OBJECT_TYPES } from '@opden-data-layer/core';

describe('resolveInitialObjectCreateState', () => {
  const username = 'flowmaster';

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts empty when opened from the post editor', () => {
    saveObjectCreateDraft(username, {
      objectIdPrefix: 'pgx',
      objectId: 'pgx-smoked-chicken-breakfast-power-bowl',
      objectType: OBJECT_TYPES.RECIPE,
      fields: [
        {
          entryKey: 'name:0',
          updateType: 'name',
          value: 'Smoked Chicken Breakfast Power Bowl',
          locale: 'en-US',
        },
      ],
      language: 'en-US',
    });

    const state = resolveInitialObjectCreateState(
      username,
      'nbi',
      '/editor?draftId=abc',
    );

    expect(state).toEqual(emptyObjectCreateState('nbi'));
  });

  it('restores localStorage draft on a normal visit', () => {
    saveObjectCreateDraft(username, {
      objectIdPrefix: 'nbi',
      objectId: 'nbi-flowmaster-test-r1',
      objectType: OBJECT_TYPES.RESTAURANT,
      fields: [],
      language: 'en-US',
    });

    const state = resolveInitialObjectCreateState(username, 'zzz', null);

    expect(state.objectId).toBe('nbi-flowmaster-test-r1');
    expect(state.objectType).toBe(OBJECT_TYPES.RESTAURANT);
    expect(draftStorageKey(username)).toBeTruthy();
  });
});
