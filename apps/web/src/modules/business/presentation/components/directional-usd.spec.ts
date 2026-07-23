import {
  directionalAmountsForViewer,
  formatDisplayUsd,
  shouldShowPendingWhenSettled,
  viewerNetUsd,
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

describe('viewerNetUsd', () => {
  it('maps positive netUsd to counterparty debt when viewer is accountA', () => {
    expect(viewerNetUsd('alice', 'alice', 'bob', '70.00000000')).toBe(70);
    expect(viewerNetUsd('bob', 'alice', 'bob', '70.00000000')).toBe(-70);
  });

  it('handles clamped gross buckets with non-zero net (bidirectional payments)', () => {
    const bucket = {
      owesAtoB: '0.00000000',
      owesBtoA: '0.00000000',
      netUsd: '3.00000000',
    };
    expect(viewerNetUsd('flowmaster', 'flowmaster', 'fesmofet', bucket.netUsd)).toBe(3);
    expect(viewerNetUsd('fesmofet', 'flowmaster', 'fesmofet', bucket.netUsd)).toBe(-3);
    expect(directionalAmountsForViewer('flowmaster', 'flowmaster', 'fesmofet', bucket)).toEqual({
      viewerOwes: 0,
      owesViewer: 0,
    });
  });
});

describe('formatDisplayUsd', () => {
  it('formats to two decimal places', () => {
    expect(formatDisplayUsd(110)).toBe('110.00');
    expect(formatDisplayUsd(0)).toBe('0.00');
  });
});

describe('shouldShowPendingWhenSettled', () => {
  const confirmedSettled = {
    owesAtoB: '0.00000000',
    owesBtoA: '0.00000000',
    netUsd: '0.00000000',
  };
  const pendingOwes = {
    owesAtoB: '10.00000000',
    owesBtoA: '0.00000000',
    netUsd: '-10.00000000',
  };

  it('is true when confirmed is settled and pending is non-zero', () => {
    expect(
      shouldShowPendingWhenSettled(
        'flowmaster',
        'flowmaster',
        'shadow.hunter',
        confirmedSettled,
        pendingOwes,
      ),
    ).toBe(true);
  });

  it('is false when pending is also zero', () => {
    expect(
      shouldShowPendingWhenSettled(
        'flowmaster',
        'flowmaster',
        'shadow.hunter',
        confirmedSettled,
        confirmedSettled,
      ),
    ).toBe(false);
  });
});
