import { telephoneHref } from './telephone-display.utils';

describe('telephoneHref', () => {
  it('builds tel link from formatted number', () => {
    expect(telephoneHref('+1 604-423-3447')).toBe('tel:+16044233447');
  });

  it('returns hash when no dialable digits', () => {
    expect(telephoneHref('—')).toBe('#');
  });
});
