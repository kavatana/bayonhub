import { useState } from "react"
import { MessageSquare, Star } from "lucide-react"
import { toast } from "react-hot-toast"
import { useTranslation } from "../../hooks/useTranslation"
import Button from "./Button"
import Modal from "./Modal"
import { cn } from "../../lib/utils"

export default function FeedbackTab() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")

  function handleSubmit(e) {
    e.preventDefault()
    if (rating === 0) {
      toast.error(t("ui.error"))
      return
    }

    const existing = JSON.parse(localStorage.getItem('bayonhub:feedback') || '[]')
    existing.push({
      id: Date.now().toString(),
      rating,
      comment,
      createdAt: new Date().toISOString()
    })
    localStorage.setItem('bayonhub:feedback', JSON.stringify(existing))

    toast.success(t("ui.feedbackSaved"))
    setOpen(false)
    setRating(0)
    setComment("")
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-primary p-3 text-sm font-bold text-white shadow-xl transition hover:scale-110 active:scale-95 md:bottom-auto md:right-0 md:top-1/2 md:rounded-none md:rounded-tl-xl md:rounded-bl-xl md:px-4 md:py-2 md:-translate-y-1/2 md:-rotate-90 md:[transform-origin:bottom_right]"
        type="button"
      >
        <MessageSquare className="h-5 w-5 md:h-4 md:w-4" aria-hidden="true" />
        <span className="md:inline">{t("ui.feedback")}</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("ui.feedback")}>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  className={cn(
                    "h-8 w-8",
                    (hoverRating || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-neutral-300 dark:text-neutral-600"
                  )}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
          <textarea
            className="h-32 w-full resize-none rounded-xl border border-neutral-200 p-3 text-sm outline-none focus:border-primary dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
            placeholder="..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button type="submit">{t("ui.submitFeedback")}</Button>
        </form>
      </Modal>
    </>
  )
}
