/**
 * @jest-environment jsdom
 */
import { writeDiscoverObjectTypeCookie, DISCOVER_TYPE_COOKIE } from './discover-type-cookie';

describe('writeDiscoverObjectTypeCookie', () => {
  beforeEach(() => {
    document.cookie = `${DISCOVER_TYPE_COOKIE}=; Max-Age=0; path=/`;
  });

  it('persists a valid registry object type', () => {
    writeDiscoverObjectTypeCookie('restaurant');
    expect(document.cookie).toContain(`${DISCOVER_TYPE_COOKIE}=restaurant`);
  });

  it('does not persist type=all', () => {
    writeDiscoverObjectTypeCookie('all');
    expect(document.cookie).not.toContain(`${DISCOVER_TYPE_COOKIE}=all`);
  });

  it('does not persist unknown object types', () => {
    writeDiscoverObjectTypeCookie('not-a-type');
    expect(document.cookie).not.toContain('not-a-type');
  });
});
