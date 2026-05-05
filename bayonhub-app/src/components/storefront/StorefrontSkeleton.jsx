export default function StorefrontSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 animate-pulse">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="h-44 sm:h-[300px] bg-neutral-200" />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="h-20 w-20 rounded-full border-4 border-white bg-neutral-300 shadow" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-neutral-200 rounded" />
              <div className="h-8 w-64 bg-neutral-300 rounded" />
              <div className="h-4 w-48 bg-neutral-200 rounded" />
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-16 bg-neutral-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="h-10 w-48 bg-neutral-200 rounded" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-neutral-100 rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="h-96 bg-neutral-100 rounded-2xl" />
      </div>
    </div>
  )
}
