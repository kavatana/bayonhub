export default function ListingPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-neutral-200" />
          <div className="space-y-4 rounded-2xl border border-neutral-100 bg-white p-6">
            <div className="h-8 w-3/4 animate-pulse rounded-lg bg-neutral-200" />
            <div className="h-6 w-1/4 animate-pulse rounded-lg bg-neutral-200" />
            <div className="space-y-2 pt-4">
              <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-200" />
            </div>
          </div>
        </div>
        <div className="hidden space-y-4 lg:block">
          <div className="h-64 w-full animate-pulse rounded-2xl bg-neutral-200" />
          <div className="h-48 w-full animate-pulse rounded-2xl bg-neutral-200" />
        </div>
      </div>
    </div>
  )
}
