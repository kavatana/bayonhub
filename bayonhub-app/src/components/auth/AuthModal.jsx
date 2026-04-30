import { useEffect, useRef, useState } from "react"
import { Eye, EyeOff, X } from "lucide-react"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "../../hooks/useTranslation"
import { validatePhone } from "../../lib/validation"
import { useAuthStore } from "../../store/useAuthStore"
import { useListingStore } from "../../store/useListingStore"
import { useUIStore } from "../../store/useUIStore"
import Button from "../ui/Button"
import Overlay from "../ui/Overlay"

function TelegramIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 fill-current" viewBox="0 0 24 24">
      <path d="M20.7 4.4 17.6 19c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.6 8.4-7.6c.4-.3-.1-.5-.6-.2L6.1 13.1l-4.5-1.4c-1-.3-1-1 0-1.4l17.5-6.8c.8-.3 1.6.2 1.6.9Z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 fill-current" viewBox="0 0 24 24">
      <path d="M14.2 8.2V6.7c0-.7.2-1.2 1.2-1.2h1.5V2.8c-.7-.1-1.4-.1-2.1-.1-2.1 0-3.6 1.3-3.6 3.7v1.8H8.8v3h2.4v7.9h3v-7.9h2.4l.4-3h-2.8Z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path className="fill-blue-600" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" />
      <path className="fill-green-600" d="M12 22c2.7 0 5-.9 6.6-2.5L15.4 17c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
      <path className="fill-yellow-500" d="M6.4 13.8a6 6 0 0 1 0-3.6V7.6H3.1a10 10 0 0 0 0 8.8l3.3-2.6Z" />
      <path className="fill-red-600" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.7 9.7 0 0 0 12 2 10 10 0 0 0 3.1 7.6l3.3 2.6c.8-2.3 3-4.1 5.6-4.1Z" />
    </svg>
  )
}

function AngkorWatSilhouette() {
  return (
    <div className="mt-6 flex justify-center opacity-15">
      <svg aria-hidden="true" className="w-4/5 max-w-xs fill-current text-primary sm:w-full" viewBox="0 0 300 60">
        <rect x="135" y="10" width="30" height="50" />
        <polygon points="150,0 135,10 165,10" />
        <rect x="100" y="20" width="20" height="40" />
        <polygon points="110,12 100,20 120,20" />
        <rect x="180" y="20" width="20" height="40" />
        <polygon points="190,12 180,20 200,20" />
        <rect x="60" y="28" width="18" height="32" />
        <polygon points="69,20 60,28 78,28" />
        <rect x="222" y="28" width="18" height="32" />
        <polygon points="231,20 222,28 240,28" />
        <rect x="40" y="55" width="220" height="5" />
        <rect x="78" y="35" width="22" height="25" />
        <rect x="200" y="35" width="22" height="25" />
      </svg>
    </div>
  )
}

export default function AuthModal() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const open = useUIStore((state) => state.authModalOpen)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const pendingAction = useUIStore((state) => state.pendingAction)
  const setPendingAction = useUIStore((state) => state.setPendingAction)
  const togglePostModal = useUIStore((state) => state.togglePostModal)
  const setLanguage = useUIStore((state) => state.setLanguage)
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)
  const sendOtp = useAuthStore((state) => state.sendOtp)
  const verifyOTP = useAuthStore((state) => state.verifyOTP)
  const loading = useAuthStore((state) => state.loading)
  const toggleSaved = useListingStore((state) => state.toggleSaved)
  const saveSearch = useListingStore((state) => state.saveSearch)
  const [tab, setTab] = useState("login")
  const [showPassword, setShowPassword] = useState(false)
  const [otpStep, setOtpStep] = useState(false)
  // forgotStep: null | "phone" | "otp"
  const [forgotStep, setForgotStep] = useState(null)
  const [timer, setTimer] = useState(60)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
    language: "km",
    terms: false,
  })
  const [resetPhone, setResetPhone] = useState("")
  const [phoneErrors, setPhoneErrors] = useState({})
  const otpRefs = useRef([])
  const resetOtpRefs = useRef([])
  const [resetOtp, setResetOtp] = useState(["", "", "", "", "", ""])

  useEffect(() => {
    if (!otpStep || timer <= 0) return undefined
    const interval = window.setInterval(() => setTimer((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(interval)
  }, [otpStep, timer])

  if (!open) return null

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
    if (name === "phone") setPhoneErrors((current) => ({ ...current, phone: null }))
  }

  function validateAuthPhone(field = "phone") {
    const value = field === "resetPhone" ? resetPhone : form.phone
    const result = validatePhone(value)
    if (!result.valid) {
      setPhoneErrors((current) => ({ ...current, [field]: t(`validation.${result.error}`) }))
      return null
    }
    setPhoneErrors((current) => ({ ...current, [field]: null }))
    if (field === "resetPhone") {
      setResetPhone(result.normalized)
    } else {
      update("phone", result.normalized)
    }
    return result.normalized
  }

  function close() {
    toggleAuthModal(false)
    setOtpStep(false)
    setForgotStep(null)
    setResetPhone("")
    setResetOtp(["", "", "", "", "", ""])
  }

  function renderPanel(title, children) {
    return (
      <Overlay
        ariaLabel={title}
        backdropClassName="z-[90] grid p-0 md:place-items-center md:p-4"
        className="flex h-full w-full flex-col overflow-auto bg-white p-5 shadow-2xl md:h-auto md:max-w-md md:rounded-2xl dark:bg-neutral-900"
        onClose={close}
        open={open}
      >
        <header className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-neutral-900 dark:text-white">{title}</h2>
          <button className="grid h-10 w-10 place-items-center rounded-full border border-neutral-200 dark:border-neutral-700" onClick={close} type="button" aria-label={t("ui.close")}>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        {children}
        <AngkorWatSilhouette />
      </Overlay>
    )
  }

  function completePendingAction() {
    if (!pendingAction) return
    if (pendingAction.type === "post") togglePostModal(true)
    if (pendingAction.type === "dashboard" || pendingAction.type === "message") navigate("/dashboard")
    if (pendingAction.type === "save" && pendingAction.listingId) toggleSaved(pendingAction.listingId)
    if (pendingAction.type === "saveSearch") saveSearch(pendingAction.query, pendingAction.filters)
    setPendingAction(null)
  }

  async function submitLogin(event) {
    event.preventDefault()
    const normalizedPhone = validateAuthPhone()
    if (!normalizedPhone) return
    try {
      await login(normalizedPhone, form.password)
      toast.success(t("auth.welcome"))
      close()
      completePendingAction()
    } catch {
      return
    }
  }

  async function submitRegister(event) {
    event.preventDefault()
    const normalizedPhone = validateAuthPhone()
    if (!normalizedPhone) return
    if (form.password !== form.confirmPassword) {
      toast.error(t("auth.passwordMismatch"))
      return
    }
    if (!form.terms) {
      toast.error(t("auth.requiredTerms"))
      return
    }
    try {
      await register({
        name: form.name,
        phone: normalizedPhone,
        password: form.password,
        language: form.language,
      })
      await sendOtp(normalizedPhone)
      setLanguage(form.language)
      setOtpStep(true)
      setTimer(60)
      window.setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } catch {
      return
    }
  }

  async function submitOtp(event) {
    event.preventDefault()
    try {
      await verifyOTP(form.phone, otp.join(""))
      toast.success(t("auth.welcome"))
      close()
      completePendingAction()
    } catch {
      return
    }
  }

  async function submitForgotPhone(event) {
    event.preventDefault()
    const normalizedPhone = validateAuthPhone("resetPhone")
    if (!normalizedPhone) return
    try {
      await sendOtp(normalizedPhone)
      setForgotStep("otp")
      setTimer(60)
      window.setTimeout(() => resetOtpRefs.current[0]?.focus(), 50)
    } catch {
      return
    }
  }

  async function submitResetOtp(event) {
    event.preventDefault()
    try {
      // Verify OTP — real backend will also send a temporary password via SMS
      await verifyOTP(resetPhone, resetOtp.join(""))
      toast.success(t("auth.passwordReset"))
      close()
    } catch {
      return
    }
  }

  function updateOtp(index, value) {
    const digit = value.replace(/\D/g, "").slice(0, 1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)
    if (digit && index < otp.length - 1) otpRefs.current[index + 1]?.focus()
  }

  function updateResetOtp(index, value) {
    const digit = value.replace(/\D/g, "").slice(0, 1)
    const next = [...resetOtp]
    next[index] = digit
    setResetOtp(next)
    if (digit && index < resetOtp.length - 1) resetOtpRefs.current[index + 1]?.focus()
  }

  function handleOtpPaste(event, setterFn, refsList) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!pasted) return
    event.preventDefault()
    const digits = pasted.split("")
    setterFn(digits.concat(Array(6 - digits.length).fill("")))
    refsList.current[Math.min(digits.length, 5)]?.focus()
  }

  async function handleResend() {
    try {
      await sendOtp(form.phone)
      setTimer(60)
      toast.success(t("auth.otpResent"))
    } catch {
      return
    }
  }

  async function handleResetResend() {
    try {
      await sendOtp(resetPhone)
      setTimer(60)
      toast.success(t("auth.otpResent"))
    } catch {
      return
    }
  }

  function handleSocialPlaceholder() {
    toast(t("auth.comingSoon"))
  }

  function renderSocialLoginOptions() {
    return (
      <div>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center text-xs text-neutral-400">
            <span className="bg-white px-3">{t("auth.orContinueWith")}</span>
          </div>
        </div>
        <div className="grid gap-2">
          <Button
            className="w-full border border-neutral-200 text-sky-600 hover:border-sky-500 hover:bg-sky-500 hover:text-white"
            onClick={handleSocialPlaceholder}
            type="button"
            variant="ghost"
          >
            <TelegramIcon />
            {t("auth.telegramLogin")}
          </Button>
          <Button
            className="w-full border border-neutral-200 text-blue-600 hover:border-blue-600 hover:bg-blue-600 hover:text-white"
            onClick={handleSocialPlaceholder}
            type="button"
            variant="ghost"
          >
            <FacebookIcon />
            {t("auth.facebookLogin")}
          </Button>
          <Button
            className="w-full border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            onClick={handleSocialPlaceholder}
            type="button"
            variant="ghost"
          >
            <GoogleIcon />
            {t("auth.googleLogin")}
          </Button>
        </div>
      </div>
    )
  }

  // ── Forgot Password — Phone step ──────────────────────────────────────────
  if (forgotStep === "phone") {
    return renderPanel(t("auth.forgotTitle"), (
      <form className="mt-5 grid gap-4" onSubmit={submitForgotPhone}>
        <p className="text-sm font-semibold text-neutral-500">{t("auth.forgotHelp")}</p>
        <label className="grid gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-200">
          {t("auth.phone")}
          <span className="flex overflow-hidden rounded-xl border border-neutral-200 focus-within:border-primary dark:border-neutral-700 dark:bg-neutral-800">
            <span className="grid h-11 place-items-center border-r border-neutral-200 px-3 text-sm font-black text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">+855</span>
            <input
              className="h-11 min-w-0 flex-1 bg-transparent px-3 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
              inputMode="tel"
              onBlur={() => validateAuthPhone("resetPhone")}
              onChange={(event) => {
                setResetPhone(event.target.value)
                setPhoneErrors((current) => ({ ...current, resetPhone: null }))
              }}
              required
              value={resetPhone}
            />
          </span>
          {phoneErrors.resetPhone ? <span className="text-xs text-red-600">{phoneErrors.resetPhone}</span> : null}
        </label>
        <Button loading={loading} type="submit">{t("ui.continue")}</Button>
        <button className="justify-self-start text-sm font-black text-primary" onClick={() => setForgotStep(null)} type="button">{t("auth.backToLogin")}</button>
      </form>
    ))
  }

  // ── Forgot Password — OTP step ────────────────────────────────────────────
  if (forgotStep === "otp") {
    return renderPanel(t("auth.forgotTitle"), (
      <form className="mt-6 grid gap-5" onSubmit={submitResetOtp}>
        <p className="text-sm font-semibold leading-6 text-neutral-500">{t("auth.resetOtpHelp")}</p>
        <div className="grid grid-cols-6 gap-2">
          {resetOtp.map((digit, index) => (
            <input
              aria-label={`${t("auth.otpTitle")} ${index + 1}`}
              className="h-12 rounded-xl border border-neutral-200 text-center text-lg font-black outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
              inputMode="numeric"
              key={index}
              onChange={(event) => updateResetOtp(index, event.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !digit && index > 0) {
                  e.preventDefault()
                  resetOtpRefs.current[index - 1]?.focus()
                }
              }}
              onPaste={(event) => handleOtpPaste(event, setResetOtp, resetOtpRefs)}
              pattern="[0-9]*"
              ref={(element) => { resetOtpRefs.current[index] = element }}
              value={digit}
            />
          ))}
        </div>
        <button className="justify-self-start text-sm font-black text-primary disabled:text-neutral-400" disabled={timer > 0} onClick={handleResetResend} type="button">
          {timer > 0 ? t("auth.resendIn", { seconds: timer }) : t("auth.resend")}
        </button>
        <Button loading={loading} type="submit">{t("auth.verifyPhone")}</Button>
      </form>
    ))
  }

  return renderPanel(otpStep ? t("auth.otpTitle") : t("auth.login"), (
    <>
        {!otpStep ? (
          <>
            <div className="mt-5 grid grid-cols-2 rounded-xl bg-neutral-100 p-1">
              {[
                ["login", t("auth.login")],
                ["register", t("auth.register")],
              ].map(([value, label]) => (
                <button className={`rounded-lg px-3 py-2 text-sm font-black ${tab === value ? "bg-white text-primary shadow-sm" : "text-neutral-500"}`} key={value} onClick={() => setTab(value)} type="button">
                  {label}
                </button>
              ))}
            </div>

            <form className="mt-5 grid gap-4" onSubmit={tab === "login" ? submitLogin : submitRegister}>
              {tab === "register" ? (
                <label className="grid gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-200">
                  {t("auth.fullName")}
                  <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500" onChange={(event) => update("name", event.target.value)} required value={form.name} />
                </label>
              ) : null}
              <label className="grid gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-200">
                {t("auth.phone")}
                <span className="flex overflow-hidden rounded-xl border border-neutral-200 focus-within:border-primary dark:border-neutral-700 dark:bg-neutral-800">
                  <span className="grid h-11 place-items-center border-r border-neutral-200 px-3 text-sm font-black text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">+855</span>
                  <input
                    className="h-11 min-w-0 flex-1 px-3 outline-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500 bg-transparent"
                    inputMode="tel"
                    onBlur={() => validateAuthPhone()}
                    onChange={(event) => update("phone", event.target.value)}
                    required
                    value={form.phone}
                  />
                </span>
                {phoneErrors.phone ? <span className="text-xs text-red-600">{phoneErrors.phone}</span> : null}
              </label>
              <label className="grid gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-200">
                {t("auth.password")}
                <span className="flex overflow-hidden rounded-xl border border-neutral-200 focus-within:border-primary dark:border-neutral-700 dark:bg-neutral-800">
                  <input className="h-11 min-w-0 flex-1 px-3 outline-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500 bg-transparent" onChange={(event) => update("password", event.target.value)} required type={showPassword ? "text" : "password"} value={form.password} />
                  <button className="grid h-11 w-11 place-items-center text-neutral-500 dark:bg-neutral-800" onClick={() => setShowPassword((value) => !value)} type="button" aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}>
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </span>
              </label>
              {tab === "login" ? (
                <button className="justify-self-start text-sm font-black text-primary" onClick={() => setForgotStep("phone")} type="button">
                  {t("auth.forgotPassword")}
                </button>
              ) : (
                <>
                  <label className="grid gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-200">
                    {t("auth.confirmPassword")}
                    <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500" onChange={(event) => update("confirmPassword", event.target.value)} required type={showPassword ? "text" : "password"} value={form.confirmPassword} />
                  </label>
                  <div>
                    <p className="mb-2 text-sm font-bold text-neutral-700">{t("auth.languagePreference")}</p>
                    <div className="flex gap-2">
                      {["km", "en"].map((code) => (
                        <button className={`rounded-full px-4 py-2 text-sm font-black ${form.language === code ? "bg-primary text-white" : "bg-neutral-100 text-neutral-600"}`} key={code} onClick={() => update("language", code)} type="button">
                          {t(`lang.${code}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-200">
                    <input checked={form.terms} onChange={(event) => update("terms", event.target.checked)} type="checkbox" />
                    {t("auth.terms")}
                  </label>
                </>
              )}
              <Button loading={loading} type="submit">
                {tab === "login" ? t("auth.continue") : t("auth.register")}
              </Button>
              {renderSocialLoginOptions()}
            </form>
          </>
        ) : (
          <form className="mt-6 grid gap-5" onSubmit={submitOtp}>
            <p className="text-sm font-semibold leading-6 text-neutral-500">{t("auth.otpHelp")}</p>
            <div className="grid grid-cols-6 gap-2">
              {otp.map((digit, index) => (
                <input
                  aria-label={`${t("auth.otpTitle")} ${index + 1}`}
                  className="h-12 rounded-xl border border-neutral-200 text-center text-lg font-black outline-none focus:border-primary dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                  inputMode="numeric"
                  key={index}
                  onChange={(event) => updateOtp(index, event.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !digit && index > 0) {
                      e.preventDefault()
                      otpRefs.current[index - 1]?.focus()
                    }
                  }}
                  onPaste={(event) => handleOtpPaste(event, setOtp, otpRefs)}
                  pattern="[0-9]*"
                  ref={(element) => { otpRefs.current[index] = element }}
                  value={digit}
                />
              ))}
            </div>
            <button className="justify-self-start text-sm font-black text-primary disabled:text-neutral-400" disabled={timer > 0} onClick={handleResend} type="button">
              {timer > 0 ? t("auth.resendIn", { seconds: timer }) : t("auth.resend")}
            </button>
            <Button loading={loading} type="submit">{t("auth.verifyPhone")}</Button>
          </form>
        )}
    </>
  ))
}
