import { useTranslation } from "../../hooks/useTranslation"
import { cn } from "../../lib/utils"

export default function StepIndicator({ steps = [], currentStep = 0, loading = false, error = null, empty = false }) {
  const { t } = useTranslation()

  if (loading) return <div className="h-16 animate-pulse rounded-xl bg-neutral-100" />
  if (error) return <p className="text-sm font-semibold text-red-600">{error}</p>
  if (empty || !steps.length) return null

  return (
    <ol aria-label={t("ui.steps")} className="flex w-full gap-2">
      {steps.map((step, index) => {
        const completed = index < currentStep
        const current = index === currentStep
        return (
          <li key={`${step}-${index}`} className="relative flex min-w-0 flex-1 flex-col items-center gap-2">
            {index > 0 ? (
              <span
                className={cn(
                  "absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2",
                  completed || current ? "bg-primary" : "bg-neutral-200",
                )}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 grid h-8 w-8 place-items-center rounded-full border-2 text-sm font-black",
                completed && "border-primary bg-primary text-white",
                current && "border-primary bg-white text-primary ring-4 ring-primary/15",
                !completed && !current && "border-neutral-200 bg-white text-neutral-400",
              )}
            >
              {index + 1}
            </span>
            <span
              className={cn(
                "hidden max-w-24 text-center text-xs font-bold sm:block",
                completed || current ? "text-neutral-900" : "text-neutral-400",
              )}
            >
              {step}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
