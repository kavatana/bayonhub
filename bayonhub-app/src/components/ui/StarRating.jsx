import { Star } from "lucide-react"
import { cn } from "../../lib/utils"

export default function StarRating({ rating = 0, className = "" }) {
  const rounded = Math.round(Number(rating || 0))
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-amber-500", className)}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={cn("h-4 w-4", index < rounded ? "fill-current" : "fill-none")}
        />
      ))}
      <span className="sr-only">{rating} / 5</span>
    </span>
  )
}
