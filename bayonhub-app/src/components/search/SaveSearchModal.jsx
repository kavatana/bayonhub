import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import Modal from "../ui/Modal"
import Button from "../ui/Button"
import { useTranslation } from "../../hooks/useTranslation"
import { useListingStore } from "../../store/useListingStore"

export default function SaveSearchModal({ open, onClose, defaultName, filters }) {
  const { t } = useTranslation()
  const saveSearch = useListingStore((state) => state.saveSearch)
  const [name, setName] = useState(defaultName || "")
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifySMS, setNotifySMS] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const frame = window.requestAnimationFrame(() => setName(defaultName || ""))
    return () => window.cancelAnimationFrame(frame)
  }, [defaultName, open])

  function handleSubmit(event) {
    event.preventDefault()
    const trimmedName = name.trim() || defaultName || t("search.savedSearches")
    saveSearch({
      name: trimmedName,
      filters,
      notifyEmail,
      notifySMS,
    })
    toast.success(t("search.saved"))
    onClose()
  }

  return (
    <Modal onClose={onClose} open={open} size="sm" title={t("search.saveSearch")}>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-black text-neutral-700">
          {t("search.name")}
          <input
            className="min-h-11 rounded-xl border border-neutral-200 px-3 text-sm font-bold outline-none focus:border-primary"
            onChange={(event) => setName(event.target.value)}
            type="text"
            value={name}
          />
        </label>

        <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3 text-sm font-bold text-neutral-700">
          <span>{t("search.notifyEmail")}</span>
          <input checked={notifyEmail} className="accent-primary" onChange={(event) => setNotifyEmail(event.target.checked)} type="checkbox" />
        </label>

        <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3 text-sm font-bold text-neutral-700">
          <span>{t("search.notifySMS")}</span>
          <input checked={notifySMS} className="accent-primary" onChange={(event) => setNotifySMS(event.target.checked)} type="checkbox" />
        </label>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose} type="button" variant="secondary">
            {t("ui.cancel")}
          </Button>
          <Button type="submit">{t("ui.save")}</Button>
        </div>
      </form>
    </Modal>
  )
}
