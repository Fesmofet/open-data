/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

import { CryptoPriceDisplay } from './crypto-price-display';

describe('CryptoPriceDisplay', () => {
  it('renders em dash when USD price is null', () => {
    render(<CryptoPriceDisplay usdPrice={null} usdChangePercent={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows USD change percent when enabled', () => {
    render(
      <CryptoPriceDisplay
        usdPrice={0.25}
        usdChangePercent={2.5}
        showUsdChangePercent
      />,
    );

    expect(screen.getByText('$0.25')).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === '(2.50%)▲')).toBeInTheDocument();
  });

  it('hides USD change percent for HBD-style rows', () => {
    render(
      <CryptoPriceDisplay
        usdPrice={1}
        usdChangePercent={0.1}
        showUsdChangePercent={false}
      />,
    );

    expect(screen.queryByText('0.10%')).not.toBeInTheDocument();
  });

  it('renders secondary quote with currency label', () => {
    render(
      <CryptoPriceDisplay
        usdPrice={0.25}
        usdChangePercent={2.5}
        secondary={{
          currency: 'BTC',
          price: 0.000004,
          changePercent: 1.1,
        }}
      />,
    );

    expect(screen.getByText(/BTC/)).toBeInTheDocument();
    expect(screen.getByText('(1.10%)')).toBeInTheDocument();
  });

  it('uses accent class for primary USD price', () => {
    const { container } = render(
      <CryptoPriceDisplay usdPrice={0.03} usdChangePercent={null} minimumFractionDigits={3} />,
    );

    expect(container.querySelector('.text-accent')).toBeTruthy();
  });
});
