import { UPDATE_TYPES } from '@opden-data-layer/core';
import type { ResolvedObjectView } from '@opden-data-layer/objects-domain';
import { collectRemovePostKeysFromView } from './related-album-remove-filter';

function viewWithRemove(
  values: Array<{ text: string; validity: 'VALID' | 'INVALID' }>,
): ResolvedObjectView {
  return {
    object_id: 'obj',
    fields: {
      [UPDATE_TYPES.REMOVE]: {
        values: values.map((v, i) => ({
          value_text: v.text,
          validity_status: v.validity,
          update_id: `u${i}`,
        })),
      },
    },
  } as unknown as ResolvedObjectView;
}

describe('collectRemovePostKeysFromView', () => {
  it('returns empty array when remove field is missing', () => {
    expect(
      collectRemovePostKeysFromView({ object_id: 'obj', fields: {} } as ResolvedObjectView),
    ).toEqual([]);
  });

  it('maps only VALID remove values to author_permlink keys', () => {
    expect(
      collectRemovePostKeysFromView(
        viewWithRemove([
          { text: 'alice/my-post', validity: 'VALID' },
          { text: 'bob/other', validity: 'INVALID' },
          { text: 'invalid', validity: 'VALID' },
        ]),
      ),
    ).toEqual(['alice_my-post']);
  });

  it('skips blank remove values', () => {
    expect(
      collectRemovePostKeysFromView(
        viewWithRemove([
          { text: '  ', validity: 'VALID' },
          { text: 'alice/p', validity: 'VALID' },
        ]),
      ),
    ).toEqual(['alice_p']);
  });
});
