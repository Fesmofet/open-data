export function BusinessListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <li
          key={index}
          className="rounded-card border border-border bg-surface p-card-padding shadow-card"
        >
          <div className="flex animate-pulse flex-col gap-2">
            <div className="h-4 w-2/5 rounded bg-surface-alt" />
            <div className="h-3 w-1/4 rounded bg-surface-alt" />
          </div>
        </li>
      ))}
    </ul>
  );
}
