import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Send } from "lucide-react"
import toast from "react-hot-toast"
import { useTranslation } from "../../hooks/useTranslation"
import { getListingImage } from "../../lib/utils"
import { useMessageStore } from "../../store/useMessageStore"
import Button from "../ui/Button"
import Modal from "../ui/Modal"

export default function MessageModal({ listing, open, onClose }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const startConversation = useMessageStore((state) => state.startConversation)
  const sendMessage = useMessageStore((state) => state.sendMessage)
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  const sellerId = listing?.sellerId || listing?.seller?.id
  const image = getListingImage(listing)

  async function handleSend(event) {
    event.preventDefault()
    if (!body.trim() || !sellerId) return
    setSending(true)
    setError(null)
    try {
      const conversation = await startConversation(listing.id, sellerId)
      await sendMessage(conversation.id, body.trim())
      toast.success(t("messaging.messageSent"))
      setBody("")
      onClose()
      navigate("/inbox")
    } catch (err) {
      setError(err.message || t("ui.error"))
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t("messaging.sendMessage")} size="sm">
      <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3">
        {image ? (
          <img
            alt={listing?.title}
            className="h-12 w-12 rounded-lg object-cover"
            loading="lazy"
            src={image}
          />
        ) : (
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-neutral-200 text-xs font-black text-neutral-400">
            BH
          </span>
        )}
        <span className="min-w-0 truncate text-sm font-bold text-neutral-900">
          {listing?.title}
        </span>
      </div>
      <form className="mt-4 grid gap-3" onSubmit={handleSend}>
        <textarea
          className="min-h-28 w-full rounded-xl border border-neutral-200 p-3 text-sm outline-none transition focus:border-primary dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
          maxLength={2000}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t("messaging.writeMessage")}
          value={body}
        />
        {error ? (
          <p className="text-sm font-semibold text-red-600">{error}</p>
        ) : null}
        <Button
          disabled={!body.trim() || sending}
          loading={sending}
          type="submit"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          {t("messaging.sendMessage")}
        </Button>
      </form>
    </Modal>
  )
}
