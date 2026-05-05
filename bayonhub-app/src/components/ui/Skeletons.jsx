export function DashboardSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-6 animate-pulse">
      <div className="hidden md:block w-64 shrink-0 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 w-full rounded-xl bg-neutral-200 dark:bg-neutral-800" />
        ))}
      </div>
      <div className="flex-1 space-y-4">
        <div className="h-10 w-48 rounded-xl bg-neutral-200 dark:bg-neutral-800 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 w-full rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function PostAdWizardSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-10 w-48 rounded-xl bg-neutral-200 dark:bg-neutral-800 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="h-64 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
          <div className="space-y-4">
            <div className="h-12 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-12 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-32 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-48 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-32 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
    </div>
  )
}
