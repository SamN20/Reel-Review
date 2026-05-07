function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-zinc-800/70 ${className}`} />;
}

function ShelfSkeletonCard() {
  return (
    <div className="relative min-w-[82vw] sm:min-w-[390px] md:min-w-[430px] lg:min-w-[460px] xl:min-w-[500px] aspect-[16/10] sm:aspect-[16/9] snap-start overflow-hidden rounded-lg border border-zinc-800/70 bg-zinc-900/70">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-900 via-zinc-800/60 to-zinc-950" />
      <div className="absolute left-3 top-3 z-10 h-6 w-28 animate-pulse rounded border border-zinc-800/70 bg-zinc-950/70 sm:left-4 sm:top-4" />
      <div className="absolute right-3 top-3 z-10 h-8 w-14 animate-pulse rounded-lg border border-zinc-800/70 bg-zinc-950/70 sm:right-4 sm:top-4" />
      <div className="absolute bottom-0 left-0 z-10 w-full p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <SkeletonBlock className="h-3 w-12" />
          <SkeletonBlock className="h-3 w-20" />
        </div>
        <SkeletonBlock className="mb-4 h-6 w-3/4 sm:h-7" />
        <div className="flex items-center justify-between border-t border-zinc-800/60 pt-3">
          <SkeletonBlock className="h-4 w-28" />
          <div className="flex gap-2 sm:hidden">
            <SkeletonBlock className="h-7 w-16" />
            <SkeletonBlock className="h-7 w-12" />
          </div>
          <SkeletonBlock className="hidden h-5 w-16 sm:block" />
        </div>
      </div>
    </div>
  );
}

export function ShelfSkeletonRow({ index }: { index: number }) {
  return (
    <section
      aria-label={`Loading shelf ${index + 1}`}
      className="relative"
      data-testid="film-shelf-skeleton-row"
    >
      <div className="mb-4 flex items-end justify-between gap-4 px-4 md:px-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-6 w-6" />
            <SkeletonBlock className="h-6 w-40 md:h-7 md:w-56" />
          </div>
          <SkeletonBlock className="mt-2 h-4 w-64 max-w-[70vw]" />
        </div>
        <SkeletonBlock className="hidden h-5 w-24 sm:block" />
      </div>

      <div className="hide-scrollbar flex gap-4 overflow-x-hidden px-4 pb-7 snap-x snap-mandatory md:px-8">
        {Array.from({ length: 4 }).map((_, cardIndex) => (
          <ShelfSkeletonCard key={`skeleton-card-${index}-${cardIndex}`} />
        ))}
      </div>
    </section>
  );
}

export function FilmShelfSkeleton() {
  return (
    <div aria-label="Loading Film Shelf shelves" className="space-y-10" role="status">
      {Array.from({ length: 4 }).map((_, index) => (
        <ShelfSkeletonRow key={`skeleton-row-${index}`} index={index} />
      ))}
    </div>
  );
}
