interface SkeletonCardsProps {
  count?: number;
  columns?: 2 | 3;
}

export default function SkeletonCards({ count = 3, columns = 3 }: SkeletonCardsProps) {
  return (
    <div
      className={`grid grid-cols-1 gap-5 md:grid-cols-2 ${columns === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}
      role="status"
      aria-label="Loading content"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="min-h-64 rounded-xl border border-slate-800 bg-slate-900 p-5"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-slate-800 motion-reduce:animate-none" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-800 motion-reduce:animate-none" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800/80 motion-reduce:animate-none" />
            </div>
          </div>
          <div className="mb-4 flex gap-2">
            <div className="h-6 w-24 animate-pulse rounded-md bg-slate-800 motion-reduce:animate-none" />
            <div className="h-6 w-20 animate-pulse rounded-md bg-slate-800 motion-reduce:animate-none" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-slate-800/80 motion-reduce:animate-none" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-slate-800/80 motion-reduce:animate-none" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-800/80 motion-reduce:animate-none" />
          </div>
          <div className="mt-6 h-9 w-full animate-pulse rounded-md bg-slate-800 motion-reduce:animate-none" />
        </div>
      ))}
      <span className="sr-only">Loading content…</span>
    </div>
  );
}
