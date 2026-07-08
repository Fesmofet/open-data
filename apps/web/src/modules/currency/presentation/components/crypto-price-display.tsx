'use client';

type CryptoPriceDisplayProps = {
  usdPrice: number | null;
  usdChangePercent: number | null;
  showUsdChangePercent?: boolean;
  minimumFractionDigits?: number;
  align?: 'start' | 'end';
  secondary?: {
    currency: string;
    price: number;
    changePercent: number;
  } | null;
};

function formatUsd(value: number, minimumFractionDigits: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  }).format(value);
}

function formatTokenAmount(value: number, minimumFractionDigits: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  }).format(value);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

function changeToneClass(changePercent: number | null): string {
  if (changePercent == null || changePercent === 0) {
    return 'text-muted';
  }

  return changePercent > 0 ? 'text-success' : 'text-error';
}

export function CryptoPriceDisplay({
  usdPrice,
  usdChangePercent,
  showUsdChangePercent = true,
  minimumFractionDigits = 2,
  align = 'end',
  secondary = null,
}: CryptoPriceDisplayProps) {
  const usdTone = changeToneClass(usdChangePercent);
  const secondaryTone = secondary ? changeToneClass(secondary.changePercent) : 'text-muted';
  const alignClass = align === 'start' ? 'text-start' : 'text-end';

  return (
    <div className={`min-w-0 space-y-0.5 overflow-hidden ${alignClass}`}>
      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
        <span className="text-body font-weight-strong text-accent">
          {usdPrice == null ? '—' : formatUsd(usdPrice, minimumFractionDigits)}
        </span>

        {showUsdChangePercent && usdChangePercent != null ? (
          <span className={`text-caption font-weight-strong ${usdTone}`}>
            ({formatPercent(usdChangePercent)})
            <span aria-hidden className="ms-0.5">
              {usdChangePercent >= 0 ? '▲' : '▼'}
            </span>
          </span>
        ) : null}
      </div>

      {secondary ? (
        <div className={`text-caption font-weight-strong ${secondaryTone}`}>
          <span className="text-muted">
            {formatTokenAmount(secondary.price, secondary.currency === 'BTC' ? 7 : 3)}{' '}
            {secondary.currency}
          </span>
          {secondary.changePercent !== 0 ? (
            <span className="ms-1">({formatPercent(secondary.changePercent)})</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
