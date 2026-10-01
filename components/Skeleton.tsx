"use client";

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-muted rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-muted rounded animate-pulse mb-2" style={{ width: `${70 + (i * 7) % 30}%` }} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-card p-4 animate-pulse ${className}`}>
      <Skeleton className="h-6 w-3/4 mb-4" />
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonListItem({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 p-2 animate-pulse ${className}`}>
      <Skeleton className="h-5 w-5 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonNoteEditor({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 animate-pulse ${className}`}>
      <Skeleton className="h-10 w-1/2" />
      <SkeletonText lines={2} />
      <Skeleton className="min-h-[300px] w-full rounded-lg border border-border" />
    </div>
  );
}

export function SkeletonSidebar({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-4 p-3 animate-pulse ${className}`}>
      <Skeleton className="h-10 w-20 rounded-full" />
      <Skeleton className="h-10 w-full rounded-md" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-md" />
        ))}
      </div>
      <div className="space-y-2 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}