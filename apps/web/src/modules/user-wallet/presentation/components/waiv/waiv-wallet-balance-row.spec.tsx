/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

import { WaivWalletBalanceRow } from './waiv-wallet-balance-row';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

describe('WaivWalletBalanceRow', () => {
  it('renders inline row actions when actions are provided', () => {
    render(
      <WaivWalletBalanceRow
        title="WAIV"
        subtitle="Liquid"
        amount="10"
        amountSuffix="WAIV"
        actions={{
          primaryLabel: 'Power up',
          onPrimary: jest.fn(),
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Power up' })).toBeInTheDocument();
  });

  it('does not render row actions when actions are absent', () => {
    render(
      <WaivWalletBalanceRow
        title="WAIV"
        subtitle="Liquid"
        amount="10"
        amountSuffix="WAIV"
      />,
    );

    expect(screen.queryByRole('button', { name: 'Power up' })).not.toBeInTheDocument();
  });
});
