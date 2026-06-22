export function WaivWalletSummarySkeleton() {
  return (
    <section
      className="rounded-card border border-border bg-surface p-card-padding shadow-card"
      aria-busy="true"
      aria-label="Loading WAIV wallet"
    >
      {Array.from({ length: 4 }, (_, i) => (
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
    </section>
  );
}
