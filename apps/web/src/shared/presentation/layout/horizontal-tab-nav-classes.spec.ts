import {
  HORIZONTAL_TAB_NAV_SCROLL_CLASS,
  HORIZONTAL_TAB_NAV_SUB_ROW_CLASS,
  horizontalTabNavScrollShellClass,
} from './horizontal-tab-nav-classes';

describe('horizontalTabNavScrollShellClass', () => {
  it('includes scroll, overflow-y-hidden, and gutter bleed by default', () => {
    const result = horizontalTabNavScrollShellClass('gutter');
    expect(result).toContain(HORIZONTAL_TAB_NAV_SCROLL_CLASS);
    expect(result).toContain('overflow-y-hidden');
    expect(result).toContain('-mx-gutter');
  });

  it('uses card bleed when requested', () => {
    const result = horizontalTabNavScrollShellClass('card');
    expect(result).toContain('-mx-card-padding');
  });

  it('sub row includes border-b', () => {
    expect(HORIZONTAL_TAB_NAV_SUB_ROW_CLASS).toContain('border-b');
    expect(HORIZONTAL_TAB_NAV_SUB_ROW_CLASS).toContain('flex-nowrap');
  });
});
