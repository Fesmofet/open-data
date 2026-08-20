export default function ProfileMessagesLoading() {
  return (
    <div
      className="-mb-section-y-sm min-h-[12rem] overflow-hidden rounded-card border border-border bg-bg"
      aria-busy="true"
      aria-label="Loading messages"
    >
      <div className="flex h-full min-h-[12rem] flex-col lg:flex-row">
        <div className="hidden border-r border-border p-4 lg:block lg:w-[17.5rem]">
          <div className="h-6 w-24 animate-pulse rounded-btn bg-surface-control" />
          <div className="mt-4 h-10 animate-pulse rounded-btn bg-surface-control" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="size-11 animate-pulse rounded-full bg-surface-control" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded-btn bg-surface-control" />
                  <div className="h-3 w-32 animate-pulse rounded-btn bg-surface-control" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex min-h-[12rem] flex-1 items-center justify-center p-6">
          <div className="h-4 w-40 animate-pulse rounded-btn bg-surface-control" />
        </div>
      </div>
    </div>
  );
}
