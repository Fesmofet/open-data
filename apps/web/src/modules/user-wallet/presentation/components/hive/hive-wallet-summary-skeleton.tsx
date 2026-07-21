export function HiveWalletSummarySkeleton() {
  return (
    <section
      className="overflow-hidden rounded-card border border-border bg-surface shadow-card"
      aria-busy="true"
      aria-label="Loading HIVE wallet"
    >
      <div className="flex items-center gap-4 border-b border-border px-card-padding py-4 [background-color:color-mix(in_srgb,var(--color-error)_7%,transparent)]">
        <div className="h-10 w-10 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-28 animate-pulse rounded bg-muted/50" />
          <div className="h-3 w-44 animate-pulse rounded bg-muted/40" />
        </div>
        <div className="shrink-0 space-y-2">
          <div className="ml-auto h-3 w-28 animate-pulse rounded bg-muted/40" />
          <div className="ml-auto h-4 w-24 animate-pulse rounded bg-muted/50" />
        </div>
      </div>
      <div className="p-card-padding">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="flex animate-pulse items-center gap-4 border-b border-border py-4 last:border-b-0"
          >
            <div className="h-10 w-10 rounded-full bg-muted/50" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-muted/50" />
              <div className="h-3 w-48 rounded bg-muted/40" />
            </div>
            <div className="h-8 w-28 rounded-btn bg-muted/50" />
          </div>
        ))}
      </div>
    </section>
  );
}
