import { useEffect, useMemo, useState } from "react"
import { Helmet } from "react-helmet-async"
import toast from "react-hot-toast"
import { BadgeCheck, Camera, Copy, Eye, ListChecks, Lock, Send, ShieldAlert } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import ListingCard from "../components/listing/ListingCard"
import PageTransition from "../components/ui/PageTransition"
import Button from "../components/ui/Button"
import Modal from "../components/ui/Modal"
import { useTranslation } from "../hooks/useTranslation"
import { PROVINCES } from "../lib/locations"
import { selectIsPlusMember, useAuthStore } from "../store/useAuthStore"
import { useNotificationStore } from "../store/useNotificationStore"
import { useUIStore } from "../store/useUIStore"
import { useUserStore } from "../store/useUserStore"

const PHONE_REGEX = /^\+855[1-9][0-9]{7,8}$/

function formatDate(value, language) {
  if (!value) return ""
  return new Date(value).toLocaleDateString(language === "km" ? "km-KH" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function initials(name = "") {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "BH"
}

export default function AccountPage() {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isPlusMember = useAuthStore(selectIsPlusMember)
  const logout = useAuthStore((state) => state.logout)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const profile = useUserStore((state) => state.profile)
  const profileLoading = useUserStore((state) => state.profileLoading)
  const error = useUserStore((state) => state.error)
  const fetchMe = useUserStore((state) => state.fetchMe)
  const updateProfile = useUserStore((state) => state.updateProfile)
  const changePassword = useUserStore((state) => state.changePassword)
  const uploadAvatar = useUserStore((state) => state.uploadAvatar)
  const savedListings = useUserStore((state) => state.savedListings)
  const fetchSavedListings = useUserStore((state) => state.fetchSavedListings)
  const verificationStatus = useUserStore((state) => state.verificationStatus)
  const sendPhoneOTP = useUserStore((state) => state.sendPhoneOTP)
  const verifyPhoneOTP = useUserStore((state) => state.verifyPhoneOTP)
  const fetchSellerVerification = useUserStore((state) => state.fetchSellerVerification)
  const submitSellerVerification = useUserStore((state) => state.submitSellerVerification)
  const connectTelegram = useUserStore((state) => state.connectTelegram)
  const deleteAccount = useUserStore((state) => state.deleteAccount)
  const referral = useUserStore((state) => state.referral)
  const fetchReferral = useUserStore((state) => state.fetchReferral)
  const generateReferral = useUserStore((state) => state.generateReferral)
  const pushEnabled = useNotificationStore((state) => state.pushEnabled)
  const enablePushNotifications = useNotificationStore((state) => state.enablePushNotifications)
  const [form, setForm] = useState({ name: "", phone: "", province: "" })
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [otpCode, setOtpCode] = useState("")
  const [idFront, setIdFront] = useState(null)
  const [idBack, setIdBack] = useState(null)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [saved, setSaved] = useState("")
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      toggleAuthModal(true)
      return
    }
    fetchMe()
    fetchSavedListings()
    fetchSellerVerification()
    fetchReferral()
  }, [fetchMe, fetchReferral, fetchSavedListings, fetchSellerVerification, isAuthenticated, toggleAuthModal])

  useEffect(() => {
    if (!profile) return undefined
    let cancelled = false
    Promise.resolve().then(() => {
      if (cancelled) return
      setForm({
        name: profile.name || "",
        phone: profile.phone || "",
        province: profile.province || "all",
      })
    })
    return () => {
      cancelled = true
    }
  }, [profile])

  const phoneInvalid = phoneTouched && form.phone && !PHONE_REGEX.test(form.phone)
  const avatar = profile?.avatar || profile?.avatarUrl
  const stats = useMemo(() => [
    [t("account.totalListings"), profile?.totalListings || 0, ListChecks],
    [t("account.totalViews"), profile?.totalViews || 0, Eye],
  ], [profile, t])
  const savedPreview = useMemo(() => savedListings.slice(0, 4), [savedListings])

  async function submitProfile(event) {
    event.preventDefault()
    setPhoneTouched(true)
    if (form.phone && !PHONE_REGEX.test(form.phone)) return
    const updated = await updateProfile(form)
    if (updated) setSaved("profile")
  }

  async function submitPassword(event) {
    event.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) {
      setSaved("password-mismatch")
      return
    }
    const result = await changePassword(passwords)
    if (result?.success) {
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setSaved("password")
    }
  }

  async function changeAvatar(event) {
    const file = event.target.files?.[0]
    if (file) await uploadAvatar(file)
  }

  async function requestOtp() {
    if (form.phone && PHONE_REGEX.test(form.phone)) {
      const result = await sendPhoneOTP(form.phone)
      if (result?.success) setSaved("otp-sent")
    }
  }

  async function submitOtp(event) {
    event.preventDefault()
    const result = await verifyPhoneOTP(form.phone, otpCode)
    if (result?.success) {
      setSaved("phone-verified")
      fetchMe()
    }
  }

  async function submitVerification(event) {
    event.preventDefault()
    if (!idFront) return
    const result = await submitSellerVerification({ idFront, idBack })
    if (result?.status) setSaved("verification")
  }

  async function startTelegramConnect() {
    const result = await connectTelegram()
    if (result?.link) {
      window.open(result.link, "_blank", "noopener,noreferrer")
    }
  }

  async function startPushConnect() {
    const result = await enablePushNotifications()
    if (result?.success) setSaved("push")
  }

  async function ensureReferralLink() {
    const result = referral?.referralCode ? referral : await generateReferral()
    if (!result?.referralCode) return null
    return `https://bayonhub.com/join?ref=${encodeURIComponent(result.referralCode)}`
  }

  async function copyReferralLink() {
    const link = await ensureReferralLink()
    if (!link) return
    await navigator.clipboard?.writeText(link)
    setSaved("referral")
  }

  function closeDeleteModal() {
    if (deleteLoading) return
    setDeleteModalOpen(false)
    setDeleteConfirm("")
  }

  async function submitDeleteAccount() {
    if (deleteConfirm !== "DELETE") return
    setDeleteLoading(true)
    const result = await deleteAccount()
    if (result?.success) {
      try {
        await logout()
      } finally {
        toast.success(t("account.deleteSuccess"))
        navigate("/")
      }
      return
    }
    setDeleteLoading(false)
    toast.error(t("account.deleteError"))
  }

  if (!isAuthenticated) {
    return (
      <PageTransition className="mx-auto grid min-h-[60vh] max-w-7xl place-items-center px-4 py-10 text-center">
        <p className="font-bold text-neutral-500">{t("auth.unauthenticated")}</p>
      </PageTransition>
    )
  }

  if (profileLoading && !profile) {
    return (
      <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-4">
          <div className="h-40 animate-pulse rounded-2xl bg-neutral-100" />
          <div className="h-64 animate-pulse rounded-2xl bg-neutral-100" />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Helmet>
        <title>{t("account.profile")} | BayonHub</title>
      </Helmet>
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <label className="group mx-auto grid h-28 w-28 cursor-pointer place-items-center overflow-hidden rounded-full bg-primary/10 text-2xl font-black text-primary">
            {avatar ? <img alt={t("account.avatar")} className="h-full w-full object-cover" loading="lazy" src={avatar} /> : initials(profile?.name)}
            <input accept="image/*" className="sr-only" onChange={changeAvatar} type="file" />
            <span className="absolute rounded-full bg-neutral-950/70 p-2 text-white opacity-0 transition group-hover:opacity-100">
              <Camera className="h-5 w-5" aria-hidden="true" />
            </span>
          </label>
          <h1 className="mt-4 text-center text-2xl font-black text-neutral-900">{profile?.name || t("account.profile")}</h1>
          <p className="mt-1 text-center text-sm font-bold text-neutral-500">{profile?.phone}</p>
          <p className="mt-1 text-center text-sm font-bold text-neutral-500">
            {t("account.memberSince")}: {formatDate(profile?.memberSince || profile?.createdAt, language)}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {stats.map(([label, value, Icon]) => (
              <div className="rounded-xl bg-neutral-50 p-3 text-center" key={label}>
                <Icon className="mx-auto h-5 w-5 text-primary" aria-hidden="true" />
                <p className="mt-2 text-xl font-black text-neutral-900">{Number(value).toLocaleString()}</p>
                <p className="text-xs font-black text-neutral-500">{label}</p>
              </div>
            ))}
          </div>
          {!isPlusMember ? (
            <Link className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-dark" to="/upgrade">
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              {t("plus.upgradeCta")}
            </Link>
          ) : (
            <div className="mt-5 rounded-xl bg-primary/10 p-3 text-center text-sm font-black text-primary">
              {t("plus.active")}
            </div>
          )}
        </aside>

        <main className="grid gap-6">
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-neutral-900">{t("referral.title")}</h2>
                <p className="mt-1 text-sm font-bold text-neutral-500">{t("referral.invite")}</p>
              </div>
              <Button onClick={copyReferralLink} size="sm" type="button" variant="secondary">
                <Copy className="h-4 w-4" aria-hidden="true" />
                {saved === "referral" ? t("referral.copied") : t("referral.copy")}
              </Button>
            </div>
            <div className="mt-5 rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-neutral-500">{t("referral.yourLink")}</p>
              <p className="mt-2 break-all text-sm font-black text-neutral-900">
                {referral?.referralCode ? `https://bayonhub.com/join?ref=${referral.referralCode}` : t("referral.howItWorks")}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-2xl font-black text-neutral-900">{Number(referral?.referralCount || 0).toLocaleString()}</p>
                  <p className="text-xs font-black text-neutral-500">{t("referral.friendsJoined")}</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">
                    {referral?.rewardEarned ? t("referral.rewardEarned") : t("referral.invite")}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-neutral-900">{t("account.editProfile")}</h2>
            {error ? <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}
            {saved === "profile" ? <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{t("account.saved")}</p> : null}
            <form className="mt-5 grid gap-4" onSubmit={submitProfile}>
              <label className="grid gap-2 text-sm font-bold text-neutral-700">
                {t("account.name")}
                <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} value={form.name} />
              </label>
              <label className="grid gap-2 text-sm font-bold text-neutral-700">
                {t("account.phone")}
                <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onBlur={() => setPhoneTouched(true)} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} value={form.phone} />
                {phoneInvalid ? <span className="text-xs font-bold text-red-600">{t("account.phoneInvalid")}</span> : null}
              </label>
              <label className="grid gap-2 text-sm font-bold text-neutral-700">
                {t("account.province")}
                <select className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => setForm((current) => ({ ...current, province: event.target.value }))} value={form.province}>
                  <option value="all">{t("nav.allCambodia")}</option>
                  {PROVINCES.map((province) => (
                    <option key={province.id} value={province.label.en}>{province.label[language]}</option>
                  ))}
                </select>
              </label>
              {!isPlusMember ? (
                <div className="grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold text-neutral-700" title={t("plus.plusRequired")}>
                    <span className="inline-flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" aria-hidden="true" />
                      {t("listing.whatsapp")}
                    </span>
                    <input className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-neutral-400" disabled placeholder={t("plus.plusRequired")} />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-neutral-700" title={t("plus.plusRequired")}>
                    <span className="inline-flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" aria-hidden="true" />
                      {t("listing.telegram")}
                    </span>
                    <input className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-neutral-400" disabled placeholder={t("plus.plusRequired")} />
                  </label>
                </div>
              ) : null}
              <Button disabled={profileLoading || phoneInvalid} type="submit">{t("account.save")}</Button>
            </form>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-black text-neutral-900">{t("saved.title")}</h2>
              <Link className="text-sm font-black text-primary hover:underline" to="/saved">
                {t("home.viewAll")}
              </Link>
            </div>
            {savedPreview.length ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {savedPreview.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm font-bold text-neutral-500">
                {t("saved.empty")}
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-xl font-black text-neutral-900">{t("account.changePassword")}</h2>
            </div>
            {saved === "password" ? <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{t("account.passwordChanged")}</p> : null}
            {saved === "password-mismatch" ? <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{t("account.passwordMismatch")}</p> : null}
            <form className="mt-5 grid gap-4" onSubmit={submitPassword}>
              <input aria-label={t("account.currentPassword")} className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))} type="password" value={passwords.currentPassword} />
              <input aria-label={t("account.newPassword")} className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))} type="password" value={passwords.newPassword} />
              <input aria-label={t("account.confirmPassword")} className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))} type="password" value={passwords.confirmPassword} />
              <Button type="submit">{t("account.save")}</Button>
            </form>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-xl font-black text-neutral-900">{t("verify.getVerified")}</h2>
            </div>
            <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-black text-neutral-800">
                  <Send className="h-4 w-4 text-primary" aria-hidden="true" />
                  {profile?.telegramChatId ? t("notif.telegramConnected") : t("notif.connectTelegram")}
                </div>
                <Button disabled={Boolean(profile?.telegramChatId)} onClick={startTelegramConnect} size="sm" type="button" variant="secondary">
                  {profile?.telegramChatId ? t("notif.telegramConnected") : t("notif.connectTelegram")}
                </Button>
              </div>
              <div className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-black text-neutral-800">
                  <Send className="h-4 w-4 text-primary" aria-hidden="true" />
                  {pushEnabled || saved === "push" ? t("notif.pushEnabled") : t("notif.enablePush")}
                </div>
                <Button disabled={pushEnabled || saved === "push"} onClick={startPushConnect} size="sm" type="button" variant="secondary">
                  {pushEnabled || saved === "push" ? t("notif.pushEnabled") : t("notif.enablePush")}
                </Button>
              </div>
            </div>
            {!profile?.phoneVerified ? (
              <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={submitOtp}>
                <Button disabled={phoneInvalid || !form.phone} onClick={requestOtp} type="button" variant="secondary">
                  {t("verify.sendOTP")}
                </Button>
                <input
                  aria-label={t("verify.enterCode")}
                  className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary"
                  maxLength={6}
                  onChange={(event) => setOtpCode(event.target.value)}
                  placeholder={t("verify.enterCode")}
                  value={otpCode}
                />
                {saved === "otp-sent" ? <p className="text-sm font-bold text-emerald-700 sm:col-span-2">{t("verify.enterCode")}</p> : null}
                <Button disabled={!otpCode || otpCode.length < 6} type="submit">{t("verify.submitOtp")}</Button>
              </form>
            ) : (
              <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{t("verify.verified")}</p>
            )}

            {!profile?.isVerifiedSeller ? (
              <form className="mt-5 grid gap-4" onSubmit={submitVerification}>
                <p className="text-sm font-bold text-neutral-500">
                  {verificationStatus?.status === "pending" ? t("verify.pending") : t("verify.uploadID")}
                </p>
                {verificationStatus?.status === "rejected" ? (
                  <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
                    {t("verify.rejected")}: {verificationStatus?.adminNote || t("ui.error")}
                  </p>
                ) : null}
                <label className="grid gap-2 text-sm font-bold text-neutral-700">
                  {t("verify.idFront")}
                  <input accept="image/*" onChange={(event) => setIdFront(event.target.files?.[0] || null)} type="file" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-neutral-700">
                  {t("verify.idBack")}
                  <input accept="image/*" onChange={(event) => setIdBack(event.target.files?.[0] || null)} type="file" />
                </label>
                <Button disabled={!idFront || verificationStatus?.status === "pending"} type="submit">
                  {t("verify.submitVerification")}
                </Button>
              </form>
            ) : (
              <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{t("seller.verified")}</p>
            )}
          </section>

          <section className="rounded-2xl border border-red-100 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-1 h-5 w-5 text-red-700" aria-hidden="true" />
              <div>
                <h2 className="text-xl font-black text-red-700">{t("account.dangerZone")}</h2>
                <p className="mt-1 text-sm font-bold text-red-700/80">{t("account.deleteWarning")}</p>
              </div>
            </div>
            <Button className="mt-4 border-red-300 text-red-700 hover:border-red-600 hover:bg-red-100 hover:text-red-800" onClick={() => setDeleteModalOpen(true)} variant="secondary">
              {t("account.deleteAccount")}
            </Button>
          </section>
        </main>
      </div>
      <Modal open={deleteModalOpen} onClose={closeDeleteModal} title={t("account.deleteAccount")} size="sm">
        <div className="grid gap-4">
          <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{t("account.deleteWarning")}</p>
          <p className="text-sm font-bold leading-6 text-neutral-600">{t("account.deleteImpact")}</p>
          <input
            className="h-11 rounded-xl border border-neutral-200 px-3 font-bold outline-none focus:border-primary"
            onChange={(event) => setDeleteConfirm(event.target.value)}
            placeholder={t("account.deleteConfirm")}
            value={deleteConfirm}
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button disabled={deleteLoading} onClick={closeDeleteModal} type="button" variant="secondary">
              {t("ui.cancel")}
            </Button>
            <Button disabled={deleteConfirm !== "DELETE"} loading={deleteLoading} onClick={submitDeleteAccount} type="button" variant="danger">
              {t("account.deleteAccount")}
            </Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  )
}
