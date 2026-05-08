import { useMemo, useState } from "react"
import { Helmet } from "react-helmet-async"
import { BadgeCheck, Check, CreditCard, ImagePlus, Upload, X } from "lucide-react"
import Button from "../components/ui/Button"
import Modal from "../components/ui/Modal"
import PageTransition from "../components/ui/PageTransition"
import { useTranslation } from "../hooks/useTranslation"
import { useAuthStore } from "../store/useAuthStore"

const MAX_RECEIPT_SIZE = 5 * 1024 * 1024
const PAYMENT_HISTORY_KEY = "bayonhub:plusPaymentSubmissions"

function plusActive(user) {
  return Boolean(user?.plusUntil && new Date(user.plusUntil) > new Date())
}

function saveLocalSubmission(file, note) {
  const existing = JSON.parse(localStorage.getItem(PAYMENT_HISTORY_KEY) || "[]")
  const submission = {
    id: crypto.randomUUID(),
    screenshotName: file.name,
    note: note.trim(),
    status: "PENDING",
    createdAt: new Date().toISOString(),
  }
  localStorage.setItem(PAYMENT_HISTORY_KEY, JSON.stringify([submission, ...existing].slice(0, 20)))
  return { message: "payment.underReview", submission }
}

async function submitPaymentReceipt({ file, note }) {
  const { default: imageCompression } = await import("browser-image-compression")
  const { default: client, hasApiBackend } = await import("../api/client")
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
  })

  if (hasApiBackend()) {
    const formData = new FormData()
    formData.append("screenshot", compressed)
    if (note.trim()) formData.append("note", note.trim())
    try {
      const response = await client.post("/api/payments/submit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return response.data
    } catch (error) {
      if (!error?.response || error.response.status === 404) return saveLocalSubmission(compressed, note)
      throw error
    }
  }

  return saveLocalSubmission(compressed, note)
}

function PaymentSubmitModal({ open, onClose, onSubmitted }) {
  const { t } = useTranslation()
  const [receipt, setReceipt] = useState(null)
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function selectReceipt(file) {
    setSubmitted(false)
    if (!file) {
      setReceipt(null)
      return
    }
    if (!file.type.startsWith("image/")) {
      setError(t("payment.imageOnly"))
      setReceipt(null)
      return
    }
    if (file.size > MAX_RECEIPT_SIZE) {
      setError(t("payment.fileTooLarge"))
      setReceipt(null)
      return
    }
    setError("")
    setReceipt(file)
  }

  async function submitReceipt(event) {
    event.preventDefault()
    if (!receipt) {
      setError(t("payment.fileRequired"))
      return
    }
    setSubmitting(true)
    setError("")
    try {
      await submitPaymentReceipt({ file: receipt, note })
      setSubmitted(true)
      onSubmitted()
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t("payment.submitError"))
    } finally {
      setSubmitting(false)
    }
  }

  function closeModal() {
    setReceipt(null)
    setNote("")
    setError("")
    setSubmitting(false)
    setSubmitted(false)
    onClose()
  }

  return (
    <Modal onClose={closeModal} open={open} size="md" title={t("payment.submit")}>
      {submitted ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-800">
          <BadgeCheck className="h-8 w-8" aria-hidden="true" />
          <h3 className="mt-3 text-lg font-black">{t("payment.underReview")}</h3>
          <p className="mt-2 text-sm font-bold leading-7">{t("payment.reviewMessage")}</p>
          <Button className="mt-5" onClick={closeModal} type="button">
            {t("ui.close")}
          </Button>
        </div>
      ) : (
        <form className="grid gap-4" onSubmit={submitReceipt}>
          <label className="grid gap-2 text-sm font-bold text-neutral-700">
            {t("payment.uploadReceipt")}
            <span className="grid min-h-40 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center transition hover:border-primary hover:bg-primary/5">
              <input
                accept="image/*"
                className="sr-only"
                onChange={(event) => selectReceipt(event.target.files?.[0] || null)}
                type="file"
              />
              <ImagePlus className="h-9 w-9 text-primary" aria-hidden="true" />
              <span className="mt-3 block text-sm font-black text-neutral-900">
                {receipt?.name || t("payment.fileHelp")}
              </span>
            </span>
          </label>
          <label className="grid gap-2 text-sm font-bold text-neutral-700">
            {t("payment.note")}
            <textarea
              className="min-h-24 rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:border-primary"
              onChange={(event) => setNote(event.target.value)}
              placeholder={t("payment.notePlaceholder")}
              value={note}
            />
          </label>
          {error ? <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}
          <Button disabled={submitting} loading={submitting} type="submit">
            <Upload className="h-4 w-4" aria-hidden="true" />
            {t("payment.submit")}
          </Button>
        </form>
      )}
    </Modal>
  )
}

export default function UpgradePage() {
  const { t, language } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const isPlusMember = plusActive(user)
  const pageClass = language === "km" ? "font-khmer leading-8" : ""

  const comparisonRows = useMemo(
    () => [
      ["plus.featureListingsPerDay", "plus.freeListingsValue", "plus.unlimited"],
      ["plus.featurePhotosPerListing", "plus.freePhotosValue", "plus.plusPhotosValue"],
      ["plus.featureListingDuration", "plus.freeDurationValue", "plus.plusDurationValue"],
      ["plus.featureSearchRanking", "plus.standardRanking", "plus.priorityRanking"],
      ["plus.featureBumpToTop", "no", "plus.oneBumpDaily"],
      ["plus.featureHomepage", "no", "plus.rotatingSlot"],
      ["plus.featureBadge", "no", "yes"],
      ["plus.featureAnalytics", "plus.basicAnalytics", "plus.fullAnalytics"],
      ["plus.featureStorefront", "no", "yes"],
      ["plus.featureContactLinks", "no", "yes"],
    ],
    [],
  )

  function renderValue(valueKey) {
    if (valueKey === "yes") {
      return (
        <span className="inline-flex items-center justify-center text-emerald-600" aria-label={t("ui.yes")}>
          <Check className="h-5 w-5" aria-hidden="true" />
        </span>
      )
    }
    if (valueKey === "no") {
      return (
        <span className="inline-flex items-center justify-center text-neutral-400" aria-label={t("ui.no")}>
          <X className="h-5 w-5" aria-hidden="true" />
        </span>
      )
    }
    return t(valueKey)
  }

  return (
    <PageTransition className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 ${pageClass}`}>
      <Helmet>
        <title>{t("plus.upgradeTitle")} | {t("app.name")}</title>
      </Helmet>

      <section className="grid gap-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_340px] lg:p-8">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-primary">{t("plus.monthlyPrice")}</p>
          <h1 className="mt-2 text-3xl font-black text-neutral-950 sm:text-5xl">{t("plus.upgradeTitle")}</h1>
          <p className="mt-4 max-w-2xl text-base font-bold text-neutral-600 sm:text-lg">{t("plus.tagline")}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button disabled={isPlusMember} onClick={() => setModalOpen(true)} size="lg">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
              {isPlusMember ? t("plus.active") : t("plus.upgradeCta")}
            </Button>
            <Button onClick={() => document.getElementById("plus-payment")?.scrollIntoView({ behavior: "smooth" })} size="lg" variant="secondary">
              {t("payment.instructions")}
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <BadgeCheck className="h-8 w-8 text-primary" aria-hidden="true" />
          <h2 className="mt-3 text-xl font-black text-neutral-950">{t("plus.featuredSection")}</h2>
          <p className="mt-2 text-sm font-bold leading-7 text-neutral-600">{t("plus.valueSummary")}</p>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black text-neutral-950">{t("plus.featureComparison")}</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr>
                <th className="border-b border-neutral-200 px-4 py-3 font-black text-neutral-500">{t("plus.feature")}</th>
                <th className="border-b border-neutral-200 px-4 py-3 font-black text-neutral-500">{t("plus.freeTier")}</th>
                <th className="border-b border-neutral-200 px-4 py-3 font-black text-primary">{t("badge.plus")}</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([feature, free, plus]) => (
                <tr key={feature}>
                  <td className="border-b border-neutral-100 px-4 py-4 font-black text-neutral-900">{t(feature)}</td>
                  <td className="border-b border-neutral-100 px-4 py-4 font-bold text-neutral-600">{renderValue(free)}</td>
                  <td className="border-b border-neutral-100 px-4 py-4 font-black text-neutral-900">{renderValue(plus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="plus-payment" className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black text-neutral-950">{t("payment.instructions")}</h2>
          <p className="mt-2 text-sm font-bold leading-7 text-neutral-600">{t("payment.referenceHelp")}</p>
          <div className="mt-5 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <img alt={t("payment.abaQrAlt")} className="mx-auto aspect-square w-full max-w-56 rounded-xl object-cover" src="/assets/aba-qr.png" />
          </div>
          <Button className="mt-5 w-full" disabled={isPlusMember} onClick={() => setModalOpen(true)} size="lg">
            {isPlusMember ? t("plus.active") : t("payment.openModal")}
          </Button>
          {submitted ? <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{t("payment.reviewMessage")}</p> : null}
        </div>

        <div className="grid gap-4">
          {[
            ["payment.aba", "payment.abaAccountValue"],
            ["payment.acleda", "payment.acledaAccountValue"],
            ["payment.wing", "payment.wingAccountValue"],
          ].map(([name, account]) => (
            <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm" key={name}>
              <p className="text-sm font-black uppercase tracking-widest text-primary">{t(name)}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-neutral-500">{t("payment.accountNumber")}</p>
                  <p className="mt-1 font-black text-neutral-950">{t(account)}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-neutral-500">{t("payment.amount")}</p>
                  <p className="mt-1 font-black text-neutral-950">{t("plus.monthlyPrice")}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-neutral-500">{t("payment.reference")}</p>
                  <p className="mt-1 font-black text-neutral-950">{user?.phone || user?.email || t("account.phone")}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <PaymentSubmitModal
        onClose={() => setModalOpen(false)}
        onSubmitted={() => setSubmitted(true)}
        open={modalOpen}
      />
    </PageTransition>
  )
}
