import { useState, useEffect } from "react"
import { QrCode, X, Send, Phone, Mail, Loader2, CheckCircle2 } from "lucide-react"
import toast from "react-hot-toast"
import { useTranslation } from "../../hooks/useTranslation"
import { getPromotionState, PROMOTION_LABELS, PROMOTION_STATES } from "../../lib/promotionStates"
import client, { hasApiBackend } from "../../api/client"
import Button from "../ui/Button"
import Overlay from "../ui/Overlay"

// TODO: Replace with real ABA PayWay API integration
// ABA PayWay docs: https://payway.ababank.com
// Required: ABA merchant account + API credentials
// Contact: ABA Bank Cambodia business team

function resolvePromotionState({ listing, promotionState }) {
  if (promotionState) return getPromotionState({ promotion: promotionState })
  if (listing) return getPromotionState(listing)
  return PROMOTION_STATES.BOOST
}

const QRPlaceholder = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full p-2">
    <rect width="100" height="100" fill="transparent" />
    {Array.from({ length: 64 }).map((_, i) => {
      const x = (i % 8) * 12.5
      const y = Math.floor(i / 8) * 12.5
      // Corner squares like real QR
      const isCorner = (x < 25 && y < 25) || (x > 62.5 && y < 25) || (x < 25 && y > 62.5)
      const fill = isCorner ? "#005e91" : (i * 13) % 10 > 4 ? "#1e293b" : "transparent"
      return <rect key={i} x={x + 2} y={y + 2} width="8.5" height="8.5" rx="1.5" fill={fill} />
    })}
  </svg>
)

export default function ABAPayModal({ open, onClose, onDone, listing, promotionState, amount, currency }) {
  const { t, language } = useTranslation()
  const [paymentData, setPaymentData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const state = resolvePromotionState({ listing, promotionState })
  const label = PROMOTION_LABELS[state]?.[language] || PROMOTION_LABELS[PROMOTION_STATES.BOOST][language]

  // Default values if props not provided
  const displayAmount = amount || (state === PROMOTION_STATES.TOP_AD ? 5 : 2)
  const displayCurrency = currency || "USD"

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true)
      setConfirmed(false)
      setConfirming(false)

      const body = {
        listingId: listing?.id,
        plan: state,
        amount: displayAmount,
        currency: displayCurrency,
      }

      if (hasApiBackend()) {
        client
          .post("/api/payments/khqr", body)
          .then((res) => setPaymentData(res.data))
          .catch(() => {
            setPaymentData({
              reference: `BAYONHUB-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
              amount: displayAmount,
              currency: displayCurrency,
            })
          })
          .finally(() => setLoading(false))
      } else {
        setTimeout(() => {
          setPaymentData({
            reference: `BAYONHUB-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
            amount: displayAmount,
            currency: displayCurrency,
          })
          setLoading(false)
        }, 600)
      }
    } else {
      setPaymentData(null)
    }
  }, [open, listing?.id, state, displayAmount, displayCurrency])

  function handleConfirm() {
    setConfirming(true)
    setTimeout(() => {
      setConfirming(false)
      setConfirmed(true)
      toast.success(t("payment.confirmed"))
      onDone?.(paymentData?.reference)
      setTimeout(() => {
        onClose?.()
      }, 5000)
    }, 2000)
  }

  return (
    <Overlay
      ariaLabel={t("payment.khqrTitle")}
      backdropClassName="z-[95] grid place-items-center p-4 overflow-y-auto"
      className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl my-8"
      onClose={onClose}
      open={open}
    >
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-neutral-900">{t("payment.khqrTitle")}</h2>
          {paymentData && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {t("payment.reference")}: {paymentData.reference}
            </p>
          )}
        </div>
        <button
          aria-label={t("ui.close")}
          className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-neutral-500 hover:bg-neutral-50 shrink-0"
          onClick={onClose}
          type="button"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      {confirmed ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="mb-4 rounded-full bg-green-100 p-4 text-green-600">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">{t("ui.success")}</h3>
          <p className="mt-2 text-sm font-medium text-neutral-600">{t("payment.confirmed")}</p>
          <p className="mt-4 text-xs font-bold text-neutral-400">
            {t("payment.reference")}: {paymentData?.reference}
          </p>
        </div>
      ) : (
        <>
          <p className="mt-3 text-sm font-semibold leading-6 text-neutral-500">{t("khqr.subtitle")}</p>

          <div className="mt-5 flex flex-col items-center gap-3">
            <div className="relative grid h-56 w-56 place-items-center rounded-2xl border-2 border-neutral-100 bg-neutral-50 shadow-inner overflow-hidden">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <>
                  <QRPlaceholder />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                    <QrCode className="h-32 w-32" />
                  </div>
                </>
              )}
            </div>

            <div className="text-center">
              <p className="text-2xl font-black text-neutral-900">
                {displayCurrency === "USD" ? "$" : ""}
                {displayAmount.toLocaleString()}
                {displayCurrency === "KHR" ? "៛" : ""}
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">{label}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                {t("payment.manualTransfer")}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">{t("payment.bankAccount")}</span>
                  <span className="font-bold text-neutral-900">000 123 456</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">{t("payment.accountName")}</span>
                  <span className="font-bold text-neutral-900">BayonHub Co., Ltd</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Bank</span>
                  <span className="font-bold text-neutral-900">ABA Bank</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                {t("payment.contactSupport")}
              </p>
              <div className="flex gap-2">
                <a
                  href="https://t.me/bayonhubsupport"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-neutral-200 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <Send className="h-3.5 w-3.5 text-[#0088cc]" />
                  Telegram
                </a>
                <a
                  href="https://wa.me/85512345678"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-neutral-200 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-[#25D366]" />
                  WhatsApp
                </a>
              </div>
              <a
                href="mailto:support@bayonhub.com"
                className="flex items-center justify-center gap-2 rounded-lg border border-neutral-200 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <Mail className="h-3.5 w-3.5 text-neutral-400" />
                support@bayonhub.com
              </a>
            </div>
          </div>

          <Button
            className="mt-6 w-full py-4 text-base"
            disabled={loading || confirming}
            loading={confirming}
            onClick={handleConfirm}
          >
            {t("khqr.done")}
          </Button>
        </>
      )}
    </Overlay>
  )
}

