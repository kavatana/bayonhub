import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import client from "../../api/client"
import { useTranslation } from "../../hooks/useTranslation"
import Button from "../ui/Button"
import Modal from "../ui/Modal"

const ADMIN_2FA_EVENT = "bayonhub:admin-2fa-required"

export default function Admin2FAModal() {
  const { t } = useTranslation()
  const pendingRequestsRef = useRef([])
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [noPhone, setNoPhone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState(0)

  const sendCode = useCallback(async () => {
    setLoading(true)
    setError("")
    setNoPhone(false)
    try {
      await client.post("/api/auth/admin/2fa/send")
      setSent(true)
      setRemaining(60)
    } catch (sendError) {
      const message = sendError.response?.data?.message || sendError.response?.data?.error
      if (sendError.response?.status === 400 || message === "Verified phone required for admin 2FA") {
        setNoPhone(true)
      } else {
        setError(t("admin2fa.error"))
      }
    } finally {
      setLoading(false)
    }
  }, [t])

  function rejectPending() {
    pendingRequestsRef.current.forEach((request) => request.reject?.(new Error("Admin 2FA cancelled")))
    pendingRequestsRef.current = []
  }

  function closeModal() {
    rejectPending()
    setOpen(false)
  }

  async function verifyCode(event) {
    event.preventDefault()
    if (code.length !== 6 || pendingRequestsRef.current.length === 0) return
    setLoading(true)
    setError("")
    try {
      await client.post("/api/auth/admin/2fa/verify", { code })
      const pendingRequests = [...pendingRequestsRef.current]
      pendingRequestsRef.current = []
      setOpen(false)
      await Promise.all(pendingRequests.map(async ({ originalRequest, resolve, reject }) => {
        try {
          resolve(await client(originalRequest))
        } catch (retryError) {
          reject(retryError)
        }
      }))
    } catch {
      setError(t("admin2fa.error"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    function openForRequests(requests) {
      if (!requests.length) return
      const shouldSendCode = pendingRequestsRef.current.length === 0
      pendingRequestsRef.current = [...pendingRequestsRef.current, ...requests]
      setCode("")
      setError("")
      setNoPhone(false)
      setOpen(true)
      if (shouldSendCode) {
        setSent(false)
        void sendCode()
      }
    }

    function drainQueuedRequests(event) {
      const queuedRequests = window.__bayonhubAdmin2FAQueue || []
      window.__bayonhubAdmin2FAQueue = []
      openForRequests(queuedRequests.length ? queuedRequests : [event.detail].filter(Boolean))
    }

    window.addEventListener(ADMIN_2FA_EVENT, drainQueuedRequests)
    drainQueuedRequests({})
    return () => window.removeEventListener(ADMIN_2FA_EVENT, drainQueuedRequests)
  }, [sendCode])

  useEffect(() => {
    if (!open || remaining <= 0) return undefined
    const timer = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [open, remaining])

  return (
    <Modal onClose={closeModal} open={open} title={t("admin2fa.title")} size="sm">
      <form className="grid gap-4" onSubmit={verifyCode}>
        {sent ? <p className="text-sm font-bold text-neutral-600">{t("admin2fa.sent")}</p> : null}
        {noPhone ? (
          <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
            {t("admin2fa.noPhone")} <Link className="underline" to="/settings">{t("account.settings")}</Link>
          </p>
        ) : null}
        {error ? <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}
        <label className="grid gap-2 text-sm font-bold text-neutral-700">
          {t("admin2fa.inputLabel")}
          <input
            autoComplete="one-time-code"
            className="h-11 rounded-xl border border-neutral-200 px-3 text-center text-lg font-black tracking-[0.4em] outline-none focus:border-primary"
            inputMode="numeric"
            maxLength={6}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            value={code}
          />
        </label>
        <Button disabled={code.length !== 6 || loading || noPhone} loading={loading} type="submit">
          {t("admin2fa.verify")}
        </Button>
        {remaining > 0 ? (
          <p className="text-center text-sm font-bold text-neutral-500">{t("admin2fa.resendIn", { seconds: remaining })}</p>
        ) : (
          <Button disabled={loading} onClick={sendCode} type="button" variant="secondary">
            {t("admin2fa.resend")}
          </Button>
        )}
      </form>
    </Modal>
  )
}
