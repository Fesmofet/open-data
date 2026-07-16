import {
  directionalAmountsForViewer,
  formatDisplayUsd,
} from './directional-usd';

describe('directionalAmountsForViewer', () => {
  const bucket = {
    owesAtoB: '110.00000000',
    owesBtoA: '0.00000000',
    netUsd: '-110.00000000',
  };

  it('maps owesAtoB when viewer is accountA', () => {
    expect(directionalAmountsForViewer('alice', 'alice', 'bob', bucket)).toEqual({
      viewerOwes: 110,
      owesViewer: 0,
    });
  });

  it('maps owesBtoA when viewer is accountB', () => {
    expect(directionalAmountsForViewer('bob', 'alice', 'bob', bucket)).toEqual({
      viewerOwes: 0,
      owesViewer: 110,
    });
  });
});

describe('formatDisplayUsd', () => {
  it('formats to two decimal places', () => {
    expect(formatDisplayUsd(110)).toBe('110.00');
    expect(formatDisplayUsd(0)).toBe('0.00');
  });
});
