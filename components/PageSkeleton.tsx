"use client";

import { 
  Skeleton, 
  SkeletonText, 
  SkeletonSidebar, 
  SkeletonNoteEditor, 
  SkeletonCard, 
  SkeletonListItem 
} from '@/components/Skeleton';

export function PageSkeleton() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <aside className="w-[220px] shrink-0 border-r border-border bg-sidebar/60">
        <SkeletonSidebar />
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1080px] px-10 py-10">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-8" />
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-10">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </main>
    </div>
  );
}

export function NotasSkeleton() {
  return (
    <div className="flex h-full">
      <aside className="w-[260px] shrink-0 border-r border-border">
        <div className="flex items-center justify-between px-4 py-3.5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-5" />
        </div>
        <div className="px-4 pb-3">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div className="flex-1 space-y-2 px-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonListItem key={i} />
          ))}
        </div>
      </aside>
      <div className="min-w-0 flex-1 p-8">
        <SkeletonNoteEditor />
      </div>
      <aside className="hidden w-[260px] shrink-0 border-l border-border px-5 py-4 xl:flex">
        <SkeletonText lines={2} />
        <Skeleton className="h-5 w-24 mb-4" />
        <SkeletonText lines={4} />
      </aside>
    </div>
  );
}

export function LembretesSkeleton() {
  return (
    <div className="flex h-full">
      <div className="flex w-full min-w-0 flex-1 flex-col border-r border-border lg:max-w-[560px]">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <Skeleton className="h-5 w-32" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <div className="flex-1 space-y-4 px-6 py-5">
          {[1, 2, 3].map((group) => (
            <div key={group} className="space-y-2">
              <Skeleton className="h-4 w-20 mb-2" />
              {[1, 2, 3].map((i) => (
                <SkeletonListItem key={`${group}-${i}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="hidden flex-1 flex-col bg-accent/30 lg:flex">
        <div className="p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <SkeletonCard />
          <Skeleton className="h-5 w-24 mb-2" />
          <SkeletonText lines={3} />
        </div>
      </div>
    </div>
  );
}

export function CalendarioSkeleton() {
  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-3.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid grid-cols-7 border-b border-border text-center text-[11px]">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
        </div>
        <div className="grid flex-1 grid-cols-7 grid-rows-6 gap-1 p-2">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="h-full p-2 animate-pulse">
              <Skeleton className="h-6 w-6 rounded-full mx-auto mb-1" />
              <SkeletonText lines={2} />
            </div>
          ))}
        </div>
      </div>
      <div className="hidden w-[300px] shrink-0 flex-col border-l border-border px-5 py-5 lg:flex">
        <Skeleton className="h-5 w-40 mb-2" />
        <SkeletonText lines={2} />
        <SkeletonCard />
        <Skeleton className="h-4 w-20 mt-4 mb-2" />
        {[1, 2, 3].map((i) => (
          <SkeletonListItem key={i} />
        ))}
        <Skeleton className="h-10 w-full mt-4" />
      </div>
    </div>
  );
}