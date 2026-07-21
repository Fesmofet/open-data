export function EngineWalletSummarySkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading Hive Engine wallet"
      className="overflow-hidden rounded-card border border-border bg-surface"
    >
      <div className="flex items-center gap-4 border-b border-border px-card-padding py-4 [background-color:color-mix(in_srgb,var(--color-muted)_10%,transparent)]">
        <div className="h-10 w-10 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-36 animate-pulse rounded bg-muted/30" />
          <div className="h-3 w-40 animate-pulse rounded bg-muted/20" />
        </div>
        <div className="shrink-0 space-y-2">
          <div className="ml-auto h-3 w-28 animate-pulse rounded bg-muted/20" />
          <div className="ml-auto h-4 w-24 animate-pulse rounded bg-muted/30" />
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
