import {
  NAVIGATE_SECTION_BLOCK_ORDER,
  resolveEditModeLeftRailBlockOrder,
} from './object-left-rail-order';

describe('resolveEditModeLeftRailBlockOrder', () => {
  it('places navigate cluster before menu for product', () => {
    const order = resolveEditModeLeftRailBlockOrder('product');
    const galleryIdx = order.indexOf('gallery');
    const optionsIdx = order.indexOf('options');
    const menuIdx = order.indexOf('menuItems');

    expect(galleryIdx).toBeGreaterThanOrEqual(0);
    expect(optionsIdx).toBeGreaterThan(galleryIdx);
    expect(menuIdx).toBeGreaterThan(optionsIdx);
    expect([...NAVIGATE_SECTION_BLOCK_ORDER].every((id) => order.includes(id))).toBe(true);
  });

  it('keeps generic order for non-product types', () => {
    const order = resolveEditModeLeftRailBlockOrder('restaurant');
    expect(order.indexOf('menuItems')).toBeLessThan(order.indexOf('description'));
    expect(order.indexOf('gallery')).toBeLessThan(order.indexOf('options'));
  });
});
