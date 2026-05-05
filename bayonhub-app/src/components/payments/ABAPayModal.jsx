import { useEffect, useState } from "react"
import { CheckCircle2, Clipboard, Loader2, QrCode, X } from "lucide-react"
import toast from "react-hot-toast"

import client, { hasApiBackend, IS_PRODUCTION } from "../../api/client"
import { useTranslation } from "../../hooks/useTranslation"
import { getPromotionState, PROMOTION_LABELS, PROMOTION_STATES } from "../../lib/promotionStates"
import Button from "../ui/Button"
import Overlay from "../ui/Overlay"

const PLANS = {
  BOOST: { price: 2 },
  TOP_AD: { price: 5 },
  VIP_30: { price: 15 },
}

function resolvePromotionState({ listing, promotionState }) {
  if (promotionState) return getPromotionState({ promotion: promotionState })
  if (listing) return getPromotionState(listing)
  return PROMOTION_STATES.BOOST
}

function normalizePlan(state) {
  if (state === PROMOTION_STATES.TOP_AD) return "TOP_AD"
  if (state === "VIP_30") return "VIP_30"
  return "BOOST"
}

function createLocalPayment(plan) {
  const reference = `BAYON-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`
  return {
    reference,
    amount: PLANS[plan].price,
    currency: "USD",
    qrPayload: `MOCK_KHQR|merchant=BayonHub|reference=${reference}|amount=${PLANS[plan].price.toFixed(2)}|currency=USD`,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    status: "PENDING",
  }
}

function getPlanLabel(t, plan, fallbackLabel) {
  if (plan === "TOP_AD") return t("payment.planTopAd")
  if (plan === "VIP_30") return t("payment.planVip")
  return t("payment.planBoost") || fallbackLabel
}

function getPlanDuration(t, plan) {
  if (plan === "VIP_30") return t("payment.duration30")
  return t("payment.duration7")
}

export default function ABAPayModal({ open, onClose, onDone, listing, promotionState, amount, currency }) {
  const { t, language } = useTranslation()
  const [paymentData, setPaymentData] = useState(null)
  const [status, setStatus] = useState("idle")
  const [error, setError] = useState("")

  const state = resolvePromotionState({ listing, promotionState })
  const plan = normalizePlan(state)
  const planConfig = PLANS[plan]
  const fallbackLabel = PROMOTION_LABELS[state]?.[language] || PROMOTION_LABELS[PROMOTION_STATES.BOOST][language]
  const planLabel = getPlanLabel(t, plan, fallbackLabel)
  const displayAmount = amount || planConfig.price
  const displayCurrency = currency || "USD"

  useEffect(() => {
    if (!open) {
      const frame = window.requestAnimationFrame(() => {
        setPaymentData(null)
        setStatus("idle")
        setError("")
      })
      return () => window.cancelAnimationFrame(frame)
    }

    let cancelled = false

    async function generatePayment() {
      setStatus("generating")
      setError("")
      try {
        if (!hasApiBackend()) {
          const localPayment = createLocalPayment(plan)
          if (!cancelled) {
            setPaymentData(localPayment)
            setStatus("waiting")
          }
          return
        }
        const response = await client.post("/api/payments/khqr/generate", {
          listingId: listing?.id,
          plan,
        })
        if (!cancelled) {
          setPaymentData(response.data)
          setStatus("waiting")
        }
      } catch {
        if (!cancelled) {
          setError(t("payment.pollError"))
          setStatus("error")
        }
      }
    }

    generatePayment()
    return () => {
      cancelled = true
    }
  }, [listing?.id, open, plan, t])

  useEffect(() => {
    if (!open || !paymentData?.reference || status !== "waiting" || !hasApiBackend()) return undefined

    const poll = window.setInterval(async () => {
      try {
        const response = await client.get(`/api/payments/status/${paymentData.reference}`)
        if (response.data.status === "PAID") {
          window.clearInterval(poll)
          setStatus("paid")
          toast.success(t("payment.confirmed"))
          onDone?.(paymentData.reference)
          window.setTimeout(() => onClose?.(), 800)
          return
        }
        if (response.data.status === "EXPIRED" || new Date(response.data.expiresAt).getTime() <= Date.now()) {
          window.clearInterval(poll)
          setStatus("expired")
        }
      } catch {
        window.clearInterval(poll)
        setError(t("payment.pollError"))
        setStatus("error")
      }
    }, 5000)

    return () => window.clearInterval(poll)
  }, [onClose, onDone, open, paymentData?.reference, status, t])

  useEffect(() => {
    if (!open || !paymentData?.expiresAt || status !== "waiting") return undefined
    const delay = Math.max(new Date(paymentData.expiresAt).getTime() - Date.now(), 0)
    const timer = window.setTimeout(() => setStatus("expired"), delay)
    return () => window.clearTimeout(timer)
  }, [open, paymentData?.expiresAt, status])

  function handleClose() {
    setStatus("idle")
    onClose?.()
  }

  function retryPayment() {
    setPaymentData(null)
    setStatus("generating")
    setError("")
    // Re-trigger the generatePayment effect by briefly resetting to idle then back
    // We use a local re-mount trick: toggle open off/on isn't available here,
    // so we directly call generate inline
    async function regen() {
      try {
        if (!hasApiBackend()) {
          const localPayment = createLocalPayment(plan)
          setPaymentData(localPayment)
          setStatus("waiting")
          return
        }
        const response = await client.post("/api/payments/khqr/generate", {
          listingId: listing?.id,
          plan,
        })
        setPaymentData(response.data)
        setStatus("waiting")
      } catch {
        setError(t("payment.pollError"))
        setStatus("error")
      }
    }
    regen()
  }

  async function copyPayload() {
    if (!paymentData?.qrPayload) return
    await navigator.clipboard?.writeText(paymentData.qrPayload)
    toast.success(t("ui.copied"))
  }

  function confirmLocalPayment() {
    setStatus("paid")
    toast.success(t("payment.confirmed"))
    onDone?.(paymentData?.reference)
    window.setTimeout(() => onClose?.(), 800)
  }

  return (
    <Overlay
      ariaLabel={t("payment.khqrTitle")}
      backdropClassName="z-[95] grid place-items-center p-4 overflow-y-auto"
      className="my-8 w-full max-w-sm md:max-w-xl rounded-2xl bg-white p-0 shadow-2xl md:flex md:flex-row overflow-hidden"
      onClose={handleClose}
      open={open}
    >
      {/* Decorative Strip (Desktop Only) */}
      <div className="hidden md:block w-1/4 bg-bayon-sketch bg-bayon-sketch-8 rounded-l-2xl overflow-hidden" aria-hidden="true" />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-neutral-900">{t("payment.khqrTitle")}</h2>
            {paymentData ? (
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                {t("payment.reference")}: {paymentData.reference}
              </p>
            ) : null}
          </div>
          <button
            aria-label={t("ui.close")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
            onClick={handleClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        {status === "paid" ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-4 rounded-full bg-green-100 p-4 text-green-600">
              <CheckCircle2 aria-hidden="true" className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">{t("ui.success")}</h3>
            <p className="mt-2 text-sm font-medium text-neutral-600">{t("payment.confirmed")}</p>
          </div>
        ) : status === "error" ? (
          <div className="flex flex-col items-center gap-5 py-10 text-center">
            <div className="rounded-3xl border border-red-100 bg-red-50 px-8 py-6 text-red-700">
              <h3 className="text-base font-black">{t("ui.error")}</h3>
              <p className="mt-1 text-sm font-bold">{error}</p>
            </div>
            <Button onClick={retryPayment} type="button">{t("ui.retry")}</Button>
            <Button onClick={handleClose} type="button" variant="secondary">{t("ui.cancel")}</Button>
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm font-semibold leading-6 text-neutral-500">{t("payment.scanQR")}</p>

            <div className="mt-5 flex flex-col items-center gap-3">
              <div className="grid h-56 w-56 place-items-center overflow-hidden rounded-2xl border-2 border-neutral-100 bg-neutral-50 p-4 shadow-inner">
                {status === "generating" ? (
                  <div className="grid gap-3 text-center text-sm font-bold text-neutral-500">
                    <Loader2 aria-hidden="true" className="mx-auto h-8 w-8 animate-spin text-primary" />
                    {t("payment.generating")}
                  </div>
                ) : (
                  <div className="grid w-full gap-3 text-center">
                    <QrCode aria-hidden="true" className="mx-auto h-12 w-12 text-primary" />
                    <p className="break-all rounded-xl bg-white p-3 font-mono text-xs leading-5 text-neutral-700">
                      {paymentData?.qrPayload || t("payment.generating")}
                    </p>
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-2xl font-black text-neutral-900">
                  {displayCurrency === "USD" ? "$" : ""}
                  {displayAmount.toLocaleString()}
                  {displayCurrency === "KHR" ? "៛" : ""}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  {planLabel} · {getPlanDuration(t, plan)}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                {status === "expired" ? t("payment.expired") : t("payment.waitingPayment")}
              </p>
              {error ? <p className="mt-2 text-sm font-bold text-red-600">{error}</p> : null}
            </div>

            <div className="mt-6 grid gap-3">
              <Button disabled={!paymentData?.qrPayload} onClick={copyPayload} type="button" variant="secondary">
                <Clipboard aria-hidden="true" className="h-4 w-4" />
                {t("ui.copy")}
              </Button>
              {!hasApiBackend() && !IS_PRODUCTION ? (
                <Button disabled={!paymentData || status === "expired"} onClick={confirmLocalPayment} type="button">
                  {t("khqr.done")}
                </Button>
              ) : null}
              <Button onClick={handleClose} type="button" variant="secondary">
                {t("ui.cancel")}
              </Button>
            </div>
          </>
        )}
      </div>
    </Overlay>
  )
}
