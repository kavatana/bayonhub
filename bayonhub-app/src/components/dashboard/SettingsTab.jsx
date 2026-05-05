import { useEffect, useState } from "react"
import { LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { changePassword, updateProfile } from "../../api/users"
import { useTranslation } from "../../hooks/useTranslation"
import { validatePhone } from "../../lib/validation"
import { useAuthStore } from "../../store/useAuthStore"
import { useUIStore } from "../../store/useUIStore"
import Button from "../ui/Button"
export default function SettingsTab() {
  const { t, language } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const setLanguage = useUIStore((state) => state.setLanguage)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const [form, setForm] = useState({
    avatar: user?.avatar || "",
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    notifications: user?.notifications || { leads: true, messages: true, promotions: false },
  })
  const [phoneError, setPhoneError] = useState("")
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setForm((current) => ({
        ...current,
        avatar: user?.avatarUrl || user?.avatar || "",
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        notifications: user?.notifications || current.notifications,
      }))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [user])

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function save() {
    const phoneResult = validatePhone(form.phone)
    if (!phoneResult.valid) {
      setPhoneError(t(`validation.${phoneResult.error}`))
      return
    }
    if (form.newPassword || form.currentPassword || form.confirmPassword) {
      if (form.newPassword !== form.confirmPassword) {
        toast.error(t("auth.passwordMismatch"))
        return
      }
    }
    setSaving(true)
    try {
      const updatedUser = await updateProfile({
        avatarUrl: form.avatar,
        name: form.name,
        email: form.email,
        phone: phoneResult.normalized,
        language,
        notifications: form.notifications,
      })
      updateUser({
        ...updatedUser,
        avatar: updatedUser.avatarUrl || form.avatar,
        phone: phoneResult.normalized,
        notifications: form.notifications,
      })
      if (form.newPassword && form.currentPassword) {
        await changePassword(form.currentPassword, form.newPassword)
      }
      setForm((current) => ({
        ...current,
        phone: phoneResult.normalized,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
      setPhoneError("")
      toast.success(t("dashboard.savedSuccess"))
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || t("ui.error"))
    } finally {
      setSaving(false)
    }
  }


  function handleAvatar(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.addEventListener("load", () => update("avatar", reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-4">
        <label className="grid h-24 w-24 cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed border-neutral-300 bg-neutral-50 text-center text-xs font-bold text-neutral-500">
          {form.avatar ? <img alt={t("dashboard.displayName")} className="h-full w-full object-cover" src={form.avatar} /> : t("dashboard.displayName")}
          <input accept="image/*" className="hidden" onChange={handleAvatar} type="file" />
        </label>
        <div>
          <p className="font-black text-neutral-900">{form.phone || t("auth.phone")}</p>
          <p className="mt-1 text-sm font-bold text-primary">{user?.verified ? t("auth.verified") : t("auth.verifyPhone")}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-neutral-700">
          {t("dashboard.displayName")}
          <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => update("name", event.target.value)} value={form.name} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-neutral-700">
          {t("dashboard.email")}
          <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => update("email", event.target.value)} type="email" value={form.email} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-neutral-700">
          {t("auth.phone")}
          <input
            className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary"
            inputMode="tel"
            onBlur={() => {
              const phoneResult = validatePhone(form.phone)
              if (phoneResult.valid) {
                update("phone", phoneResult.normalized)
                setPhoneError("")
              } else {
                setPhoneError(t(`validation.${phoneResult.error}`))
              }
            }}
            onChange={(event) => {
              update("phone", event.target.value)
              setPhoneError("")
            }}
            value={form.phone}
          />
          {phoneError ? <span className="text-xs text-red-600">{phoneError}</span> : null}
        </label>
      </div>
      <section>
        <h3 className="mb-3 font-black text-neutral-900">{t("auth.languagePreference")}</h3>
        <div className="flex gap-3">
          {["en", "km"].map((code) => (
            <button className={`rounded-full px-4 py-2 text-sm font-black ${language === code ? "bg-primary text-white" : "bg-white text-neutral-700"}`} key={code} onClick={() => setLanguage(code)} type="button">
              {t(`lang.${code}`)}
            </button>
          ))}
        </div>
      </section>
      <Button className="justify-self-start" onClick={() => toggleAuthModal(true)} variant="secondary">{t("auth.verifyPhone")}</Button>
      <section className={`grid gap-4 rounded-2xl border border-neutral-200 bg-white p-4 ${language === "km" ? "font-khmer leading-8" : ""}`}>
        <div>
          <h3 className="font-black text-neutral-900">{t("kyc.title")}</h3>
          <p className="mt-1 text-sm font-semibold text-neutral-500">{t("kyc.goToVerification")}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate("/dashboard?tab=verification")} className="justify-self-start">
          {t("kyc.openVerification")}
        </Button>
      </section>
      <section className="grid gap-4">
        <h3 className="font-black text-neutral-900">{t("dashboard.changePassword")}</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["currentPassword", t("dashboard.currentPassword")],
            ["newPassword", t("dashboard.newPassword")],
            ["confirmPassword", t("auth.confirmPassword")],
          ].map(([name, label]) => (
            <label className="grid gap-2 text-sm font-bold text-neutral-700" key={name}>
              {label}
              <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => update(name, event.target.value)} type="password" value={form[name]} />
            </label>
          ))}
        </div>
      </section>
      <section>
        <h3 className="mb-3 font-black text-neutral-900">{t("dashboard.notificationPrefs")}</h3>
        <div className="grid gap-2">
          {Object.entries(form.notifications).map(([name, checked]) => (
            <label className="flex items-center justify-between rounded-xl bg-white p-3 text-sm font-bold text-neutral-700" key={name}>
              {t(`pref.${name}`)}
              <input checked={checked} onChange={(event) => update("notifications", { ...form.notifications, [name]: event.target.checked })} type="checkbox" />
            </label>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-red-100 bg-red-50 p-4">
        <h3 className="font-black text-red-700">{t("dashboard.dangerZone")}</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button 
            onClick={() => {
              logout()
              navigate("/")
              toast.success(t("auth.loggedOut") || "Logged out")
            }} 
            variant="secondary" 
            className="text-red-600 hover:bg-red-100"
          >
            <LogOut className="h-4 w-4" />
            {t("nav.logout")}
          </Button>
          <Button onClick={() => setDeactivateOpen(true)} variant="danger">{t("dashboard.deactivate")}</Button>
        </div>
        {deactivateOpen ? (
          <div className="mt-3 flex gap-2">
            <Button onClick={() => setDeactivateOpen(false)} size="sm" variant="secondary">{t("ui.cancel")}</Button>
            <Button onClick={() => setDeactivateOpen(false)} size="sm" variant="danger">{t("ui.confirm")}</Button>
          </div>
        ) : null}
      </section>
      <Button className="justify-self-start" loading={saving} onClick={save}>{t("ui.save")}</Button>
    </div>
  )
}
