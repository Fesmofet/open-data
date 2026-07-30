export function NotificationSettingsSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="space-y-3">
        <div className="h-4 w-48 rounded bg-surface-control" />
        <div className="h-4 w-full max-w-2xl rounded bg-surface-control" />
      </div>
      {Array.from({ length: 4 }, (_, section) => (
        <div key={section} className="space-y-4">
          <div className="h-5 w-40 rounded bg-surface-control" />
          {Array.from({ length: 4 }, (_, row) => (
            <div key={row} className="flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-surface-control" />
              <div className="h-4 w-56 rounded bg-surface-control" />
            </div>
          ))}
        </div>
      ))}
      <div className="h-10 w-24 rounded-btn bg-surface-control" />
    </div>
  );
}
