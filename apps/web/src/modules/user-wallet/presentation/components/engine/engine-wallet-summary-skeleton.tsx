export function EngineWalletSummarySkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading Hive Engine wallet"
      className="animate-pulse space-y-3 rounded-card border border-border bg-surface/80 p-card-padding"
    >
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
  );
}
