export function WaivWalletSummarySkeleton() {
  return (
    <section
      className="overflow-hidden rounded-card border border-border bg-surface shadow-card"
      aria-busy="true"
      aria-label="Loading WAIV wallet"
    >
      <div className="flex items-start gap-2 border-b border-border px-3 py-3 sm:gap-4 sm:px-card-padding sm:py-4 [background-color:color-mix(in_srgb,var(--color-accent)_7%,transparent)]">
        <div className="hidden h-10 w-10 shrink-0 sm:block" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-4 w-28 animate-pulse rounded bg-muted/50" />
          <div className="h-3 w-40 animate-pulse rounded bg-muted/40" />
        </div>
        <div className="max-w-[42%] shrink-0 space-y-1.5 sm:max-w-none">
          <div className="ml-auto h-3 w-24 animate-pulse rounded bg-muted/40 sm:w-28" />
          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-muted/50 sm:w-24" />
        </div>
      </div>
      <div className="p-card-padding">
        {Array.from({ length: 3 }, (_, i) => (
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
