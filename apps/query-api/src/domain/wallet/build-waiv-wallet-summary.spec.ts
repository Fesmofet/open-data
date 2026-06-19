import { buildWaivWalletSummary } from './build-waiv-wallet-summary';

describe('buildWaivWalletSummary', () => {
  it('computes legacy display fields', () => {
    const result = buildWaivWalletSummary(
      {
        liquid: '3.173',
        stake: '8.2',
        delegationsIn: '1.0',
        delegationsOut: '0.9',
        pendingUnstake: '0',
        pendingUndelegations: '0.1',
      },
      { waivHive: 0.5, waivUsd: 0.02 },
      null,
    );

    expect(result.display.liquidWaiv).toBe('3.173');
    expect(result.display.waivPower).toBe('9.1');
    expect(result.display.delegationsNet).toBe('0');
    expect(result.flags.showDelegationsRow).toBe(true);
    expect(result.flags.showPowerDownRow).toBe(false);
    expect(result.display.estAccountValueUsd).toBe('0.25');
  });

  it('shows power down row when pending unstake is non-zero', () => {
    const result = buildWaivWalletSummary(
      {
        liquid: '0',
        stake: '5',
        delegationsIn: '0',
        delegationsOut: '0',
        pendingUnstake: '2',
        pendingUndelegations: '0',
      },
      { waivHive: 1, waivUsd: 1 },
      1_700_000_000_000,
    );

    expect(result.flags.showPowerDownRow).toBe(true);
    expect(result.powerDown?.nextUnstakeAt).toBe(1_700_000_000_000);
  });

  it('omits powerDown when showPowerDownRow is false', () => {
    const result = buildWaivWalletSummary(
      {
        liquid: '1',
        stake: '0',
        delegationsIn: '0',
        delegationsOut: '0',
        pendingUnstake: '0',
        pendingUndelegations: '0',
      },
      { waivHive: 1, waivUsd: 1 },
      null,
    );

    expect(result.powerDown).toBeUndefined();
  });

  it('formats negative delegations net with minus prefix', () => {
    const result = buildWaivWalletSummary(
      {
        liquid: '0',
        stake: '1',
        delegationsIn: '0',
        delegationsOut: '2',
        pendingUnstake: '0',
        pendingUndelegations: '0',
      },
      { waivHive: 1, waivUsd: 1 },
      null,
    );

    expect(result.display.delegationsNet).toBe('-2');
    expect(result.flags.showDelegationsRow).toBe(true);
  });
});
