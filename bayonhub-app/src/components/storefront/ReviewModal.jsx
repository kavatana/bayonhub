import { useEffect, useState } from "react"
import { Star } from "lucide-react"
import { cn } from "../../lib/utils"
import Modal from "../ui/Modal"
import Button from "../ui/Button"
import { useTranslation } from "../../hooks/useTranslation"
import toast from "react-hot-toast"
import { useStorefrontStore } from "../../store/useStorefrontStore"

const reviewTags = [
  ["trustworthy", "rating.tags.trustworthy"],
  ["quickReply", "rating.tags.quickReply"],
  ["fairPrice", "rating.tags.fairPrice"],
  ["asDescribed", "rating.tags.asDescribed"],
]

export default function ReviewModal({ open, onClose, sellerId, listingId }) {
  const { t } = useTranslation()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [tags, setTags] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const submitReview = useStorefrontStore((state) => state.submitReview)

  useEffect(() => {
    if (!open) return undefined
    const frame = window.requestAnimationFrame(() => setSubmitted(false))
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  function toggleTag(tag) {
    setTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await submitReview(sellerId, {
        stars: rating,
        comment,
        tags,
        listingId,
      })
      toast.success(t("review.success"))
      setSubmitted(true)
    } catch (error) {
      toast.error(error.response?.data?.message || t("review.error"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t("review.title")} size="sm">
      {submitted ? (
        <div className="grid gap-4 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <Star className="h-8 w-8 fill-primary" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold text-neutral-600">{t("review.success")}</p>
          <Button onClick={onClose}>{t("ui.close")}</Button>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-neutral-700 mb-2">
            {t("review.rating")}
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="grid min-h-11 min-w-11 place-items-center rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= rating ? "fill-amber-400 text-amber-400" : "text-neutral-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-neutral-700 mb-2">
            {t("review.comment")}
          </label>
          <textarea
            className="w-full min-h-[100px] rounded-xl border border-neutral-200 p-3 outline-none focus:border-primary"
            placeholder={t("review.commentPlaceholder")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-bold text-neutral-700">{t("review.tags")}</p>
          <div className="flex flex-wrap gap-2">
            {reviewTags.map(([value, label]) => (
              <button
                className={cn(
                  "min-h-11 rounded-full border px-3 text-xs font-black transition",
                  tags.includes(value) ? "border-primary bg-primary text-white" : "border-neutral-200 bg-white text-neutral-700",
                )}
                key={value}
                onClick={() => toggleTag(value)}
                type="button"
              >
                {t(label)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} type="button">
            {t("ui.cancel")}
          </Button>
          <Button type="submit" loading={submitting}>
            {t("review.submit")}
          </Button>
        </div>
      </form>
      )}
    </Modal>
  )
}
