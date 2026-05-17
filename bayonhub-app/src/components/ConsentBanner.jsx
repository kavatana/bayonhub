import { useState } from "react"
import Button from "./ui/Button"
import Modal from "./ui/Modal"
import { useTranslation } from "../hooks/useTranslation"

const CONSENT_KEY = "bayonhub:privacy-consent"

export default function ConsentBanner() {
  const { t, language } = useTranslation()
  const [visible, setVisible] = useState(() => localStorage.getItem(CONSENT_KEY) !== "true")
  const [manageOpen, setManageOpen] = useState(false)

  function acceptConsent() {
    localStorage.setItem(CONSENT_KEY, "true")
    setVisible(false)
    setManageOpen(false)
  }

  if (!visible) return null

  return (
    <>
      <section
        aria-live="polite"
        className={`fixed inset-x-4 bottom-4 z-[9998] mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl ${language === "km" ? "font-khmer leading-8" : ""}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-neutral-700">{t("consent.message")}</p>
          <div className="flex shrink-0 gap-2">
            <Button onClick={() => setManageOpen(true)} size="sm" variant="secondary">
              {t("consent.manage")}
            </Button>
            <Button onClick={acceptConsent} size="sm">
              {t("consent.accept")}
            </Button>
          </div>
        </div>
      </section>
      <Modal open={manageOpen} onClose={() => setManageOpen(false)} title={t("consent.modal.title")}>
        <div className={`grid gap-4 text-sm font-semibold text-neutral-700 ${language === "km" ? "font-khmer leading-8" : ""}`}>
          <p>{t("consent.modal.required")}</p>
          <p>{t("consent.modal.localStorage")}</p>
          <div className="flex justify-end">
            <Button onClick={acceptConsent}>{t("consent.accept")}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
