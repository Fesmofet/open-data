function PulseBlock({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-btn bg-surface-control ${className}`} aria-hidden />
  );
}

export function GalleryAlbumCardSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-btn border border-border bg-surface/60"
      aria-busy="true"
      aria-label="Loading album"
    >
      <PulseBlock className="aspect-square w-full rounded-none" />
      <div className="px-2 py-2">
        <PulseBlock className="h-4 w-24" />
      </div>
    </div>
  );
}

export function GalleryPhotoSkeleton() {
  return <PulseBlock className="aspect-square w-full" />;
}

export type GalleryPhotoGridSkeletonProps = {
  count?: number;
};

export function GalleryPhotoGridSkeleton({ count = 6 }: GalleryPhotoGridSkeletonProps) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-2"
      aria-busy="true"
      aria-label="Loading gallery images"
    >
      {Array.from({ length: count }).map((_, index) => (
        <GalleryPhotoSkeleton key={index} />
      ))}
    </div>
  );
}
