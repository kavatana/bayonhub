import SkeletonCard from "../ui/SkeletonCard"

function SkeletonBlock({ className = "" }) {
  return (
    <span
      className={`block rounded-lg bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-100 bg-[length:200%_100%] animate-shimmer ${className}`}
    />
  )
}

export default function SellerPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <SkeletonBlock className="h-48 rounded-none bg-neutral-200" />
        <div className="px-6 pb-6">
          <SkeletonBlock className="-mt-10 h-20 w-20 rounded-full bg-neutral-300" />
          <SkeletonBlock className="mt-4 h-5 w-40" />
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonBlock className="h-16 rounded-xl" key={index} />
            ))}
          </div>
        </div>
      </section>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </div>
  )
}
