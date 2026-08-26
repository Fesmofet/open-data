import {
  NAVIGATE_SECTION_BLOCK_ORDER,
  bookTypeAboutRemainderOrder,
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

  it('places author before parent and menu in book edit order', () => {
    const order = resolveEditModeLeftRailBlockOrder('book');
    const authorIdx = order.indexOf('author');
    const parentIdx = order.indexOf('parent');
    const menuIdx = order.indexOf('menuItems');

    expect(authorIdx).toBeGreaterThan(order.indexOf('title'));
    expect(authorIdx).toBeLessThan(parentIdx);
    expect(authorIdx).toBeLessThan(menuIdx);
    expect(order.lastIndexOf('author')).toBe(authorIdx);
  });

  it('places book reading metadata after websites in book about remainder', () => {
    const order = bookTypeAboutRemainderOrder();
    const websitesIdx = order.indexOf('websites');
    const ageIdx = order.indexOf('typicalAgeRange');
    const languageIdx = order.indexOf('inLanguage');
    const dateIdx = order.indexOf('datePublished');
    const lengthIdx = order.indexOf('printLength');

    expect(order.indexOf('author')).toBe(-1);
    expect(websitesIdx).toBeGreaterThanOrEqual(0);
    expect(ageIdx).toBe(websitesIdx + 1);
    expect(languageIdx).toBe(ageIdx + 1);
    expect(dateIdx).toBe(languageIdx + 1);
    expect(lengthIdx).toBe(dateIdx + 1);
  });

  it('uses list-specific edit order for list object type', () => {
    const order = resolveEditModeLeftRailBlockOrder('list');
    expect(order.indexOf('sortCustom')).toBeLessThan(order.indexOf('gallery'));
    expect(order.indexOf('promotion')).toBeGreaterThan(order.indexOf('description'));
    expect(order.indexOf('pin')).toBeGreaterThan(order.indexOf('gallery'));
    expect(order.indexOf('remove')).toBeGreaterThan(order.indexOf('pin'));
    expect(order.indexOf('delegation')).toBeGreaterThan(order.indexOf('link'));
    expect(order.includes('menuItems')).toBe(false);
  });
});
