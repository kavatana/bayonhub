import { useEffect, useMemo, useRef, useState } from "react"
import { Helmet } from "react-helmet-async"
import toast from "react-hot-toast"
import { BadgeCheck, Check, CreditCard, X } from "lucide-react"
import client, { hasApiBackend } from "../api/client"
import Button from "../components/ui/Button"
import PageTransition from "../components/ui/PageTransition"
import { useTranslation } from "../hooks/useTranslation"
import { selectIsPlusMember, useAuthStore } from "../store/useAuthStore"

const PLUS_PLAN = "VIP_30"
const PLAN_PRICES = {
  [PLUS_PLAN]: 15,
}
const PAYMENT_HISTORY_KEY = "bayonhub:plusPaymentSubmissions"

function saveLocalPayment(plan) {
  const existing = JSON.parse(localStorage.getItem(PAYMENT_HISTORY_KEY) || "[]")
  const reference = `LOCAL-${Date.now()}`
  const submission = {
    id: crypto.randomUUID(),
    reference,
    plan,
    amount: PLAN_PRICES[plan],
    currency: "USD",
    status: "PENDING",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  }
  localStorage.setItem(PAYMENT_HISTORY_KEY, JSON.stringify([submission, ...existing].slice(0, 20)))
  return submission
}

export default function UpgradePage() {
  const { t, language } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const isPlusMember = useAuthStore(selectIsPlusMember)
  const loadProfile = useAuthStore((state) => state.loadProfile)
  const [paymentRef, setPaymentRef] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState("idle")
  const [polling, setPolling] = useState(false)
  const [qrImageFailed, setQrImageFailed] = useState(false)
  const pollingRef = useRef(null)
  const expiryRef = useRef(null)
  const paymentStatusRef = useRef("idle")
  const pageClass = language === "km" ? "font-khmer leading-8" : ""
  const isGenerating = paymentStatus === "generating"
  const isPending = paymentStatus === "pending"

  function updatePaymentStatus(status) {
    paymentStatusRef.current = status
    setPaymentStatus(status)
  }

  function clearPolling() {
    if (pollingRef.current) window.clearInterval(pollingRef.current)
    if (expiryRef.current) window.clearTimeout(expiryRef.current)
    pollingRef.current = null
    expiryRef.current = null
    setPolling(false)
  }

  function startPolling(reference) {
    clearPolling()
    setPolling(true)
    pollingRef.current = window.setInterval(async () => {
      if (paymentStatusRef.current !== "pending") return
      try {
        const response = await client.get(`/api/payments/status/${reference}`)
        if (response.data.status === "PAID") {
          clearPolling()
          updatePaymentStatus("success")
          toast.success(t("payment.success"))
          await loadProfile()
        } else if (response.data.status === "EXPIRED") {
          clearPolling()
          updatePaymentStatus("expired")
          toast.error(t("payment.expired"))
        }
      } catch {
        // Keep polling until the timeout expires.
      }
    }, 5000)
    expiryRef.current = window.setTimeout(() => {
      if (paymentStatusRef.current !== "pending") return
      clearPolling()
      updatePaymentStatus("expired")
      toast.error(t("payment.expired"))
    }, 15 * 60 * 1000)
  }

  async function handleUpgrade(plan) {
    updatePaymentStatus("generating")
    setQrImageFailed(false)
    try {
      if (!hasApiBackend()) {
        const localPayment = saveLocalPayment(plan)
        setPaymentRef(localPayment)
        updatePaymentStatus("pending")
        return
      }

      const response = await client.post("/api/payments/khqr/generate", {
        plan,
        amount: PLAN_PRICES[plan],
        currency: "USD",
      })
      setPaymentRef(response.data)
      updatePaymentStatus("pending")
      startPolling(response.data.reference)
    } catch {
      toast.error(t("payment.generateFailed"))
      updatePaymentStatus("idle")
    }
  }

  useEffect(() => clearPolling, [])

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
            <Button disabled={isPlusMember || isGenerating || isPending} loading={isGenerating} onClick={() => handleUpgrade(PLUS_PLAN)} size="lg">
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
            {paymentRef ? (
              <>
                <img
                  alt={t("payment.qrAlt")}
                  className={`${qrImageFailed ? "hidden" : "mx-auto aspect-square w-full max-w-56 rounded-xl object-cover"}`}
                  loading="lazy"
                  onError={() => setQrImageFailed(true)}
                  src={paymentRef.qrImageUrl || "/assets/aba-qr.png"}
                />
                <div className={`${qrImageFailed ? "flex" : "hidden"} mx-auto h-56 w-56 items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 p-4 text-center text-xs font-bold text-neutral-400`}>
                  {t("payment.qrLoadFailed")}
                </div>
              </>
            ) : (
              <div className="grid h-56 place-items-center text-center text-neutral-500">
                <div>
                  <CreditCard className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
                  <p className="mt-3 text-sm font-black">{t("plus.upgradeCta")}</p>
                </div>
              </div>
            )}
          </div>
          {paymentRef ? (
            <p className="mt-3 rounded-xl bg-neutral-50 p-3 text-xs font-black text-neutral-600">
              {t("payment.reference")}: {paymentRef.reference}
            </p>
          ) : null}
          <Button className="mt-5 w-full" disabled={isPlusMember || isGenerating || isPending} loading={isGenerating || polling} onClick={() => handleUpgrade(PLUS_PLAN)} size="lg">
            {isPlusMember ? t("plus.active") : isPending ? t("payment.underReview") : t("plus.upgradeCta")}
          </Button>
          {isPending ? (
            <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm font-bold leading-7 text-neutral-700">
              <p className="text-primary">{t("payment.reviewMessage")}</p>
              <p className="mt-1">{t("payment.reviewNextSteps")}</p>
            </div>
          ) : null}
          {paymentStatus === "success" ? <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{t("payment.success")}</p> : null}
          {paymentStatus === "expired" ? <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{t("payment.expired")}</p> : null}
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

    </PageTransition>
  )
}
