import { useState } from "react"
import { Star } from "lucide-react"
import Modal from "../ui/Modal"
import Button from "../ui/Button"
import { useTranslation } from "../../hooks/useTranslation"
import toast from "react-hot-toast"
import { useStorefrontStore } from "../../store/useStorefrontStore"

export default function ReviewModal({ open, onClose, sellerId, listingId }) {
  const { t } = useTranslation()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const postReview = useStorefrontStore((state) => state.postReview)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await postReview({
        rating,
        comment,
        sellerId,
        listingId
      })
      toast.success(t("review.success"))
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.message || t("review.error"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t("review.title")} size="sm">
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
                className="focus:outline-none"
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
            placeholder={t("review.placeholder")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
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
    </Modal>
  )
}
