export function EngineWalletSummarySkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading Hive Engine wallet"
      className="overflow-hidden rounded-card border border-border bg-surface"
    >
      <div className="flex items-start gap-2 border-b border-border px-3 py-3 sm:gap-4 sm:px-card-padding sm:py-4 [background-color:color-mix(in_srgb,var(--color-muted)_10%,transparent)]">
        <div className="hidden h-10 w-10 shrink-0 sm:block" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-4 w-36 animate-pulse rounded bg-muted/30" />
          <div className="h-3 w-40 animate-pulse rounded bg-muted/20" />
        </div>
        <div className="max-w-[42%] shrink-0 space-y-1.5 sm:max-w-none">
          <div className="ml-auto h-3 w-24 animate-pulse rounded bg-muted/20 sm:w-28" />
          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-muted/30 sm:w-24" />
        </div>
      </div>
      <div className="animate-pulse space-y-3 p-card-padding">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex gap-3 py-2">
            <div className="h-10 w-10 rounded-full bg-muted/30" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-muted/30" />
              <div className="h-3 w-1/2 rounded bg-muted/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
