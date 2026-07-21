import type { PostObject } from '@opden-data-layer/core';

import {
  assembleFeedObjectChipsForPost,
  groupPostObjectsByPostKey,
} from './feed-object-summaries';
import type { ProjectedObject } from '../object-projection/projected-object.types';

function postObject(
  author: string,
  permlink: string,
  objectId: string,
): PostObject {
  return {
    author,
    permlink,
    object_id: objectId,
    object_type: 'item',
    percent: 100,
  } as PostObject;
}

function projected(id: string, image?: string): ProjectedObject {
  return {
    object_id: id,
    object_type: 'item',
    semantic_type: null,
    status: 'active',
    weight: null,
    fields: image ? { image } : {},
    hasAdministrativeAuthority: false,
    hasOwnershipAuthority: false,
  };
}

describe('groupPostObjectsByPostKey', () => {
  it('groups by author and permlink', () => {
    const grouped = groupPostObjectsByPostKey([
      postObject('alice', 'p1', 'o1'),
      postObject('alice', 'p1', 'o2'),
      postObject('bob', 'p2', 'o3'),
    ]);

    expect(grouped.get('alice\0p1')).toHaveLength(2);
    expect(grouped.get('bob\0p2')).toHaveLength(1);
  });
});

describe('assembleFeedObjectChipsForPost', () => {
  it('sorts by image presence and applies limit', () => {
    const projectedById = new Map([
      ['o1', projected('o1')],
      ['o2', projected('o2', 'https://img.example/a.png')],
    ]);
    const weightByObjectId = new Map<string, number | null>([
      ['o1', 10],
      ['o2', 1],
    ]);

    const chips = assembleFeedObjectChipsForPost(
      [postObject('alice', 'p', 'o1'), postObject('alice', 'p', 'o2')],
      projectedById,
      weightByObjectId,
      1,
    );

    expect(chips).toHaveLength(1);
    expect(chips[0]?.object_id).toBe('o2');
  });

  it('uses placeholder when projection is missing', () => {
    const chips = assembleFeedObjectChipsForPost(
      [postObject('alice', 'p', 'missing')],
      new Map(),
      new Map(),
      4,
    );

    expect(chips[0]?.object_id).toBe('missing');
    expect(chips[0]?.fields).toEqual({});
  });
});
