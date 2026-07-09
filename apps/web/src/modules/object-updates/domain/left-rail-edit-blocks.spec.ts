import { UPDATE_TYPES } from '@opden-data-layer/core/update-types';

import type { ObjectLeftRailBlock } from '@/modules/object/domain/object-page.types';

import { mergeLeftRailBlocksForEditMode } from './left-rail-edit-blocks';

describe('mergeLeftRailBlocksForEditMode', () => {
  const supported = [
    UPDATE_TYPES.NAME,
    UPDATE_TYPES.TITLE,
    UPDATE_TYPES.MENU_ITEM,
    UPDATE_TYPES.DESCRIPTION,
    UPDATE_TYPES.BUTTON,
    UPDATE_TYPES.WEBSITE,
  ];

  const productSupported = [
    ...supported,
    UPDATE_TYPES.OPTION,
    UPDATE_TYPES.PRICE,
    UPDATE_TYPES.IMAGE_GALLERY_ITEM,
  ];

  it('places button after menu and includes empty website slot', () => {
    const viewBlocks: ObjectLeftRailBlock[] = [
      {
        kind: 'description',
        headingLabel: 'Description',
        text: 'About us',
      },
    ];

    const merged = mergeLeftRailBlocksForEditMode(viewBlocks, supported);
    const kinds = merged.map((b) => b.kind);

    expect(kinds.indexOf('name')).toBeLessThan(kinds.indexOf('title'));
    expect(kinds.indexOf('title')).toBeLessThan(kinds.indexOf('menuItems'));
    expect(kinds.indexOf('menuItems')).toBeLessThan(kinds.indexOf('button'));
    expect(kinds.indexOf('button')).toBeLessThan(kinds.indexOf('description'));
    expect(kinds).toContain('websites');

    const button = merged.find((b) => b.kind === 'button');
    expect(button?.kind).toBe('button');
    if (button?.kind === 'button') {
      expect(button.items).toEqual([]);
    }

    const website = merged.find((b) => b.kind === 'websites');
    expect(website?.kind).toBe('websites');
    if (website?.kind === 'websites') {
      expect(website.entries).toEqual([]);
    }
  });

  it('reuses existing blocks when present', () => {
    const viewBlocks: ObjectLeftRailBlock[] = [
      { kind: 'name', headingLabel: 'Name', text: 'Shop' },
    ];
    const merged = mergeLeftRailBlocksForEditMode(viewBlocks, supported);
    expect(merged.find((b) => b.kind === 'name')).toEqual(viewBlocks[0]);
  });

  it('places options before menu for product type', () => {
    const merged = mergeLeftRailBlocksForEditMode([], productSupported, 'product');
    const kinds = merged.map((b) => b.kind);
    const optionsIdx = kinds.indexOf('options');
    const menuIdx = kinds.indexOf('menuItems');
    const galleryIdx = kinds.indexOf('gallery');

    expect(galleryIdx).toBeGreaterThanOrEqual(0);
    expect(optionsIdx).toBeGreaterThan(galleryIdx);
    expect(menuIdx).toBeGreaterThan(optionsIdx);
  });
});
