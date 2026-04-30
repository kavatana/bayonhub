import { memo } from "react"
import { useTranslation } from "../../hooks/useTranslation"
import { cn } from "../../lib/utils"

function BodyShape({ type, selected }) {
  const shapeClass = selected ? "bg-white" : "bg-neutral-400"
  const wheelClass = selected ? "bg-white" : "bg-neutral-700"

  if (type === "pickup") {
    return (
      <span className="relative h-7 w-14">
        <span className={cn("absolute bottom-2 left-1 h-4 w-8 rounded-t-sm", shapeClass)} />
        <span className={cn("absolute bottom-2 right-1 h-3 w-5 rounded-sm", shapeClass)} />
        <span className={cn("absolute bottom-0 left-3 h-2 w-2 rounded-full", wheelClass)} />
        <span className={cn("absolute bottom-0 right-2 h-2 w-2 rounded-full", wheelClass)} />
      </span>
    )
  }

  if (type === "suv" || type === "van") {
    return (
      <span className="relative h-7 w-14">
        <span className={cn("absolute bottom-2 left-1 h-5 w-12 rounded-t-md", shapeClass)} />
        <span className={cn("absolute bottom-0 left-3 h-2 w-2 rounded-full", wheelClass)} />
        <span className={cn("absolute bottom-0 right-3 h-2 w-2 rounded-full", wheelClass)} />
      </span>
    )
  }

  if (type === "hatchback" || type === "wagon") {
    return (
      <span className="relative h-7 w-14">
        <span className={cn("absolute bottom-2 left-1 h-4 w-12 rounded-t-lg", shapeClass)} />
        <span className={cn("absolute bottom-0 left-3 h-2 w-2 rounded-full", wheelClass)} />
        <span className={cn("absolute bottom-0 right-3 h-2 w-2 rounded-full", wheelClass)} />
      </span>
    )
  }

  return (
    <span className="relative h-7 w-14">
      <span className={cn("absolute bottom-2 left-2 h-3 w-10 rounded-t-full", shapeClass)} />
      <span className={cn("absolute bottom-0 left-3 h-2 w-2 rounded-full", wheelClass)} />
      <span className={cn("absolute bottom-0 right-3 h-2 w-2 rounded-full", wheelClass)} />
    </span>
  )
}

function BodyTypeFilter({ types = [], selected = "", onChange }) {
  const { language } = useTranslation()

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {types.map((type) => {
        const isSelected = selected === type.id
        return (
          <button
            aria-pressed={isSelected}
            className={cn(
              "grid w-24 shrink-0 justify-items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-xs font-black text-neutral-700 transition",
              isSelected && "border-primary bg-primary text-white",
            )}
            key={type.id}
            onClick={() => onChange?.(isSelected ? "" : type.id)}
            type="button"
          >
            <span className="line-clamp-1">{type.label[language]}</span>
            <BodyShape selected={isSelected} type={type.id} />
          </button>
        )
      })}
    </div>
  )
}

export default memo(BodyTypeFilter)
