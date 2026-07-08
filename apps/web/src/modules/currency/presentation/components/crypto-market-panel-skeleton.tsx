const MARKET_PANEL_CARD_CLASS =
  'min-w-0 overflow-x-hidden rounded-card border border-border bg-surface/60 p-card-padding';

export function CryptoMarketPanelSkeleton() {
  return (
    <div className={MARKET_PANEL_CARD_CLASS} aria-hidden>
      <div className="mb-3 h-6 w-24 animate-pulse rounded-btn bg-surface-control" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2 border-t border-border pt-3 first:border-t-0 first:pt-0">
            <div className="flex justify-between gap-3">
              <div className="h-5 w-16 animate-pulse rounded-btn bg-surface-control" />
              <div className="h-5 w-24 animate-pulse rounded-btn bg-surface-control" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
