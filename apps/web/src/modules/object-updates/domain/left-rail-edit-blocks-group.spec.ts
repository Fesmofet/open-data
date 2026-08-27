import { groupEditModeBlocks } from './left-rail-edit-blocks';
import type { ObjectLeftRailBlock } from '@/modules/object/domain/object-page.types';

describe('groupEditModeBlocks', () => {
  it('groups consecutive blocks by catalog section', () => {
    const blocks: ObjectLeftRailBlock[] = [
      { kind: 'name', headingLabel: 'Name', text: '' },
      { kind: 'title', headingLabel: 'Title', text: '' },
      { kind: 'parent', headingLabel: 'Parent', objectId: '', name: '', imageUrl: null },
      { kind: 'description', headingLabel: 'Description', text: '' },
    ];

    const groups = groupEditModeBlocks(blocks, 'restaurant');

    expect(groups).toHaveLength(2);
    expect(groups[0]?.groupId).toBe('header');
    expect(groups[0]?.blocks.map((b) => b.kind)).toEqual(['name', 'title']);
    expect(groups[1]?.groupId).toBe('details');
    expect(groups[1]?.blocks.map((b) => b.kind)).toEqual(['parent', 'description']);
  });
});
